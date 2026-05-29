from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt, JWTError
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def create_access_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_password_reset_token(email: str) -> str:
    delta = timedelta(hours=1)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "type": "password_reset"},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return encoded_jwt

def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if decoded_token["type"] == "password_reset":
            return str(decoded_token["sub"])
        return None
    except JWTError:
        return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bool(pwd_context.verify(plain_password, hashed_password))

def get_password_hash(password: str) -> str:
    return str(pwd_context.hash(password))
