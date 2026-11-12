
import secrets
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.feedback import CitizenFeedback
from backend.routes.auth import require_role


router = APIRouter(
    prefix="/feedback",
    tags=["Citizen Feedback"]
)


DISTRICTS = [
    "Almora",
    "Bageshwar",
    "Chamoli",
    "Champawat",
    "Dehradun",
    "Haridwar",
    "Nainital",
    "Pauri Garhwal",
    "Pithoragarh",
    "Rudraprayag",
    "Tehri Garhwal",
    "Udham Singh Nagar",
    "Uttarkashi",
]

CATEGORIES = [
    "Education",
    "Water",
    "Healthcare",
    "Infrastructure",
    "Other",
]

STATUSES = [
    "Pending",
    "Under Review",
    "Resolved",
    "Rejected",
]


# --------------------------------------------------
# REQUEST SCHEMAS
# --------------------------------------------------

class FeedbackCreate(BaseModel):
    district: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=50)
    subject: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=10, max_length=5000)

    @field_validator("subject", "description", mode="before")
    @classmethod
    def strip_text(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("district")
    @classmethod
    def validate_district(cls, value):
        for district in DISTRICTS:
            if value.strip().casefold() == district.casefold():
                return district

        raise ValueError("Please select a valid Uttarakhand district.")

    @field_validator("category")
    @classmethod
    def validate_category(cls, value):
        for category in CATEGORIES:
            if value.strip().casefold() == category.casefold():
                return category

        raise ValueError("Please select a valid feedback category.")


class FeedbackUpdate(BaseModel):
    status: Literal[
        "Pending",
        "Under Review",
        "Resolved",
        "Rejected"
    ] | None = None

    admin_response: str | None = Field(
        default=None,
        max_length=5000
    )

    @field_validator("admin_response", mode="before")
    @classmethod
    def strip_response(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value


# --------------------------------------------------
# RESPONSE SCHEMAS
# --------------------------------------------------

class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference_id: str | None
    district: str
    category: str
    subject: str
    description: str
    status: str
    admin_response: str | None
    created_at: datetime
    updated_at: datetime


class FeedbackTrackResponse(BaseModel):
    reference_id: str
    district: str
    category: str
    subject: str
    status: str
    admin_response: str | None
    created_at: datetime
    updated_at: datetime


# --------------------------------------------------
# REFERENCE ID GENERATOR
# --------------------------------------------------

def generate_reference_id(db: Session) -> str:
    """
    Generates a random, difficult-to-guess public reference ID.
    Checks the database to avoid duplicate IDs.
    """

    for _ in range(10):
        reference_id = f"GOVOPT-{secrets.token_hex(10).upper()}"

        existing = db.query(CitizenFeedback).filter(
            CitizenFeedback.reference_id == reference_id
        ).first()

        if not existing:
            return reference_id

    raise HTTPException(
        status_code=500,
        detail="Unable to generate a feedback reference ID."
    )


# --------------------------------------------------
# CITIZEN: SUBMIT ANONYMOUS FEEDBACK
# --------------------------------------------------

@router.post(
    "/",
    response_model=FeedbackResponse,
    status_code=201
)
def submit_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db)
):
    reference_id = generate_reference_id(db)

    new_feedback = CitizenFeedback(
        citizen_name="Anonymous",
        reference_id=reference_id,
        **feedback.model_dump()
    )

    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    return new_feedback


# --------------------------------------------------
# CITIZEN: TRACK FEEDBACK USING REFERENCE ID
# --------------------------------------------------

@router.get(
    "/track/{reference_id}",
    response_model=FeedbackTrackResponse
)
def track_feedback(
    reference_id: str,
    db: Session = Depends(get_db)
):
    feedback = db.query(CitizenFeedback).filter(
        CitizenFeedback.reference_id == reference_id.strip().upper()
    ).first()

    if not feedback:
        raise HTTPException(
            status_code=404,
            detail="No feedback found. Please check your reference ID."
        )

    # Only return information needed by the citizen.
    return FeedbackTrackResponse(
        reference_id=feedback.reference_id,
        district=feedback.district,
        category=feedback.category,
        subject=feedback.subject,
        status=feedback.status,
        admin_response=feedback.admin_response,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at
    )


# --------------------------------------------------
# ADMIN: VIEW ALL FEEDBACK
# --------------------------------------------------

@router.get(
    "/",
    response_model=list[FeedbackResponse],
    dependencies=[Depends(require_role("admin"))]
)
def get_feedback(
    district: str | None = None,
    status: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(CitizenFeedback)

    if district:
        query = query.filter(
            CitizenFeedback.district == district
        )

    if status:
        if status not in STATUSES:
            raise HTTPException(
                status_code=400,
                detail="Invalid feedback status."
            )

        query = query.filter(
            CitizenFeedback.status == status
        )

    return (
        query
        .order_by(CitizenFeedback.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# --------------------------------------------------
# ADMIN: UPDATE STATUS AND RESPONSE
# --------------------------------------------------

@router.patch(
    "/{feedback_id}",
    response_model=FeedbackResponse,
    dependencies=[Depends(require_role("admin"))]
)
def update_feedback(
    feedback_id: int,
    update: FeedbackUpdate,
    db: Session = Depends(get_db)
):
    feedback = db.query(CitizenFeedback).filter(
        CitizenFeedback.id == feedback_id
    ).first()

    if not feedback:
        raise HTTPException(
            status_code=404,
            detail="Feedback submission not found."
        )

    updates = update.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Provide a status or admin response to update."
        )

    for field, value in updates.items():
        setattr(feedback, field, value)

    db.commit()
    db.refresh(feedback)

    return feedback
