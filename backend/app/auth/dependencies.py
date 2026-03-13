from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError

from ..config import get_settings

_bearer = HTTPBearer()


def get_current_teacher(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """Extract and verify the Supabase JWT, return the teacher's UUID.

    Raises HTTPException 401 if the token is missing, expired, or invalid.
    """
    settings = get_settings()
    token = creds.credentials
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    teacher_id: str | None = payload.get("sub")
    if not teacher_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token payload")
    return teacher_id
