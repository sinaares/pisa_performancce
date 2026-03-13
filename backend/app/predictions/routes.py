from fastapi import APIRouter, Depends, HTTPException, status
from ..auth.dependencies import get_current_teacher
from . import service
from .service import MissingFieldsError

router = APIRouter()


@router.post("/{student_id}/predict", status_code=status.HTTP_201_CREATED)
def predict(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    """Run prediction + auto-generate explanation for a student."""
    try:
        return service.run_student_prediction(teacher_id, student_id)
    except MissingFieldsError as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": str(exc),
                "missing_fields": exc.missing_fields,
            },
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))


@router.get("/{student_id}/predictions/latest")
def latest(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    row = service.get_latest_prediction(teacher_id, student_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No predictions yet")
    return row


@router.get("/{student_id}/predictions")
def history(student_id: str, teacher_id: str = Depends(get_current_teacher)):
    items = service.list_predictions(teacher_id, student_id)
    return {"predictions": items, "count": len(items)}
