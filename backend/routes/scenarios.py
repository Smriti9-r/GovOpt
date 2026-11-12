
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, SavedScenario
from backend.routes.auth import require_role
from backend.routes.policy import POLICY_DATA
from backend.optimization.allocation_optimizer import optimize_allocation


router = APIRouter(
    prefix="/scenarios",
    tags=["Saved Scenarios"]
)


class ScenarioCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)

    education_weight: float = Field(ge=0, le=100)
    water_weight: float = Field(ge=0, le=100)
    healthcare_weight: float = Field(ge=0, le=100)

    budget_crore: float = Field(gt=0)
    need_weight: float = Field(default=70, ge=0, le=100)
    population_weight: float = Field(default=30, ge=0, le=100)

    min_allocation_crore: float = Field(default=20, ge=0)
    max_allocation_crore: float = Field(default=70, gt=0)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Scenario name must contain at least 2 characters.")

        return value

class ScenarioUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Scenario name must contain at least 2 characters."
            )

        return value
class ScenarioCompareRequest(BaseModel):
    scenario_ids: list[int] = Field(
        min_length=2,
        max_length=5,
    )

    @field_validator("scenario_ids")
    @classmethod
    def validate_unique_ids(cls, value):
        if len(value) != len(set(value)):
            raise ValueError(
                "Duplicate scenario IDs are not allowed."
            )

        return value

def scenario_summary(scenario):
    return {
        "id": scenario.id,
        "name": scenario.name,
        "budget_crore": scenario.budget_crore,
        "education_weight": scenario.education_weight,
        "water_weight": scenario.water_weight,
        "healthcare_weight": scenario.healthcare_weight,
        "need_weight": scenario.need_weight,
        "population_weight": scenario.population_weight,
        "created_at": scenario.created_at,
        "updated_at": scenario.updated_at,
    }


@router.post("")
def create_scenario(
    request: ScenarioCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("policy_maker", "admin")
    ),
):
    sector_total = (
        request.education_weight
        + request.water_weight
        + request.healthcare_weight
    )

    if abs(sector_total - 100) > 1e-6:
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

        df["policy_need_score"] = (
            df["education_need_score"] * request.education_weight / 100
            + df["water_need_score"] * request.water_weight / 100
            + df["healthcare_need_score"] * request.healthcare_weight / 100
        )

        total_need_score = df["policy_need_score"].sum()

        if total_need_score <= 0:
            raise ValueError("Policy scores must have a positive total.")

        df["need_score_share_percent"] = (
            df["policy_need_score"] / total_need_score * 100
        )

        optimizer_input = df[
            [
                "district",
                "population_share_percent",
                "need_score_share_percent",
            ]
        ].copy()

        result = optimize_allocation(
            district_data=optimizer_input,
            budget_crore=request.budget_crore,
            need_weight=request.need_weight,
            population_weight=request.population_weight,
            min_allocation_crore=request.min_allocation_crore,
            max_allocation_crore=request.max_allocation_crore,
        )

        result = result.sort_values(
            by="optimised_allocation_crore",
            ascending=False,
        )

        allocations = [
            {
                "district": str(row["district"]),
                "combined_priority": float(row["combined_priority"]),
                "target_allocation_crore": float(
                    row["target_allocation_crore"]
                ),
                "optimised_allocation_crore": float(
                    row["optimised_allocation_crore"]
                ),
            }
            for _, row in result.iterrows()
        ]

        snapshot = {
            "sector_weights": {
                "education": request.education_weight,
                "water": request.water_weight,
                "healthcare": request.healthcare_weight,
            },
            "allocation": {
                "budget_crore": request.budget_crore,
                "need_weight": request.need_weight,
                "population_weight": request.population_weight,
                "min_allocation_crore": request.min_allocation_crore,
                "max_allocation_crore": request.max_allocation_crore,
                "total_allocated_crore": float(
                    result["optimised_allocation_crore"].sum()
                ),
                "allocations": allocations,
            },
        }

        scenario = SavedScenario(
            owner_id=current_user.id,
            name=request.name,
            education_weight=request.education_weight,
            water_weight=request.water_weight,
            healthcare_weight=request.healthcare_weight,
            need_weight=request.need_weight,
            population_weight=request.population_weight,
            budget_crore=request.budget_crore,
            min_allocation_crore=request.min_allocation_crore,
            max_allocation_crore=request.max_allocation_crore,
            result_snapshot=snapshot,
        )

        db.add(scenario)
        db.commit()
        db.refresh(scenario)

        return {
            "status": "success",
            "message": "Scenario saved successfully.",
            "scenario": scenario_summary(scenario),
            "result_snapshot": scenario.result_snapshot,
        }

    except (ValueError, RuntimeError) as error:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.get("")
