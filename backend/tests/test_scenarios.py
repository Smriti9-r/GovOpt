
import uuid

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import SessionLocal
from backend.models import User, SavedScenario
from backend.security import hash_password, create_access_token


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

    # Clean up test users and their saved scenarios.
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


def valid_scenario_payload():
    return {
        "name": "Healthcare Priority Scenario",
        "education_weight": 50,
        "water_weight": 30,
        "healthcare_weight": 20,
        "budget_crore": 600,
        "need_weight": 70,
        "population_weight": 30,
        "min_allocation_crore": 20,
        "max_allocation_crore": 70,
    }


def test_create_scenario(
    client,
    policy_maker_headers,
):
    response = client.post(
        "/scenarios",
        headers=policy_maker_headers,
        json=valid_scenario_payload(),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert data["scenario"]["name"] == "Healthcare Priority Scenario"
    assert data["scenario"]["id"] is not None
    assert len(
        data["result_snapshot"]["allocation"]["allocations"]
    ) == 13


def test_list_my_scenarios(
    client,
    policy_maker_headers,
):
    client.post(
        "/scenarios",
        headers=policy_maker_headers,
        json=valid_scenario_payload(),
    )

    response = client.get(
        "/scenarios",
        headers=policy_maker_headers,
    )

    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert response.json()["scenarios"][0]["name"] == (
        "Healthcare Priority Scenario"
    )


def test_get_single_scenario(
    client,
    policy_maker_headers,
):
    create_response = client.post(
        "/scenarios",
        headers=policy_maker_headers,
        json=valid_scenario_payload(),
    )

    scenario_id = create_response.json()["scenario"]["id"]

    response = client.get(
        f"/scenarios/{scenario_id}",
        headers=policy_maker_headers,
    )

    assert response.status_code == 200
    assert response.json()["scenario"]["id"] == scenario_id
    assert response.json()["result_snapshot"] is not None


def test_user_cannot_access_another_users_scenario(
    client,
    policy_maker_headers,
    second_policy_maker_headers,
):
    create_response = client.post(
        "/scenarios",
        headers=policy_maker_headers,
        json=valid_scenario_payload(),
    )

    scenario_id = create_response.json()["scenario"]["id"]

    response = client.get(
        f"/scenarios/{scenario_id}",
        headers=second_policy_maker_headers,
    )

    assert response.status_code == 404


def test_citizen_cannot_create_scenario(
    client,
    citizen_headers,
):
    response = client.post(
        "/scenarios",
        headers=citizen_headers,
        json=valid_scenario_payload(),
    )

    assert response.status_code == 403


def test_unauthenticated_user_cannot_create_scenario(client):
    response = client.post(
        "/scenarios",
        json=valid_scenario_payload(),
    )

    assert response.status_code == 401


def test_scenario_rejects_invalid_sector_weights(
    client,
    policy_maker_headers,
):
    payload = valid_scenario_payload()
    payload["healthcare_weight"] = 10

    response = client.post(
        "/scenarios",
        headers=policy_maker_headers,
        json=payload,
    )

    assert response.status_code == 400


def test_scenario_rejects_invalid_need_population_weights(
    client,
    policy_maker_headers,
):
    payload = valid_scenario_payload()
    payload["population_weight"] = 20

    response = client.post(
        "/scenarios",
        headers=policy_maker_headers,
        json=payload,
    )

    assert response.status_code == 400
def test_rename_scenario(client, policy_maker_headers):
    response = client.post(
        "/scenarios",
        json=valid_scenario_payload(),
        headers=policy_maker_headers,
    )

    scenario_id = response.json()["scenario"]["id"]

    rename_response = client.patch(
        f"/scenarios/{scenario_id}",
        json={"name": "Updated Healthcare Scenario"},
        headers=policy_maker_headers,
    )

    assert rename_response.status_code == 200
    assert (
        rename_response.json()["scenario"]["name"]
        == "Updated Healthcare Scenario"
    )


def test_non_owner_cannot_rename_scenario(
    client,
    policy_maker_headers,
    second_policy_maker_headers,
):
    response = client.post(
        "/scenarios",
        json=valid_scenario_payload(),
        headers=policy_maker_headers,
    )

    scenario_id = response.json()["scenario"]["id"]

    rename_response = client.patch(
        f"/scenarios/{scenario_id}",
        json={"name": "Unauthorized Rename"},
        headers=second_policy_maker_headers,
    )

    assert rename_response.status_code == 404


def test_delete_scenario(client, policy_maker_headers):
    response = client.post(
        "/scenarios",
        json=valid_scenario_payload(),
        headers=policy_maker_headers,
    )

    scenario_id = response.json()["scenario"]["id"]

    delete_response = client.delete(
        f"/scenarios/{scenario_id}",
        headers=policy_maker_headers,
    )

    assert delete_response.status_code == 200

    get_response = client.get(
        f"/scenarios/{scenario_id}",
        headers=policy_maker_headers,
    )

    assert get_response.status_code == 404


def test_non_owner_cannot_delete_scenario(
    client,
    policy_maker_headers,
    second_policy_maker_headers,
):
    response = client.post(
        "/scenarios",
        json=valid_scenario_payload(),
        headers=policy_maker_headers,
    )

    scenario_id = response.json()["scenario"]["id"]

    delete_response = client.delete(
        f"/scenarios/{scenario_id}",
        headers=second_policy_maker_headers,
    )

    assert delete_response.status_code == 404

    owner_response = client.get(
        f"/scenarios/{scenario_id}",
        headers=policy_maker_headers,
    )

    assert owner_response.status_code == 200
def test_compare_two_scenarios(client, policy_maker_headers):
    first_response = client.post(
        "/scenarios",
        json=valid_scenario_payload(),
        headers=policy_maker_headers,
    )

    second_payload = valid_scenario_payload()
    second_payload["name"] = "Water Priority Scenario"
    second_payload["education_weight"] = 20
    second_payload["water_weight"] = 60
    second_payload["healthcare_weight"] = 20

    second_response = client.post(
        "/scenarios",
        json=second_payload,
        headers=policy_maker_headers,
    )

    first_id = first_response.json()["scenario"]["id"]
    second_id = second_response.json()["scenario"]["id"]

    response = client.post(
        "/scenarios/compare",
        json={"scenario_ids": [first_id, second_id]},
        headers=policy_maker_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["scenario_count"] == 2
    assert data["scenario_ids"] == [first_id, second_id]
    assert len(data["comparison"]) == 13

    first_district = data["comparison"][0]

    assert str(first_id) in first_district["scenarios"]
    assert str(second_id) in first_district["scenarios"]


def test_compare_rejects_inaccessible_scenario(
    client,
    policy_maker_headers,
    second_policy_maker_headers,
):
    response = client.post(
        "/scenarios",
        json=valid_scenario_payload(),
        headers=policy_maker_headers,
    )

    scenario_id = response.json()["scenario"]["id"]

    compare_response = client.post(
        "/scenarios/compare",
        json={"scenario_ids": [scenario_id, 999999]},
        headers=policy_maker_headers,
    )

    assert compare_response.status_code == 404


def test_compare_rejects_duplicate_scenario_ids(
    client,
    policy_maker_headers,
):
    response = client.post(
        "/scenarios",
        json=valid_scenario_payload(),
        headers=policy_maker_headers,
    )

    scenario_id = response.json()["scenario"]["id"]

    compare_response = client.post(
        "/scenarios/compare",
        json={"scenario_ids": [scenario_id, scenario_id]},
        headers=policy_maker_headers,
    )

    assert compare_response.status_code == 422
