from groq import Groq

from ..config import get_settings
from ..database import get_supabase, safe_data
from .prompt_builder import build_student_context, build_messages

SESSIONS_TABLE = "chat_sessions"
MESSAGES_TABLE = "chat_messages"
AUTO_SUMMARY_INTERVAL = 10  # generate summary every N messages


def _get_or_create_session(sb, student_id: str, teacher_id: str) -> dict:
    """Find the existing chat session for this student+teacher, or create one."""
    session = safe_data(
        sb.table(SESSIONS_TABLE)
        .select("*")
        .eq("student_id", student_id)
        .eq("teacher_id", teacher_id)
        .order("created_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    if session:
        return session

    # create a new session
    result = sb.table(SESSIONS_TABLE).insert({
        "student_id": student_id,
        "teacher_id": teacher_id,
        "title": "Conversation",
    }).execute()
    return result.data[0]


def get_history(student_id: str, teacher_id: str, limit: int = 50) -> list[dict]:
    sb = get_supabase()

    # find the session
    session = safe_data(
        sb.table(SESSIONS_TABLE)
        .select("id")
        .eq("student_id", student_id)
        .eq("teacher_id", teacher_id)
        .order("created_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    if not session:
        return []

    result = (
        sb.table(MESSAGES_TABLE)
        .select("*")
        .eq("session_id", session["id"])
        .order("created_at")
        .limit(limit)
        .execute()
    )
    return result.data


def _get_profile_data(sb, student_id: str, teacher_id: str) -> dict:
    """Get profile_data from student_profiles table."""
    profile = safe_data(
        sb.table("student_profiles")
        .select("profile_data")
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    )
    return profile.get("profile_data", {}) if profile else {}


def send_message(student_id: str, teacher_id: str, message: str) -> dict:
    """Store user message, call Groq LLM, store reply, auto-summarize."""
    sb = get_supabase()
    settings = get_settings()

    # verify student exists
    student = safe_data(
        sb.table("students")
        .select("id")
        .eq("id", student_id)
        .eq("teacher_id", teacher_id)
        .maybe_single()
        .execute()
    )
    if not student:
        raise ValueError("Student not found")

    # get or create chat session
    session = _get_or_create_session(sb, student_id, teacher_id)
    session_id = session["id"]

    # load profile data
    indicators = _get_profile_data(sb, student_id, teacher_id)

    # latest prediction + explanation
    prediction = safe_data(
        sb.table("predictions")
        .select("id, prediction_result")
        .eq("student_id", student_id)
        .eq("created_by", teacher_id)
        .order("created_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )

    explanation = None
    if prediction:
        expl_row = safe_data(
            sb.table("explanations")
            .select("explanation_data")
            .eq("prediction_id", prediction["id"])
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        if expl_row:
            explanation = expl_row.get("explanation_data")

    # build grounded prompt
    context = build_student_context(
        indicators,
        prediction.get("prediction_result") if prediction else None,
        explanation,
    )

    # get history via session
    history_rows = (
        sb.table(MESSAGES_TABLE)
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at")
        .limit(50)
        .execute()
    ).data
    llm_messages = build_messages(context, history_rows, message)

    # store user message
    sb.table(MESSAGES_TABLE).insert({
        "session_id": session_id,
        "role": "user",
        "content": message,
    }).execute()

    # call Groq LLM
    if settings.groq_api_key:
        try:
            client = Groq(api_key=settings.groq_api_key)
            resp = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=llm_messages,
                temperature=0.4,
                max_tokens=1024,
                timeout=30,
            )
            reply_text = resp.choices[0].message.content
        except Exception:
            reply_text = (
                "I'm sorry, I'm having trouble responding right now. "
                "Please try again in a moment."
            )
    else:
        reply_text = (
            "[LLM integration pending] "
            "Configure GROQ_API_KEY in .env to enable AI chat responses."
        )

    # store assistant reply
    saved = sb.table(MESSAGES_TABLE).insert({
        "session_id": session_id,
        "role": "assistant",
        "content": reply_text,
    }).execute()

    # auto-summarize every N messages
    _maybe_auto_summarize(sb, student_id, teacher_id, session_id)

    return saved.data[0]


def _maybe_auto_summarize(sb, student_id: str, teacher_id: str, session_id: str):
    """Generate a summary if the message count hit the interval threshold."""
    try:
        count_result = (
            sb.table(MESSAGES_TABLE)
            .select("id", count="exact")
            .eq("session_id", session_id)
            .execute()
        )
        count = count_result.count or 0
        if count > 0 and count % AUTO_SUMMARY_INTERVAL == 0:
            from ..summaries.service import generate_summary_from_chat

            messages = (
                sb.table(MESSAGES_TABLE)
                .select("role, content")
                .eq("session_id", session_id)
                .order("created_at")
                .limit(50)
                .execute()
            ).data
            if messages:
                generate_summary_from_chat(teacher_id, student_id, messages)
    except Exception:
        pass  # summary failure should never block the chat response