def get_my_scenarios(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("policy_maker", "admin")
    ),
):
    scenarios = (
        db.query(SavedScenario)
        .filter(SavedScenario.owner_id == current_user.id)
        .order_by(SavedScenario.created_at.desc())
        .all()
    )

    return {
        "count": len(scenarios),
        "scenarios": [
            scenario_summary(scenario)
            for scenario in scenarios
        ],
    }


@router.get("/{scenario_id}")
def get_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("policy_maker", "admin")
    ),
):
    scenario = (
        db.query(SavedScenario)
        .filter(
            SavedScenario.id == scenario_id,
            SavedScenario.owner_id == current_user.id,
        )
        .first()
    )

    if not scenario:
        raise HTTPException(
            status_code=404,
            detail="Scenario not found.",
        )

    return {
        "scenario": scenario_summary(scenario),
        "result_snapshot": scenario.result_snapshot,
    }
@router.patch("/{scenario_id}")
def update_scenario(
    scenario_id: int,
    request: ScenarioUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("policy_maker", "admin")
    ),
):
    scenario = (
        db.query(SavedScenario)
        .filter(
            SavedScenario.id == scenario_id,
            SavedScenario.owner_id == current_user.id,
        )
        .first()
    )

    if not scenario:
        raise HTTPException(
            status_code=404,
            detail="Scenario not found.",
        )

    scenario.name = request.name

    db.commit()
    db.refresh(scenario)

    return {
        "status": "success",
        "message": "Scenario updated successfully.",
        "scenario": scenario_summary(scenario),
    }
@router.delete("/{scenario_id}")
def delete_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("policy_maker", "admin")
    ),
):
    scenario = (
        db.query(SavedScenario)
        .filter(
            SavedScenario.id == scenario_id,
            SavedScenario.owner_id == current_user.id,
        )
        .first()
    )

    if not scenario:
        raise HTTPException(
            status_code=404,
            detail="Scenario not found.",
        )

    db.delete(scenario)
    db.commit()

    return {
        "status": "success",
        "message": "Scenario deleted successfully.",
    }
@router.post("/compare")
def compare_scenarios(
    request: ScenarioCompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("policy_maker", "admin")
    ),
):
    scenarios = (
        db.query(SavedScenario)
        .filter(
            SavedScenario.id.in_(request.scenario_ids),
            SavedScenario.owner_id == current_user.id,
        )
        .all()
    )

    if len(scenarios) != len(request.scenario_ids):
        raise HTTPException(
            status_code=404,
            detail="One or more scenarios were not found.",
        )

    scenario_lookup = {
        scenario.id: scenario
        for scenario in scenarios
    }

    ordered_scenarios = [
        scenario_lookup[scenario_id]
        for scenario_id in request.scenario_ids
    ]

    comparison = {}

    for scenario in ordered_scenarios:
        snapshot = scenario.result_snapshot or {}
        allocation_data = snapshot.get("allocation", {})
        allocations = allocation_data.get("allocations", [])

        for allocation in allocations:
            district = allocation["district"]

            if district not in comparison:
                comparison[district] = {}

            comparison[district][str(scenario.id)] = {
                "scenario_name": scenario.name,
                "allocation_crore": allocation[
                    "optimised_allocation_crore"
                ],
            }

    district_comparison = []

    for district, scenario_values in comparison.items():
        district_comparison.append({
            "district": district,
            "scenarios": scenario_values,
        })

    return {
        "status": "success",
        "scenario_count": len(ordered_scenarios),
        "scenario_ids": request.scenario_ids,
        "comparison": district_comparison,
    }
