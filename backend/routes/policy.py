
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.routes.auth import bearer_scheme, get_current_user
from backend.optimization.allocation_optimizer import optimize_allocation


router = APIRouter()

# Locate the project datasets
PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
SCORE_FILE = PROJECT_DIR / "outputs" / "overall_district_need_scores.csv"
POPULATION_FILE = PROJECT_DIR / "data" / "Population_Integrated_Analysis.csv"


def load_policy_data():
    """Load and validate sector scores and population shares."""

    if not SCORE_FILE.exists():
        raise FileNotFoundError(f"Sector score file not found: {SCORE_FILE}")

    if not POPULATION_FILE.exists():
        raise FileNotFoundError(
            f"Population data file not found: {POPULATION_FILE}"
        )

    scores = pd.read_csv(SCORE_FILE)
    population = pd.read_csv(POPULATION_FILE)

    score_columns = [
        "district",
        "education_need_score",
        "water_need_score",
        "healthcare_need_score"
    ]

    population_columns = [
        "district",
        "population_share_percent"
    ]

    for column in score_columns:
        if column not in scores.columns:
            raise ValueError(f"Missing sector score column: {column}")

    for column in population_columns:
        if column not in population.columns:
            raise ValueError(f"Missing population column: {column}")

    scores = scores[score_columns].copy()
    population = population[population_columns].copy()

    if scores["district"].duplicated().any():
        raise ValueError("Duplicate districts in sector scores.")

    if population["district"].duplicated().any():
        raise ValueError("Duplicate districts in population data.")

    if set(scores["district"]) != set(population["district"]):
        raise ValueError("Districts do not match between datasets.")

    for column in score_columns[1:]:
        scores[column] = pd.to_numeric(scores[column], errors="coerce")

    population["population_share_percent"] = pd.to_numeric(
        population["population_share_percent"],
        errors="coerce"
    )

    numeric_columns = score_columns[1:] + ["population_share_percent"]

    if scores[score_columns[1:]].isnull().any().any():
        raise ValueError("Sector scores contain missing or invalid values.")

    if population["population_share_percent"].isnull().any():
        raise ValueError("Population shares contain missing values.")

    if (scores[score_columns[1:]] < 0).any().any():
        raise ValueError("Sector scores cannot be negative.")

    if (population["population_share_percent"] < 0).any():
        raise ValueError("Population shares cannot be negative.")

    if population["population_share_percent"].sum() <= 0:
        raise ValueError("Population shares must have a positive total.")

    return scores.merge(
        population,
        on="district",
        how="inner",
        validate="one_to_one"
    )


POLICY_DATA = load_policy_data()


class PolicyWeightRequest(BaseModel):
    education_weight: float = Field(ge=0, le=100)
    water_weight: float = Field(ge=0, le=100)
    healthcare_weight: float = Field(ge=0, le=100)

    # Optional allocation settings
    budget_crore: float | None = Field(default=None, gt=0)

    need_weight: float = Field(default=70, ge=0, le=100)
    population_weight: float = Field(default=30, ge=0, le=100)

    min_allocation_crore: float = Field(default=20, ge=0)
    max_allocation_crore: float = Field(default=70, gt=0)


@router.post("/policy/weights")
def calculate_policy_weights(
    request: PolicyWeightRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    sector_weight_total = (
        request.education_weight
        + request.water_weight
        + request.healthcare_weight
    )

    if abs(sector_weight_total - 100) > 1e-6:
        raise HTTPException(
            status_code=400,
            detail="Education, Water and Healthcare weights must add up to 100."
        )

    if abs(request.need_weight + request.population_weight - 100) > 1e-6:
        raise HTTPException(
            status_code=400,
            detail="Need and population weights must add up to 100."
        )

    if request.max_allocation_crore < request.min_allocation_crore:
        raise HTTPException(
            status_code=400,
            detail="Maximum allocation cannot be less than minimum allocation."
        )

    try:
        df = POLICY_DATA.copy()

        # 1. Calculate policy-weighted district need scores
        df["policy_need_score"] = (
            df["education_need_score"] * request.education_weight / 100
            + df["water_need_score"] * request.water_weight / 100
            + df["healthcare_need_score"] * request.healthcare_weight / 100
        )

        # 2. Calculate new district rankings
        df = df.sort_values(
            by="policy_need_score",
            ascending=False
        ).reset_index(drop=True)

        df["policy_priority_rank"] = (
            df["policy_need_score"]
            .rank(method="min", ascending=False)
            .astype(int)
        )

        # 3. Convert policy scores into need shares for the optimiser
        total_need_score = df["policy_need_score"].sum()

        if total_need_score <= 0:
            raise ValueError("Policy scores must have a positive total.")

        df["need_score_share_percent"] = (
            df["policy_need_score"] / total_need_score * 100
        )

        rankings = df[
            [
                "district",
                "education_need_score",
                "water_need_score",
                "healthcare_need_score",
                "policy_need_score",
                "policy_priority_rank"
            ]
        ].round(4).to_dict(orient="records")

        response = {
            "status": "success",
            "sector_weights": {
                "education": request.education_weight,
                "water": request.water_weight,
                "healthcare": request.healthcare_weight
            },
            "district_count": len(df),
            "rankings": rankings
        }

        # 4. Generate budget allocation only when a budget is supplied
        if request.budget_crore is not None:

            current_user = get_current_user(credentials, db)

            if current_user.role not in ("policy_maker", "admin"):
                raise HTTPException(
                    status_code=403,
                    detail="Only approved policy makers and admins can generate allocations."
                )

            optimizer_input = df[
                [
                    "district",
                    "population_share_percent",
                    "need_score_share_percent"
                ]
            ].copy()

            allocation_result = optimize_allocation(
                district_data=optimizer_input,
                budget_crore=request.budget_crore,
                need_weight=request.need_weight,
                population_weight=request.population_weight,
                min_allocation_crore=request.min_allocation_crore,
                max_allocation_crore=request.max_allocation_crore
            )

            allocation_result = allocation_result.sort_values(
                by="optimised_allocation_crore",
                ascending=False
            )

            response["allocation"] = {
                "budget_crore": request.budget_crore,
                "need_weight": request.need_weight,
                "population_weight": request.population_weight,
                "total_allocated_crore": round(
                    allocation_result[
                        "optimised_allocation_crore"
                    ].sum(),
                    4
                ),
                "allocations": allocation_result[
                    [
                        "district",
                        "combined_priority",
                        "target_allocation_crore",
                        "optimised_allocation_crore"
                    ]
                ].round(4).to_dict(orient="records")
            }

        return response

    except (ValueError, RuntimeError) as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
