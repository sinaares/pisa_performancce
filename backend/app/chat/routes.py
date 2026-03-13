import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from ..auth.dependencies import get_current_teacher
from . import service
from .models import ChatRequest

router = APIRouter()

# Simple in-memory rate limiter: teacher_id -> last send timestamp
_last_send: dict[str, float] = defaultdict(float)
RATE_LIMIT_SECONDS = 2.0


@router.post("")
def send(body: ChatRequest, teacher_id: str = Depends(get_current_teacher)):
    # rate limit: max 1 message per 2 seconds per user
    now = time.time()
    if now - _last_send[teacher_id] < RATE_LIMIT_SECONDS:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Please wait a moment before sending another message.",
        )
    _last_send[teacher_id] = now

    try:
        return service.send_message(body.student_id, teacher_id, body.message)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))


@router.get("/{student_id}")
def history(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    return service.get_history(student_id, teacher_id)


@router.get("/{student_id}/messages")
def messages(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    """Alias for history — used by the timeline component."""
    return service.get_history(student_id, teacher_id)
