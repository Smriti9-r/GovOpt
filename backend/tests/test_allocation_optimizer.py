
import pytest

from backend.data_loader import load_district_data
from backend.optimization.allocation_optimizer import optimize_allocation


@pytest.fixture
def district_data():
    return load_district_data()


def test_all_13_districts_receive_allocation(district_data):
    result = optimize_allocation(district_data, 600)

    assert len(result) == 13
    assert result["optimised_allocation_crore"].notnull().all()


def test_entire_budget_is_allocated(district_data):
    result = optimize_allocation(district_data, 600)

    total = result["optimised_allocation_crore"].sum()

    assert total == pytest.approx(600, abs=0.000001)


def test_minimum_and_maximum_limits(district_data):
    result = optimize_allocation(
        district_data,
        budget_crore=600,
        min_allocation_crore=20,
        max_allocation_crore=70
    )

    allocations = result["optimised_allocation_crore"]

    assert (allocations >= 20 - 0.000001).all()
    assert (allocations <= 70 + 0.000001).all()


def test_custom_priority_weights(district_data):
    result = optimize_allocation(
        district_data,
        budget_crore=600,
        need_weight=70,
        population_weight=30
    )

    assert result["optimised_allocation_crore"].sum() == pytest.approx(600)


def test_need_only_allocation(district_data):
    result = optimize_allocation(
        district_data,
        budget_crore=600,
        need_weight=100,
        population_weight=0
    )

    assert result["optimised_allocation_crore"].sum() == pytest.approx(600)


def test_population_only_allocation(district_data):
    result = optimize_allocation(
        district_data,
        budget_crore=600,
        need_weight=0,
        population_weight=100
    )

    assert result["optimised_allocation_crore"].sum() == pytest.approx(600)


def test_invalid_weights_are_rejected(district_data):
    with pytest.raises(ValueError):
        optimize_allocation(
            district_data,
            budget_crore=600,
            need_weight=70,
            population_weight=20
        )


def test_insufficient_budget_is_rejected(district_data):
    with pytest.raises(ValueError):
        optimize_allocation(
            district_data,
            budget_crore=100,
            min_allocation_crore=20
        )


def test_budget_above_maximum_capacity_is_rejected(district_data):
    with pytest.raises(ValueError):
        optimize_allocation(
            district_data,
            budget_crore=1000,
            min_allocation_crore=20,
            max_allocation_crore=70
        )
