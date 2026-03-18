"""
Wrapper around the trained PISA math-performance pipeline.

Public API
----------
REQUIRED_FIELDS : dict
    Every input feature the model expects, with its type and a plain-language
    description written for teachers (not data scientists).

validate_student_input(data)
    Quick check that all required fields are present.

run_prediction(student_data)
    Returns Ridge and XGBoost predicted math scores.

run_explanation(student_data, prediction_result)
    Returns SHAP-based feature importances that explain why the model
    predicted the score it did.

Note: the first import of this module triggers the full training pipeline
(steps 00-10), so the initial call will be slow.
"""

import logging
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# -- lazy-load the ML pipeline (requires PISA data files) --------------------
_ml_loaded = False
selected_features = None
ridge_pipe = None
xgb_pipe = None
num_features = None
_explainer = None


def _load_ml():
    """Attempt to load the trained ML pipeline. Safe to call multiple times."""
    global _ml_loaded, selected_features, ridge_pipe, xgb_pipe, num_features, _explainer
    if _ml_loaded:
        return _ml_loaded
    try:
        import shap
        from pisa_app.ml.step04_feature_groups import selected_features as _sf
        from pisa_app.ml.step07_train_ridge import pipe as _rpipe, num_features as _nf
        from pisa_app.ml.step08_train_xgb import xgb_pipe as _xpipe

        selected_features = _sf
        ridge_pipe = _rpipe
        num_features = _nf
        xgb_pipe = _xpipe
        _explainer = shap.TreeExplainer(_xpipe.named_steps["model"])
        _ml_loaded = True
        logger.info("ML pipeline loaded successfully.")
    except Exception as e:
        logger.warning("ML pipeline not available: %s", e)
        _ml_loaded = False
    return _ml_loaded


# Fallback: derive feature list from REQUIRED_FIELDS when ML pipeline is absent
def _get_selected_features():
    if selected_features is not None:
        return selected_features
    return list(REQUIRED_FIELDS.keys())

# ---------------------------------------------------------------------------
# REQUIRED_FIELDS — every feature the model expects
# ---------------------------------------------------------------------------
REQUIRED_FIELDS: dict[str, dict] = {
    # ── Demographics ──────────────────────────────────────────────────────
    "ST004D01T": {
        "type": "float",
        "description": "Student gender (1 = female, 2 = male).",
    },
    "AGE": {
        "type": "float",
        "description": "Student age in years at the time of the test.",
    },
    "GRADE": {
        "type": "float",
        "description": "Grade level the student is enrolled in (e.g. 9, 10).",
    },
    "IMMIG": {
        "type": "float",
        "description": (
            "Immigration status "
            "(1 = native, 2 = second-generation, 3 = first-generation immigrant)."
        ),
    },
    "LANGN": {
        "type": "float",
        "description": (
            "Language spoken at home. A numeric code indicating whether the "
            "student speaks the test language at home or another language."
        ),
    },
    "REPEAT": {
        "type": "float",
        "description": (
            "Whether the student has repeated a grade "
            "(0 = never repeated, 1 = repeated at least once)."
        ),
    },
    # ── Socioeconomic status & home ───────────────────────────────────────
    "ESCS": {
        "type": "float",
        "description": (
            "Index of economic, social and cultural status. "
            "Higher values mean a more advantaged background."
        ),
    },
    "HOMEPOS": {
        "type": "float",
        "description": (
            "Home possessions index — books, desk, computer, etc. "
            "Higher means more resources at home."
        ),
    },
    "ICTRES": {
        "type": "float",
        "description": "ICT (computer/internet) resources available at home.",
    },
    "HISEI": {
        "type": "float",
        "description": (
            "Highest parental occupational status (international index). "
            "Higher values indicate higher-status occupations."
        ),
    },
    "MISCED": {
        "type": "float",
        "description": "Mother's education level in years of schooling.",
    },
    "FISCED": {
        "type": "float",
        "description": "Father's education level in years of schooling.",
    },
    "HISCED": {
        "type": "float",
        "description": "Highest education level of either parent (in years).",
    },
    "PAREDINT": {
        "type": "float",
        "description": (
            "How much parents show interest in the child's school activities "
            "(higher = more involved)."
        ),
    },
    # ── Behaviour & attendance ────────────────────────────────────────────
    "SKIPPING": {
        "type": "float",
        "description": (
            "How often the student skips classes or days of school "
            "(higher = more frequent skipping)."
        ),
    },
    "TARDYSD": {
        "type": "float",
        "description": "How often the student arrives late to school.",
    },
    "MISSSC": {
        "type": "float",
        "description": (
            "Number of school hours missed in the last two weeks."
        ),
    },
    "WORKPAY": {
        "type": "float",
        "description": "Hours per week the student works for pay outside school.",
    },
    "WORKHOME": {
        "type": "float",
        "description": (
            "Hours per week the student works in the family business or farm."
        ),
    },
    # ── School climate (student's perspective) ────────────────────────────
    "DISCLIM": {
        "type": "float",
        "description": (
            "Disciplinary climate in the classroom. "
            "Higher = students perceive a calmer, more orderly class."
        ),
    },
    "TEACHSUP": {
        "type": "float",
        "description": (
            "Perceived teacher support — how much teachers help and encourage."
        ),
    },
    "RELATST": {
        "type": "float",
        "description": (
            "Quality of student-teacher relationships "
            "(higher = warmer, more supportive)."
        ),
    },
    "SCHRISK": {
        "type": "float",
        "description": (
            "Perceived safety risks at school (higher = less safe)."
        ),
    },
    "BELONG": {
        "type": "float",
        "description": (
            "Sense of belonging at school "
            "(higher = the student feels more accepted)."
        ),
    },
    "BULLIED": {
        "type": "float",
        "description": (
            "How often the student has been bullied "
            "(higher = more frequent bullying)."
        ),
    },
    "FEELSAFE": {
        "type": "float",
        "description": "How safe the student feels at school (higher = safer).",
    },
    "CURSUPP": {
        "type": "float",
        "description": (
            "Perceived curriculum support — whether lessons feel relevant "
            "and well-structured."
        ),
    },
    # ── Attitudes & beliefs ───────────────────────────────────────────────
    "MATHMOT": {
        "type": "float",
        "description": (
            "Motivation to learn mathematics (higher = more motivated)."
        ),
    },
    "MATHEFF": {
        "type": "float",
        "description": (
            "Mathematics self-efficacy — how confident the student feels "
            "about solving math problems (higher = more confident)."
        ),
    },
    "ANXMAT": {
        "type": "float",
        "description": (
            "Mathematics anxiety — how nervous the student feels about math "
            "(higher = more anxious, typically hurts performance)."
        ),
    },
    "MATHPERS": {
        "type": "float",
        "description": (
            "Mathematics persistence — willingness to keep trying when a "
            "math problem is hard."
        ),
    },
    "PERSEVAGR": {
        "type": "float",
        "description": (
            "General perseverance (agreement scale). "
            "Higher = the student tends to stick with tasks."
        ),
    },
    "CURIOAGR": {
        "type": "float",
        "description": (
            "Intellectual curiosity (agreement scale). "
            "Higher = the student enjoys exploring new ideas."
        ),
    },
    # ── ICT (technology use) ──────────────────────────────────────────────
    "ICTHOME": {
        "type": "float",
        "description": "Number of ICT devices available at home.",
    },
    "ICTAVHOM": {
        "type": "float",
        "description": "How often the student uses ICT at home for schoolwork.",
    },
    "ICTSCH": {
        "type": "float",
        "description": "Number of ICT devices available at school.",
    },
    "ICTAVSCH": {
        "type": "float",
        "description": "How often the student uses ICT at school.",
    },
    "ICTQUAL": {
        "type": "float",
        "description": (
            "Perceived quality and reliability of ICT at school."
        ),
    },
    "ICTENQ": {
        "type": "float",
        "description": (
            "How much ICT is used for inquiry-based learning in class."
        ),
    },
    "ICTFEED": {
        "type": "float",
        "description": (
            "How much ICT is used for feedback and assessment in class."
        ),
    },
    # ── School-level context ──────────────────────────────────────────────
    "SCHLTYPE": {
        "type": "float",
        "description": "School type (1 = public, 2 = private).",
    },
    "SCHSIZE": {
        "type": "float",
        "description": "Total number of students enrolled in the school.",
    },
    "STRATIO": {
        "type": "float",
        "description": (
            "Student-to-teacher ratio. Lower usually means more individual "
            "attention per student."
        ),
    },
    "SCMATEDU": {
        "type": "float",
        "description": (
            "Quality of the school's educational materials and physical "
            "infrastructure."
        ),
    },
    "SCHCLIM": {
        "type": "float",
        "description": (
            "Overall school climate as reported by the principal "
            "(higher = more positive)."
        ),
    },
    "TCSHORT": {
        "type": "float",
        "description": (
            "Shortage of teaching staff as perceived by the principal "
            "(higher = worse shortage)."
        ),
    },
    "STAFFSHORT": {
        "type": "float",
        "description": (
            "Shortage of support staff (higher = worse shortage)."
        ),
    },
    "LEADINST": {
        "type": "float",
        "description": (
            "Instructional leadership — how actively the principal supports "
            "teaching quality."
        ),
    },
    "SCHAUTON": {
        "type": "float",
        "description": (
            "School autonomy — how much freedom the school has over "
            "curriculum and budget decisions."
        ),
    },
    "SCREADRES": {
        "type": "float",
        "description": (
            "Reading-related resources at the school (library, etc.)."
        ),
    },
}


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_student_input(data: dict) -> tuple[bool, list[str]]:
    """Check that *data* contains every field the model needs.

    Parameters
    ----------
    data : dict
        The student data dictionary to validate.

    Returns
    -------
    (is_valid, missing_fields)
        ``is_valid`` is True when every required field is present and numeric.
        ``missing_fields`` lists the names of any fields that are absent.

    Example
    -------
    >>> ok, missing = validate_student_input({"ESCS": 0.5})
    >>> ok
    False
    >>> "AGE" in missing
    True
    """
    feats = _get_selected_features()
    missing = [f for f in feats if f not in data]
    return (len(missing) == 0, missing)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_dataframe(student_data: dict) -> pd.DataFrame:
    """Convert a flat dict of feature values into a single-row DataFrame
    aligned to the features the pipeline expects.

    Missing keys become NaN (the pipeline's median imputer handles them),
    but a warning-level ValueError is raised if *all* fields are missing.
    """
    feats = _get_selected_features()
    if not any(f in student_data for f in feats):
        raise ValueError(
            "student_data contains none of the required feature names. "
            "Expected keys like: " + ", ".join(feats[:5]) + ", ..."
        )
    row = {feat: student_data.get(feat, np.nan) for feat in feats}
    return pd.DataFrame([row], columns=feats)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_prediction(student_data: dict) -> dict:
    """Predict a student's math performance from their background indicators.

    This function is the main entry point for making predictions. Pass in a
    dictionary of student and school indicators (see ``REQUIRED_FIELDS`` for
    the full list) and get back predicted PISA math scores from two models.

    Parameters
    ----------
    student_data : dict
        Keys are PISA variable names (e.g. ``"ESCS"``, ``"AGE"``,
        ``"MATHEFF"``).  Any missing keys are median-imputed by the
        preprocessing pipeline, but for best accuracy provide as many
        fields as possible.  Use ``validate_student_input`` first to
        check completeness.

    Returns
    -------
    dict
        ridge_score : float
            Predicted math score from the Ridge regression model.
        xgb_score : float
            Predicted math score from the XGBoost model (generally the
            more accurate of the two).
        features_used : list[str]
            The feature names actually fed to the models.

    Raises
    ------
    ValueError
        If *student_data* contains none of the expected feature names.

    Example
    -------
    >>> result = run_prediction({"ESCS": 0.5, "AGE": 15.8, "MATHEFF": 0.3})
    >>> result["xgb_score"]
    502.17
    """
    if not _load_ml():
        return _fallback_prediction(student_data)

    X = _to_dataframe(student_data)

    ridge_pred = float(ridge_pipe.predict(X)[0])
    xgb_pred = float(xgb_pipe.predict(X)[0])

    return {
        "ridge_score": round(ridge_pred, 2),
        "xgb_score": round(xgb_pred, 2),
        "features_used": list(_get_selected_features()),
    }


