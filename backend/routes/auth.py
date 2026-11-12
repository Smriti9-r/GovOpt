
import re

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.database import get_db
from backend.models import User
from backend.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

bearer_scheme = HTTPBearer(auto_error=False)


# Request schemas
class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Full name is too short")
        return value

    @field_validator("email")
    @classmethod
    def clean_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Enter a valid email address")
        return value


class LoginRequest(BaseModel):
    email: str
    password: str


# Registration: all public registrations become pending policy-maker accounts
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(
        User.email == request.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    user = User(
        full_name=request.full_name,
        email=request.email,
        hashed_password=hash_password(request.password),
        role="policy_maker",
        is_active=True,
        is_approved=False,
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    return {
        "message": "Registration submitted. Your account is awaiting administrator approval.",
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "is_approved": user.is_approved,
    }


# Login: only active and approved users can receive a token
@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    email = request.email.strip().lower()

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(
        request.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account is inactive",
        )

    if not user.is_approved:
        raise HTTPException(
            status_code=403,
            detail="Your account is awaiting administrator approval",
        )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        },
    }


# Authentication dependency for protected endpoints
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    unauthorized = HTTPException(
        status_code=401,
        detail="Invalid or missing authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload.get("sub"))
    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise unauthorized

    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active or not user.is_approved:
        raise unauthorized

    return user


# Current logged-in user's profile
@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
    }

def require_role(*allowed_roles: str):
    def role_checker(
        current_user: User = Depends(get_current_user)
    ):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action",
            )

        return current_user

    return role_checker


class ApprovalRequest(BaseModel):
    is_approved: bool


@router.get("/admin/pending-users")
def get_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    users = (
        db.query(User)
        .filter(
            User.role == "policy_maker",
            User.is_approved.is_(False),
        )
        .order_by(User.created_at.asc())
        .all()
    )

    return {
        "count": len(users),
        "pending_users": [
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "created_at": (
                    user.created_at.isoformat()
                    if user.created_at else None
                ),
            }
            for user in users
        ],
    }


@router.patch("/admin/users/{user_id}/approval")
def update_user_approval(
    user_id: int,
    request: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.role != "policy_maker":
        raise HTTPException(
            status_code=400,
            detail="Only policy-maker accounts can be approved or rejected",
        )

    user.is_approved = request.is_approved
    db.commit()
    db.refresh(user)

    return {
        "message": (
            "Policy-maker account approved"
            if user.is_approved
            else "Policy-maker account approval revoked"
        ),
        "user_id": user.id,
        "email": user.email,
        "is_approved": user.is_approved,
    }
