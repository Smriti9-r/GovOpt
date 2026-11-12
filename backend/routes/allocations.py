
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from backend.data_loader import load_district_data, load_allocation_data
from backend.optimization.allocation_optimizer import optimize_allocation
from backend.models import User
from backend.routes.auth import get_current_user, require_role


router = APIRouter()

# Load and validate existing datasets
DISTRICT_DATA = load_district_data()
ALLOCATION_DATA = load_allocation_data(DISTRICT_DATA)


# Request structure for custom optimisation
class OptimizationRequest(BaseModel):

    budget_crore: float = Field(gt=0)

    need_weight: float = Field(default=70, ge=0, le=100)

    population_weight: float = Field(default=30, ge=0, le=100)

    min_allocation_crore: float = Field(default=20, ge=0)

    max_allocation_crore: float = Field(default=70, gt=0)


# Public endpoint: retrieve existing allocation results
@router.get("/allocations")
def get_allocations():

    return {
        "count": len(ALLOCATION_DATA),
        "budget_crore": 500,
        "allocations": ALLOCATION_DATA.to_dict(orient="records")
    }


# Protected endpoint: generate a custom allocation
@router.post("/optimize")
def generate_optimized_allocation(
    request: OptimizationRequest,
    current_user: User = Depends(
        require_role("policy_maker", "admin")
    )
):

    try:

        result = optimize_allocation(
            district_data=DISTRICT_DATA,
            budget_crore=request.budget_crore,
            need_weight=request.need_weight,
            population_weight=request.population_weight,
            min_allocation_crore=request.min_allocation_crore,
            max_allocation_crore=request.max_allocation_crore
        )

        return {
            "status": "success",
            "message": "Budget allocation optimised successfully.",
            "budget_crore": request.budget_crore,
            "need_weight": request.need_weight,
            "population_weight": request.population_weight,
            "district_count": len(result),
            "total_allocated_crore": round(
                result["optimised_allocation_crore"].sum(), 2
            ),
            "allocations": result[
                [
                    "district",
                    "combined_priority",
                    "target_allocation_crore",
                    "optimised_allocation_crore"
                ]
            ].round(4).to_dict(orient="records")
        }

    except (ValueError, RuntimeError) as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
