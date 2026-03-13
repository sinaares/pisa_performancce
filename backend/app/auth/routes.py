from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from ..database import get_supabase
from .dependencies import get_current_teacher

router = APIRouter()


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(body: SignUpRequest):
    """Create a Supabase auth user and insert a row into the teachers table."""
    sb = get_supabase()
    try:
        auth_resp = sb.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    user = auth_resp.user
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Signup failed")

    # insert into teachers table
    sb.table("teachers").insert({
        "id": user.id,
        "email": body.email,
        "display_name": body.display_name or body.email,
    }).execute()

    return {
        "id": user.id,
        "email": body.email,
        "access_token": auth_resp.session.access_token if auth_resp.session else None,
        "refresh_token": auth_resp.session.refresh_token if auth_resp.session else None,
    }


@router.post("/login")
def login(body: LoginRequest):
    """Sign in with email/password and return tokens."""
    sb = get_supabase()
    try:
        auth_resp = sb.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
    except Exception as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc))

    return {
        "access_token": auth_resp.session.access_token,
        "refresh_token": auth_resp.session.refresh_token,
        "user_id": auth_resp.user.id,
        "email": auth_resp.user.email,
    }


@router.get("/me")
def me(teacher_id: str = Depends(get_current_teacher)):
    """Return the current teacher's profile from the teachers table."""
    sb = get_supabase()
    result = (
        sb.table("teachers")
        .select("*")
        .eq("id", teacher_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher profile not found")
    return result.data
