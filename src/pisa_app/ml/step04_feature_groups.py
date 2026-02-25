from .step03_merge import df, school_features

# ---- STUDENT-LEVEL FEATURE GROUPS ----

feature_groups_student = {
    "demographics": [
        "ST004D01T",   # gender
        "AGE",
        "GRADE",
        "IMMIG",
        "LANGN",
        "REPEAT",
    ],
    "ses_home": [
        "ESCS", "HOMEPOS", "ICTRES", "HISEI",
        "MISCED", "FISCED", "HISCED", "PAREDINT",
    ],
    "behavior_attendance": [
        "SKIPPING", "TARDYSD", "MISSSC",
        "WORKPAY", "WORKHOME",
    ],
    "school_climate_student_view": [
        "DISCLIM", "TEACHSUP", "RELATST", "SCHRISK",
        "BELONG", "BULLIED", "FEELSAFE", "CURSUPP",
    ],
    "attitudes_beliefs": [
        "MATHMOT", "MATHEFF", "ANXMAT", "MATHPERS",
        "PERSEVAGR", "CURIOAGR",
    ],
    "ict_student": [
        "ICTHOME", "ICTAVHOM",
        "ICTSCH", "ICTAVSCH", "ICTQUAL",
        "ICTENQ", "ICTFEED",
    ],
}

# ---- SCHOOL-LEVEL FEATURES (already determined above) ----
feature_groups_school = {
    "school_context": school_features    # from the merge step
}

# Flatten everything and keep only existing columns in df
requested_features = []
for grp in feature_groups_student.values():
    requested_features.extend(grp)
for grp in feature_groups_school.values():
    requested_features.extend(grp)

requested_features = list(dict.fromkeys(requested_features))  # remove duplicates

selected_features = [c for c in requested_features if c in df.columns]
missing_features = [c for c in requested_features if c not in df.columns]

print(f"✅ {len(selected_features)} selected features present in merged df.")
print(f"ℹ️ {len(missing_features)} requested features not found (name differences, etc.).")
print("Example missing:", missing_features[:10])