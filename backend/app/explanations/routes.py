from fastapi import APIRouter, Depends, HTTPException, status
from ..auth.dependencies import get_current_teacher
from . import service

router = APIRouter()


@router.get("/{student_id}/explanations/latest")
def latest(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    row = service.get_latest_explanation(teacher_id, student_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No explanations yet")
    return row


@router.get("/{student_id}/explanations")
def history(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    items = service.list_explanations(teacher_id, student_id)
    return {"explanations": items, "count": len(items)}
