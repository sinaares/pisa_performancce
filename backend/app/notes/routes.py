from fastapi import APIRouter, Depends, HTTPException, Query, status
from ..auth.dependencies import get_current_teacher
from . import service
from .models import NoteCreate, NoteUpdate

router = APIRouter()


@router.post("/{student_id}/notes", status_code=status.HTTP_201_CREATED)
def create(
    student_id: str,
    body: NoteCreate,
    teacher_id: str = Depends(get_current_teacher),
):
    try:
        return service.create_note(teacher_id, student_id, body.content)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))


@router.get("/{student_id}/notes")
def list_notes(
    student_id: str,
    teacher_id: str = Depends(get_current_teacher),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return service.list_notes(teacher_id, student_id, limit, offset)


@router.put("/{student_id}/notes/{note_id}")
def update(
    student_id: str,
    note_id: str,
    body: NoteUpdate,
    teacher_id: str = Depends(get_current_teacher),
):
    try:
        return service.update_note(teacher_id, note_id, body.content)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))


@router.delete(
    "/{student_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete(
    student_id: str,
    note_id: str,
    teacher_id: str = Depends(get_current_teacher),
):
    service.delete_note(teacher_id, note_id)
