
import uuid

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import SessionLocal
from backend.models import User
from backend.security import create_access_token, hash_password


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def test_email():
    email = f"test_{uuid.uuid4().hex[:10]}@govopt.test"
    yield email

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            db.delete(user)
            db.commit()
    finally:
        db.close()


@pytest.fixture
def admin_headers():
    email = f"admin_{uuid.uuid4().hex[:10]}@govopt.test"
    db = SessionLocal()

    try:
        admin = User(
            full_name="Test Admin",
            email=email,
            hashed_password=hash_password("AdminPass123"),
            role="admin",
            is_active=True,
            is_approved=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        token = create_access_token(admin.id)

        yield {"Authorization": f"Bearer {token}"}

    finally:
        user = db.query(User).filter(User.email == email).first()
        if user:
            db.delete(user)
            db.commit()
        db.close()


@pytest.fixture
def policy_maker_headers():
    email = f"maker_{uuid.uuid4().hex[:10]}@govopt.test"
    db = SessionLocal()

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
        user = db.query(User).filter(User.email == email).first()
        if user:
            db.delete(user)
            db.commit()
        db.close()


# --------------------------------------------------
# BASIC AUTHENTICATION TESTS
# --------------------------------------------------

def test_register_creates_pending_policy_maker(client, test_email):
    response = client.post(
        "/auth/register",
        json={
            "full_name": "Test User",
            "email": test_email,
            "password": "SecurePass123",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "policy_maker"
    assert response.json()["is_approved"] is False


def test_duplicate_registration_is_rejected(client, test_email):
    payload = {
        "full_name": "Test User",
        "email": test_email,
        "password": "SecurePass123",
    }

    client.post("/auth/register", json=payload)
    response = client.post("/auth/register", json=payload)

    assert response.status_code == 409


def test_weak_password_is_rejected(client, test_email):
    response = client.post(
        "/auth/register",
        json={
            "full_name": "Test User",
            "email": test_email,
            "password": "123",
        },
    )

    assert response.status_code == 422


def test_unapproved_user_cannot_login(client, test_email):
    client.post(
        "/auth/register",
        json={
            "full_name": "Test User",
            "email": test_email,
            "password": "SecurePass123",
        },
    )

    response = client.post(
        "/auth/login",
        json={
            "email": test_email,
            "password": "SecurePass123",
        },
    )

    assert response.status_code == 403


def test_approved_user_can_login_and_access_profile(client, test_email):
    client.post(
        "/auth/register",
        json={
            "full_name": "Test User",
            "email": test_email,
            "password": "SecurePass123",
        },
    )

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == test_email).first()
        user.is_approved = True
        db.commit()
    finally:
        db.close()

    login_response = client.post(
        "/auth/login",
        json={
            "email": test_email,
            "password": "SecurePass123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    profile_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert profile_response.status_code == 200
    assert profile_response.json()["email"] == test_email


def test_profile_rejects_missing_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


# --------------------------------------------------
# ADMINISTRATOR APPROVAL TESTS
# --------------------------------------------------

def test_admin_can_view_pending_users(client, admin_headers):
    response = client.get(
        "/auth/admin/pending-users",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert "pending_users" in response.json()


def test_admin_can_approve_policy_maker(
    client, admin_headers, test_email
):
    registration = client.post(
        "/auth/register",
        json={
            "full_name": "Pending User",
            "email": test_email,
            "password": "SecurePass123",
        },
    )

    assert registration.status_code == 201

    user_id = registration.json()["user_id"]

    response = client.patch(
        f"/auth/admin/users/{user_id}/approval",
        headers=admin_headers,
        json={"is_approved": True},
    )

    assert response.status_code == 200
    assert response.json()["is_approved"] is True


def test_policy_maker_cannot_access_admin_endpoint(
    client, policy_maker_headers
):
    response = client.get(
        "/auth/admin/pending-users",
        headers=policy_maker_headers,
    )

    assert response.status_code == 403


def test_unauthenticated_user_cannot_access_admin_endpoint(client):
    response = client.get("/auth/admin/pending-users")

    assert response.status_code == 401


def test_admin_cannot_approve_another_admin(
    client, admin_headers
):
    db = SessionLocal()
    admin_id = None

    try:
        another_admin = User(
            full_name="Another Admin",
            email=f"another_{uuid.uuid4().hex[:10]}@govopt.test",
            hashed_password=hash_password("AnotherPass123"),
            role="admin",
            is_active=True,
            is_approved=True,
        )

        db.add(another_admin)
        db.commit()
        db.refresh(another_admin)

        admin_id = another_admin.id

        response = client.patch(
            f"/auth/admin/users/{admin_id}/approval",
            headers=admin_headers,
            json={"is_approved": False},
        )

        assert response.status_code == 400

    finally:
        if admin_id is not None:
            user = db.query(User).filter(User.id == admin_id).first()
            if user:
                db.delete(user)
                db.commit()

        db.close()
