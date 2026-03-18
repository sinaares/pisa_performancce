import httpx as _httpx

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError

from ..config import get_settings

_bearer = HTTPBearer()

# Fetch JWKS key at import time so it's always available
_jwks_key: dict | None = None
try:
    _settings = get_settings()
    _resp = _httpx.get(
        f"{_settings.supabase_url}/auth/v1/.well-known/jwks.json", timeout=10
    )
    _resp.raise_for_status()
    _keys = _resp.json().get("keys", [])
    if _keys:
        _jwks_key = _keys[0]
        print(f"[auth] JWKS key loaded (kid={_jwks_key.get('kid', '?')[:8]}...)")
except Exception as _e:
    print(f"[auth] JWKS fetch failed: {_e}")


def get_current_teacher(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """Extract and verify the Supabase JWT, return the teacher's UUID."""
    settings = get_settings()
    token = creds.credentials

    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    alg = header.get("alg", "HS256")

    try:
        if alg == "ES256" and _jwks_key:
            payload = jwt.decode(
                token, _jwks_key, algorithms=["ES256"], audience="authenticated"
            )
        else:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
    except ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except HTTPException:
        raise
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    teacher_id: str | None = payload.get("sub")
    if not teacher_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token payload")
    return teacher_id
