import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash


# Load environment variables from backend/.env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from backend/.env")


# Password hashing using Argon2
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return password_hash.verify(plain_password, hashed_password)


# JWT access token generation
def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# JWT access token verification
def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )