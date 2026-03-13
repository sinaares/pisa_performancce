"""Build grounded prompts for the LLM, injecting student context."""

import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "src"))

from ml_interface import REQUIRED_FIELDS

SYSTEM_PROMPT = """\
You are a helpful educational assistant for teachers using the PISA student \
performance prediction system.  You answer questions about a specific student's \
predicted math score and the factors that influenced it.

Keep your language clear, supportive, and non-judgmental.  Avoid jargon — \
explain PISA indicators in plain language.  When recommending actions, be \
practical and specific.
"""


def build_student_context(
    indicators: dict[str, float],
    prediction: dict | None,
    explanation: dict | None,
) -> str:
    """Return a markdown block the LLM can reference for grounded answers."""
    lines = ["## Student Profile"]

    for key, val in indicators.items():
        desc = REQUIRED_FIELDS.get(key, {}).get("description", key)
        lines.append(f"- **{key}** ({desc}): {val}")

    if not indicators:
        lines.append(
            "\n**Note:** No profile data has been entered for this student yet. "
            "If the teacher asks about performance, let them know they need to "
            "complete the student profile first."
        )

    if prediction:
        lines.append("\n## Latest Prediction")
        lines.append(f"- Ridge score: {prediction.get('ridge_score')}")
        lines.append(f"- XGBoost score: {prediction.get('xgb_score')}")
    else:
        lines.append(
            "\n## Latest Prediction\nNo prediction has been generated yet. "
            "If the teacher asks about predictions, let them know they should "
            "complete the student profile and generate a prediction first."
        )

    if explanation:
        lines.append("\n## Top Factors (SHAP explanation)")
        impacts = explanation.get("feature_impacts", [])[:10]
        for f in impacts:
            desc = REQUIRED_FIELDS.get(f["name"], {}).get("description", f["name"])
            direction = "raises" if f["impact"] > 0 else "lowers"
            lines.append(
                f"- **{f['name']}** ({desc}): {direction} score by "
                f"{abs(f['impact']):.1f} points"
            )

    return "\n".join(lines)


def build_messages(
    student_context: str,
    chat_history: list[dict],
    new_message: str,
) -> list[dict]:
    """Return the message list to send to the LLM."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": student_context},
    ]
    for msg in chat_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": new_message})
    return messages
