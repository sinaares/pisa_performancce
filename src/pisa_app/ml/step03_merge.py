from .step01_load_data import stu, sch

# key for merging
school_key = "CNTSCHID"

# Candidate school indices / context variables
school_feature_candidates = [
    # typical PISA school indices (names may differ slightly per release)
    "SCHLTYPE",   # public / private
    "SCHSIZE",    # school size
    "STRATIO",    # student-teacher ratio
    "SCMATEDU",   # material resources
    "SCHCLIM",    # school climate
    "TCSHORT",    # teacher shortage
    "STAFFSHORT",
    "LEADINST",   # instructional leadership
    "SCHAUTON",   # school autonomy
    "SCREADRES",  # reading resources
    "ICTSCH", "ICTAVSCH", "ICTQUAL",  # ICT resources at school
]

# Keep only those that actually exist in your school file
school_features = [c for c in school_feature_candidates if c in sch.columns]
print(f"School features found in school file: {school_features}")

# Subset school data to the key + selected features
sch_sub = sch[[school_key] + school_features].copy()

# Merge student + school data
df = stu.merge(
    sch_sub,
    on=school_key,
    how="left",
    validate="many_to_one"  # many students per one school
)

df.shape