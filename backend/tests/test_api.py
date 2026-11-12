
import uuid

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import SessionLocal
from backend.models import User
from backend.security import hash_password, create_access_token


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def policy_maker_headers():
    email = f"maker_{uuid.uuid4().hex[:10]}@govopt.test"

    db = SessionLocal()
    user = None

    try:
        user = User(
            full_name="Test Policy Maker",
            email=email,
            hashed_password=hash_password("MakerPass123"),
            role="policy_maker",
            is_active=True,
            is_approved=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id)

        yield {"Authorization": f"Bearer {token}"}

    finally:
        if user:
            db.delete(user)
            db.commit()

        db.close()


@pytest.fixture
def citizen_headers():
    email = f"citizen_{uuid.uuid4().hex[:10]}@govopt.test"

    db = SessionLocal()
    user = None

    try:
        user = User(
            full_name="Test Citizen",
            email=email,
            hashed_password=hash_password("CitizenPass123"),
            role="citizen",
            is_active=True,
            is_approved=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id)

        yield {"Authorization": f"Bearer {token}"}

    finally:
        if user:
            db.delete(user)
            db.commit()

        db.close()


# --------------------------------------------------
# BASIC API TESTS
# --------------------------------------------------

def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200


def test_home_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200


def test_districts_endpoint(client):
    response = client.get("/districts")
    assert response.status_code == 200


def test_rankings_endpoint(client):
    response = client.get("/rankings")
    assert response.status_code == 200


def test_allocations_endpoint(client):
    response = client.get("/allocations")
    assert response.status_code == 200


def test_get_single_district(client):
    response = client.get("/districts/Dehradun")
    assert response.status_code == 200


def test_get_nonexistent_district(client):
    response = client.get("/districts/NonexistentDistrict")
    assert response.status_code == 404


# --------------------------------------------------
# CUSTOM OPTIMIZATION ENDPOINT TESTS
# --------------------------------------------------

def test_optimize_requires_authentication(client):
    response = client.post(
        "/optimize",
        json={
            "budget_crore": 600,
            "need_weight": 70,
            "population_weight": 30,
        },
    )

    assert response.status_code == 401


def test_optimize_endpoint(client, policy_maker_headers):
    response = client.post(
        "/optimize",
        headers=policy_maker_headers,
        json={
            "budget_crore": 600,
            "need_weight": 70,
            "population_weight": 30,
        },
    )

    assert response.status_code == 200


def test_optimize_rejects_invalid_weights(client, policy_maker_headers):
    response = client.post(
        "/optimize",
        headers=policy_maker_headers,
        json={
            "budget_crore": 600,
            "need_weight": 60,
            "population_weight": 30,
        },
    )

    assert response.status_code == 400


def test_optimize_rejects_negative_budget(client, policy_maker_headers):
    response = client.post(
        "/optimize",
        headers=policy_maker_headers,
        json={
            "budget_crore": -100,
            "need_weight": 70,
            "population_weight": 30,
        },
    )

    assert response.status_code == 422


def test_optimize_rejects_invalid_allocation_limits(
    client,
    policy_maker_headers,
):
    response = client.post(
        "/optimize",
        headers=policy_maker_headers,
        json={
            "budget_crore": 600,
            "need_weight": 70,
            "population_weight": 30,
            "min_allocation_crore": 80,
            "max_allocation_crore": 20,
        },
    )

    assert response.status_code in (400, 422)


def test_optimize_rejects_weights_above_100(client, policy_maker_headers):
    response = client.post(
        "/optimize",
        headers=policy_maker_headers,
        json={
            "budget_crore": 600,
            "need_weight": 110,
            "population_weight": 30,
        },
    )

    assert response.status_code == 422


def test_optimize_rejects_insufficient_budget(client, policy_maker_headers):
    response = client.post(
        "/optimize",
        headers=policy_maker_headers,
        json={
            "budget_crore": 100,
            "need_weight": 70,
            "population_weight": 30,
            "min_allocation_crore": 20,
            "max_allocation_crore": 70,
        },
    )

    assert response.status_code == 400


# --------------------------------------------------
# POLICY WEIGHTS ENDPOINT TESTS
# --------------------------------------------------

def test_policy_weights_returns_rankings(client):
    response = client.post(
        "/policy/weights",
        json={
            "education_weight": 50,
            "water_weight": 30,
            "healthcare_weight": 20,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert data["district_count"] == 13
    assert len(data["rankings"]) == 13


def test_policy_weights_reject_invalid_total(client):
    response = client.post(
        "/policy/weights",
        json={
            "education_weight": 50,
            "water_weight": 30,
            "healthcare_weight": 10,
        },
    )

    assert response.status_code == 400


def test_policy_allocation_requires_authentication(client):
    response = client.post(
        "/policy/weights",
        json={
            "education_weight": 50,
            "water_weight": 30,
            "healthcare_weight": 20,
            "budget_crore": 600,
            "need_weight": 70,
            "population_weight": 30,
        },
    )

    assert response.status_code == 401


def test_policy_weights_can_generate_allocation(
    client,
    policy_maker_headers,
):
    response = client.post(
        "/policy/weights",
        headers=policy_maker_headers,
        json={
            "education_weight": 50,
            "water_weight": 30,
            "healthcare_weight": 20,
            "budget_crore": 600,
            "need_weight": 70,
            "population_weight": 30,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert "allocation" in data
    assert len(data["allocation"]["allocations"]) == 13


def test_policy_weights_reject_invalid_allocation_weights(
    client,
    policy_maker_headers,
):
    response = client.post(
        "/policy/weights",
        headers=policy_maker_headers,
        json={
            "education_weight": 50,
            "water_weight": 30,
            "healthcare_weight": 20,
            "budget_crore": 600,
            "need_weight": 80,
            "population_weight": 30,
        },
    )

    assert response.status_code == 400


# --------------------------------------------------
# CITIZEN PERMISSION TESTS
# --------------------------------------------------

def test_citizen_cannot_run_optimize(client, citizen_headers):
    response = client.post(
        "/optimize",
        headers=citizen_headers,
        json={
            "budget_crore": 600,
            "need_weight": 70,
            "population_weight": 30,
        },
    )

    assert response.status_code == 403


def test_citizen_cannot_generate_policy_allocation(
    client,
    citizen_headers,
):
    response = client.post(
        "/policy/weights",
        headers=citizen_headers,
        json={
            "education_weight": 50,
            "water_weight": 30,
            "healthcare_weight": 20,
            "budget_crore": 600,
            "need_weight": 70,
            "population_weight": 30,
        },
    )

    assert response.status_code == 403
