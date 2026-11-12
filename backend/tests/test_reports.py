
import uuid

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import SessionLocal
from backend.models import User, SavedScenario
from backend.security import hash_password, create_access_token

from backend.reports.report_generator import (
    generate_scenario_pdf,
    generate_comparison_pdf,
)


# --------------------------------------------------
# PDF GENERATOR TESTS
# --------------------------------------------------

def test_generate_scenario_pdf():
    scenario = {
        "id": 1,
        "name": "Healthcare Priority Scenario",
    }

    snapshot = {
        "sector_weights": {
            "education": 50,
            "water": 30,
            "healthcare": 20,
        },
        "allocation": {
            "budget_crore": 600,
            "need_weight": 70,
            "population_weight": 30,
            "min_allocation_crore": 20,
            "max_allocation_crore": 70,
            "total_allocated_crore": 600,
            "allocations": [
                {
                    "district": "Dehradun",
                    "combined_priority": 0.25,
                    "target_allocation_crore": 80,
                    "optimised_allocation_crore": 70,
                },
                {
                    "district": "Haridwar",
                    "combined_priority": 0.30,
                    "target_allocation_crore": 90,
                    "optimised_allocation_crore": 70,
                },
            ],
        },
    }

    pdf = generate_scenario_pdf(scenario, snapshot)

    assert isinstance(pdf, bytes)
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 1000


def test_generate_comparison_pdf():
    comparison_data = {
        "scenario_count": 2,
        "scenario_ids": [1, 2],
        "comparison": [
            {
                "district": "Dehradun",
                "scenarios": {
                    "1": {
                        "scenario_name": "Healthcare Priority",
                        "allocation_crore": 70,
                    },
                    "2": {
                        "scenario_name": "Water Priority",
                        "allocation_crore": 60,
                    },
                },
            },
            {
                "district": "Haridwar",
                "scenarios": {
                    "1": {
                        "scenario_name": "Healthcare Priority",
                        "allocation_crore": 70,
                    },
                    "2": {
                        "scenario_name": "Water Priority",
                        "allocation_crore": 70,
                    },
                },
            },
        ],
    }

    pdf = generate_comparison_pdf(comparison_data)

    assert isinstance(pdf, bytes)
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 1000


# --------------------------------------------------
# API TEST FIXTURES
# --------------------------------------------------

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def user_factory():
    created_emails = []

    def create_user(role):
        email = f"{role}_{uuid.uuid4().hex[:10]}@govopt.test"

        db = SessionLocal()

        try:
            user = User(
                full_name=f"Test {role.title()}",
                email=email,
                hashed_password=hash_password("TestPass123"),
                role=role,
                is_active=True,
                is_approved=True,
            )

            db.add(user)
            db.commit()
            db.refresh(user)

            token = create_access_token(user.id)
            created_emails.append(email)

            return {
                "Authorization": f"Bearer {token}"
            }

        finally:
            db.close()

    yield create_user

    db = SessionLocal()

    try:
        for email in created_emails:
            user = db.query(User).filter(
                User.email == email
            ).first()

            if user:
                db.query(SavedScenario).filter(
                    SavedScenario.owner_id == user.id
                ).delete(synchronize_session=False)

                db.delete(user)

        db.commit()

    finally:
        db.close()


@pytest.fixture
def policy_maker_headers(user_factory):
    return user_factory("policy_maker")


@pytest.fixture
def second_policy_maker_headers(user_factory):
    return user_factory("policy_maker")


@pytest.fixture
def citizen_headers(user_factory):
    return user_factory("citizen")


def create_test_scenario(client, headers, name):
    payload = {
        "name": name,
        "education_weight": 50,
        "water_weight": 30,
        "healthcare_weight": 20,
        "budget_crore": 600,
        "need_weight": 70,
        "population_weight": 30,
        "min_allocation_crore": 20,
        "max_allocation_crore": 70,
    }

    response = client.post(
        "/scenarios",
        headers=headers,
        json=payload,
    )

    assert response.status_code == 200

    return response.json()["scenario"]["id"]


# --------------------------------------------------
# SCENARIO PDF API TESTS
# --------------------------------------------------

def test_download_scenario_pdf_success(
    client,
    policy_maker_headers,
):
    scenario_id = create_test_scenario(
        client,
        policy_maker_headers,
        "PDF Test Scenario",
    )

    response = client.get(
        f"/reports/scenarios/{scenario_id}",
        headers=policy_maker_headers,
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]
    assert response.content.startswith(b"%PDF")


def test_download_scenario_pdf_blocks_non_owner(
    client,
    policy_maker_headers,
    second_policy_maker_headers,
):
    scenario_id = create_test_scenario(
        client,
        policy_maker_headers,
        "Private Scenario",
    )

    response = client.get(
        f"/reports/scenarios/{scenario_id}",
        headers=second_policy_maker_headers,
    )

    assert response.status_code == 404


def test_download_scenario_pdf_blocks_citizen(
    client,
    policy_maker_headers,
    citizen_headers,
):
    scenario_id = create_test_scenario(
        client,
        policy_maker_headers,
        "Citizen Access Test",
    )

    response = client.get(
        f"/reports/scenarios/{scenario_id}",
        headers=citizen_headers,
    )

    assert response.status_code == 403


# --------------------------------------------------
# COMPARISON PDF API TESTS
# --------------------------------------------------

def test_download_comparison_pdf_success(
    client,
    policy_maker_headers,
):
    first_id = create_test_scenario(
        client,
        policy_maker_headers,
        "Healthcare Scenario",
    )

    second_id = create_test_scenario(
        client,
        policy_maker_headers,
        "Water Scenario",
    )

    response = client.post(
        "/reports/scenarios/compare",
        headers=policy_maker_headers,
        json={
            "scenario_ids": [first_id, second_id],
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]
    assert response.content.startswith(b"%PDF")


def test_report_endpoints_require_authentication(client):
    single_response = client.get(
        "/reports/scenarios/1",
    )

    comparison_response = client.post(
        "/reports/scenarios/compare",
        json={
            "scenario_ids": [1, 2],
        },
    )

    assert single_response.status_code == 401
    assert comparison_response.status_code == 401
