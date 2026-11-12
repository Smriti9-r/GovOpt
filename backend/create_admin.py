
import re

from sqlalchemy.exc import IntegrityError

from backend.database import SessionLocal
from backend.models import User
from backend.security import hash_password


def create_admin():
    db = SessionLocal()

    try:
        existing_admin = db.query(User).filter(
            User.role == "admin"
        ).first()

        if existing_admin:
            print("An administrator already exists.")
            print("Bootstrap cancelled.")
            return

        print("\n--- GovOpt First Administrator Setup ---")

        full_name = input("Administrator name: ").strip()
        email = input("Administrator email: ").strip().lower()

        if len(full_name) < 2:
            print("Name must contain at least 2 characters.")
            return

        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            print("Please enter a valid email address.")
            return

        existing_user = db.query(User).filter(
            User.email == email
        ).first()

        if existing_user:
            print("This email is already registered.")
            return

        password = input("Create password: ")
        confirm_password = input("Confirm password: ")

        if len(password) < 8 or len(password) > 128:
            print("Password must contain 8–128 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        admin = User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            role="admin",
            is_active=True,
            is_approved=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("\nAdministrator created successfully!")
        print(f"Admin ID: {admin.id}")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.role}")
        print(f"Approved: {admin.is_approved}")

    except IntegrityError:
        db.rollback()
        print("Could not create administrator. Check for duplicate details.")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
