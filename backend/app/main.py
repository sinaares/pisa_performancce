from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .auth.routes import router as auth_router
from .students.routes import router as students_router
from .predictions.routes import router as predictions_router
from .explanations.routes import router as explanations_router
from .chat.routes import router as chat_router
from .notes.routes import router as notes_router
from .summaries.routes import router as summaries_router

settings = get_settings()

app = FastAPI(
    title="PISA Performance API",
    description="Predict and explain student math performance using PISA indicators.",
    version="0.1.0",
)

# CORS — never allow "*" in production
_origins = [o.strip() for o in settings.frontend_url.split(",") if o.strip()]
if "*" in _origins and not settings.debug:
    raise RuntimeError(
        "CORS allow_origins='*' is not allowed in production. "
        "Set FRONTEND_URL to the actual frontend domain."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(students_router, prefix="/api/students", tags=["students"])
app.include_router(predictions_router, prefix="/api/students", tags=["predictions"])
app.include_router(explanations_router, prefix="/api/students", tags=["explanations"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(notes_router, prefix="/api/students", tags=["notes"])
app.include_router(summaries_router, prefix="/api/students", tags=["summaries"])


@app.get("/health")
def health():
    return {"status": "ok"}
