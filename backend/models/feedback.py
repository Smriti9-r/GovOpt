
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class CitizenFeedback(Base):
    __tablename__ = "citizen_feedback"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    # Legacy database field. New submissions store "Anonymous".
    citizen_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Anonymous"
    )

    # Random public tracking code.
    reference_id: Mapped[str | None] = mapped_column(
        String(40),
        nullable=True,
        unique=True,
        index=True
    )

    district: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )

    subject: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Pending",
        nullable=False,
        index=True
    )

    admin_response: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

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
