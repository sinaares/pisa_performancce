from fastapi import APIRouter, Depends, HTTPException, status
from ..auth.dependencies import get_current_teacher
from . import service
from .models import StudentCreate, StudentUpdate, StudentProfileUpdate

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
def create(body: StudentCreate, teacher_id: str = Depends(get_current_teacher)):
    return service.create_student(teacher_id, body)


@router.get("")
def list_all(teacher_id: str = Depends(get_current_teacher)):
    return service.list_students(teacher_id)


@router.get("/{student_id}")
def get_one(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    row = service.get_student(teacher_id, student_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    return row


@router.put("/{student_id}")
def update(student_id: str, body: StudentUpdate, teacher_id: str = Depends(get_current_teacher)):
    return service.update_student(teacher_id, student_id, body)


@router.put("/{student_id}/profile")
def update_profile(
    student_id: str,
    body: StudentProfileUpdate,
    teacher_id: str = Depends(get_current_teacher),
):
    try:
        return service.update_student_profile(teacher_id, student_id, body.profile_data)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))


@router.get("/{student_id}/validation")
def validate(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    try:
        return service.validate_student_profile(teacher_id, student_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    service.delete_student(student_id, teacher_id)
