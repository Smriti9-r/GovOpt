
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "role IN ('citizen', 'policy_maker', 'admin')",
            name="valid_user_role"
        ),
    )

    # Primary key
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # Account information
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # Access control
    role: Mapped[str] = mapped_column(
        String(30),
        default="policy_maker",
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    is_approved: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    # Account timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