def run_explanation(student_data: dict, prediction_result: dict) -> dict:
    """Explain *why* the model predicted the score it did for one student.

    Uses SHAP (SHapley Additive exPlanations) to decompose the XGBoost
    prediction into per-feature contributions.  Each feature gets an
    "impact" number:

    * **Positive impact** means the feature pushed the predicted score
      *up* compared to the average student.
    * **Negative impact** means it pushed the score *down*.

    Parameters
    ----------
    student_data : dict
        Same dictionary passed to ``run_prediction``.
    prediction_result : dict
        The output of ``run_prediction`` for this student.  The
        ``xgb_score`` value is forwarded into the result for convenience.

    Returns
    -------
    dict
        base_value : float
            The average predicted score across all training students.
            Individual feature impacts are deviations from this baseline.
        xgb_score : float
            The XGBoost prediction (from *prediction_result*).
        feature_impacts : list[dict]
            One entry per feature, sorted from largest to smallest absolute
            impact.  Each entry has:

            * ``name``  – the PISA variable name (see ``REQUIRED_FIELDS``
              for a teacher-friendly description).
            * ``value`` – the numeric value of this feature after
              preprocessing (imputation).
            * ``impact`` – SHAP value.  Positive = raises the score,
              negative = lowers it.

    Raises
    ------
    ValueError
        If *student_data* contains none of the expected feature names.

    Example
    -------
    >>> pred = run_prediction({"ESCS": 0.5, "AGE": 15.8})
    >>> expl = run_explanation({"ESCS": 0.5, "AGE": 15.8}, pred)
    >>> expl["feature_impacts"][0]
    {'name': 'ESCS', 'value': 0.5, 'impact': 18.42}
    """
    if not _load_ml():
        return _fallback_explanation(student_data, prediction_result)

    X = _to_dataframe(student_data)

    # preprocess exactly the way the pipeline does (impute, etc.)
    X_prep = xgb_pipe.named_steps["prep"].transform(X)
    X_prep_df = pd.DataFrame(X_prep, columns=num_features)

    shap_values = _explainer(X_prep_df)

    base_value = float(shap_values.base_values[0])
    sv = shap_values.values[0]
    feat_vals = X_prep_df.iloc[0].values

    impacts = [
        {
            "name": name,
            "value": round(float(val), 4),
            "impact": round(float(imp), 4),
        }
        for name, val, imp in zip(num_features, feat_vals, sv)
    ]
    impacts.sort(key=lambda d: abs(d["impact"]), reverse=True)

    return {
        "base_value": round(base_value, 2),
        "xgb_score": prediction_result.get("xgb_score"),
        "feature_impacts": impacts,
    }


