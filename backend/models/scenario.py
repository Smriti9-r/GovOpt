from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class SavedScenario(Base):
    __tablename__ = "saved_scenarios"

    __table_args__ = (
        CheckConstraint(
            "budget_crore >= 0",
            name="valid_scenario_budget"
        ),
        CheckConstraint(
            "min_allocation_crore >= 0",
            name="valid_min_allocation"
        ),
        CheckConstraint(
            "max_allocation_crore >= min_allocation_crore",
            name="valid_allocation_limits"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False
    )

    education_weight: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    water_weight: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    healthcare_weight: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    need_weight: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    population_weight: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    budget_crore: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    min_allocation_crore: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    max_allocation_crore: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    result_snapshot: Mapped[dict | None] = mapped_column(
        JSON,
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