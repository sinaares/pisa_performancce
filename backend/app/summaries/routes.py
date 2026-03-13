from fastapi import APIRouter, Depends, HTTPException, status
from ..auth.dependencies import get_current_teacher
from . import service

router = APIRouter()


@router.post("/{student_id}/summary/regenerate", status_code=status.HTTP_201_CREATED)
def regenerate(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    try:
        return service.regenerate_summary(teacher_id, student_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))


@router.get("/{student_id}/summaries")
def list_summaries(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    return service.list_summaries(teacher_id, student_id)