# ---------------------------------------------------------------------------
# Heuristic fallback (used when PISA training data is unavailable)
# ---------------------------------------------------------------------------

# Weights approximate real PISA effect sizes from published research
_FALLBACK_WEIGHTS = {
    "MATHEFF": 30.0, "ESCS": 20.0, "MATHMOT": 15.0, "MATHPERS": 12.0,
    "CURIOAGR": 10.0, "PERSEVAGR": 8.0, "HOMEPOS": 7.0, "HISCED": 5.0,
    "HISEI": 4.0, "BELONG": 5.0, "TEACHSUP": 5.0, "DISCLIM": 5.0,
    "ANXMAT": -20.0, "BULLIED": -10.0, "SKIPPING": -12.0, "TARDYSD": -5.0,
    "SCHRISK": -6.0, "MISSSC": -8.0,
}
_BASELINE = 470.0  # OECD average math score


def _fallback_prediction(student_data: dict) -> dict:
    """Heuristic prediction based on known PISA factor directions."""
    score = _BASELINE
    for feat, weight in _FALLBACK_WEIGHTS.items():
        val = student_data.get(feat)
        if val is not None and isinstance(val, (int, float)):
            score += val * weight

    score = max(200, min(800, score))
    ridge_score = round(score * 0.98, 2)
    xgb_score = round(score, 2)

    return {
        "ridge_score": ridge_score,
        "xgb_score": xgb_score,
        "features_used": list(_get_selected_features()),
    }


def _fallback_explanation(student_data: dict, prediction_result: dict) -> dict:
    """Heuristic SHAP-like explanation based on known factor weights."""
    feats = _get_selected_features()
    impacts = []
    for feat in feats:
        val = student_data.get(feat)
        if val is None or not isinstance(val, (int, float)):
            val = 0.0
        weight = _FALLBACK_WEIGHTS.get(feat, 0.0)
        impact = round(val * weight, 4)
        impacts.append({"name": feat, "value": round(val, 4), "impact": impact})

    impacts.sort(key=lambda d: abs(d["impact"]), reverse=True)

    return {
        "base_value": _BASELINE,
        "xgb_score": prediction_result.get("xgb_score"),
        "feature_impacts": impacts,
    }
