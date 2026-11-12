
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, SavedScenario
from backend.routes.auth import require_role
from backend.reports.report_generator import (
    generate_scenario_pdf,
    generate_comparison_pdf,
)


router = APIRouter(
    prefix="/reports",
    tags=["PDF Reports"],
)


class ReportCompareRequest(BaseModel):
    scenario_ids: list[int] = Field(
        min_length=2,
        max_length=5,
    )


def get_owned_scenarios(db, scenario_ids, user_id):
    if len(set(scenario_ids)) != len(scenario_ids):
        raise HTTPException(
            status_code=422,
            detail="Duplicate scenario IDs are not allowed.",
        )

    scenarios = (
        db.query(SavedScenario)
        .filter(
            SavedScenario.id.in_(scenario_ids),
            SavedScenario.owner_id == user_id,
        )
        .all()
    )

    if len(scenarios) != len(scenario_ids):
        raise HTTPException(
            status_code=404,
            detail="One or more scenarios were not found.",
        )

    scenario_lookup = {
        scenario.id: scenario
        for scenario in scenarios
    }

    return [
        scenario_lookup[scenario_id]
        for scenario_id in scenario_ids
    ]


@router.get("/scenarios/{scenario_id}")
def download_scenario_report(
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

    scenario_data = {
        "id": scenario.id,
        "name": scenario.name,
    }

    pdf_bytes = generate_scenario_pdf(
        scenario_data,
        scenario.result_snapshot or {},
    )

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="govopt_scenario_{scenario.id}.pdf"'
            )
        },
    )


@router.post("/scenarios/compare")
def download_comparison_report(
    request: ReportCompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("policy_maker", "admin")
    ),
):
    scenarios = get_owned_scenarios(
        db,
        request.scenario_ids,
        current_user.id,
    )

    comparison = {}

    for scenario in scenarios:
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

    district_comparison = [
        {
            "district": district,
            "scenarios": scenario_values,
        }
        for district, scenario_values in comparison.items()
    ]

    comparison_data = {
        "scenario_count": len(scenarios),
        "scenario_ids": request.scenario_ids,
        "comparison": district_comparison,
    }

    pdf_bytes = generate_comparison_pdf(comparison_data)

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                'attachment; filename="govopt_scenario_comparison.pdf"'
            )
        },
    )
