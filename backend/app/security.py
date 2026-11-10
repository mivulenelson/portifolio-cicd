import os
import secrets
import time
from collections import defaultdict, deque

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
TOKEN_TTL_SECONDS = 8 * 60 * 60
_ALGORITHM = "HS256"

_password = os.getenv("ADMIN_PASSWORD")
if not _password:
    _password = secrets.token_urlsafe(12)
    print(
        f"[portfolio] ADMIN_PASSWORD is not set. Temporary admin login -> "
        f"{ADMIN_USERNAME} / {_password}",
        flush=True,
    )

JWT_SECRET = os.getenv("JWT_SECRET") or secrets.token_urlsafe(48)
if not os.getenv("JWT_SECRET"):
    print("[portfolio] JWT_SECRET is not set. Admin sessions reset on every restart.", flush=True)


def _pw_bytes(value: str) -> bytes:
    return value.encode()[:72]  # bcrypt only reads the first 72 bytes


_password_hash = bcrypt.hashpw(_pw_bytes(_password), bcrypt.gensalt())


def verify_credentials(username: str, password: str) -> bool:
    user_ok = secrets.compare_digest(username.encode(), ADMIN_USERNAME.encode())
    pass_ok = bcrypt.checkpw(_pw_bytes(password), _password_hash)  # always run: constant-ish time
    return user_ok and pass_ok


def create_token(username: str) -> str:
    now = int(time.time())
    return jwt.encode(
        {"sub": username, "iat": now, "exp": now + TOKEN_TTL_SECONDS},
        JWT_SECRET,
        algorithm=_ALGORITHM,
    )


_bearer = HTTPBearer(auto_error=False)


def require_admin(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> str:
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if creds is None:
        raise unauthorized
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        raise unauthorized
    if payload.get("sub") != ADMIN_USERNAME:
        raise unauthorized
    return payload["sub"]


class RateLimiter:
    """Small in-memory sliding-window limiter, enough for a single-container site."""

    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if len(hits) >= self.limit:
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many requests. Try again later.")
        hits.append(now)
