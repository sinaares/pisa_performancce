/**
 * PISA indicator field definitions — mirrors REQUIRED_FIELDS from the backend
 * ml_interface.py. Grouped for the profile form UI.
 */

export interface FieldDef {
  key: string;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

export interface FieldGroup {
  title: string;
  fields: FieldDef[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "Demographics",
    fields: [
      { key: "ST004D01T", label: "Gender", description: "1 = female, 2 = male", min: 1, max: 2, step: 1 },
      { key: "AGE", label: "Age", description: "Student age in years (10–22)", min: 10, max: 22, step: 0.1 },
      { key: "GRADE", label: "Grade", description: "Grade level (7–13)", min: 7, max: 13, step: 1 },
      { key: "IMMIG", label: "Immigration status", description: "1 = native, 2 = second-gen, 3 = first-gen", min: 1, max: 3, step: 1 },
      { key: "LANGN", label: "Language at home", description: "1 = test language, 2 = other language", min: 1, max: 2, step: 1 },
      { key: "REPEAT", label: "Repeated a grade", description: "0 = never, 1 = repeated at least once", min: 0, max: 1, step: 1 },
    ],
  },
  {
    title: "Socioeconomic & Home",
    fields: [
      { key: "ESCS", label: "Economic/social/cultural status", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "HOMEPOS", label: "Home possessions", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "ICTRES", label: "ICT resources at home", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "HISEI", label: "Parental occupation status", description: "Occupational status index (10–90)", min: 10, max: 90, step: 1 },
      { key: "MISCED", label: "Mother's education (years)", description: "Years of schooling (0–18)", min: 0, max: 18, step: 1 },
      { key: "FISCED", label: "Father's education (years)", description: "Years of schooling (0–18)", min: 0, max: 18, step: 1 },
      { key: "HISCED", label: "Highest parental education", description: "Highest of either parent in years (0–18)", min: 0, max: 18, step: 1 },
      { key: "PAREDINT", label: "Parental interest", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
    ],
  },
  {
    title: "Behaviour & Attendance",
    fields: [
      { key: "SKIPPING", label: "Skipping", description: "Standardised index (−3 to 3)", min: -3, max: 3, step: 0.01 },
      { key: "TARDYSD", label: "Tardiness", description: "Standardised index (−3 to 3)", min: -3, max: 3, step: 0.01 },
      { key: "MISSSC", label: "Missed school hours", description: "Hours missed in last two weeks (0–40)", min: 0, max: 40, step: 1 },
      { key: "WORKPAY", label: "Paid work (hrs/week)", description: "Hours per week (0–60)", min: 0, max: 60, step: 1 },
      { key: "WORKHOME", label: "Family work (hrs/week)", description: "Hours per week (0–60)", min: 0, max: 60, step: 1 },
    ],
  },
  {
    title: "School Climate",
    fields: [
      { key: "DISCLIM", label: "Disciplinary climate", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "TEACHSUP", label: "Teacher support", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "RELATST", label: "Student-teacher relations", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "SCHRISK", label: "School safety risk", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "BELONG", label: "Sense of belonging", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "BULLIED", label: "Bullying", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "FEELSAFE", label: "Feels safe", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "CURSUPP", label: "Curriculum support", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
    ],
  },
  {
    title: "Attitudes & Beliefs",
    fields: [
      { key: "MATHMOT", label: "Math motivation", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "MATHEFF", label: "Math self-efficacy", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "ANXMAT", label: "Math anxiety", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "MATHPERS", label: "Math persistence", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "PERSEVAGR", label: "Perseverance", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "CURIOAGR", label: "Curiosity", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
    ],
  },
  {
    title: "Technology (ICT)",
    fields: [
      { key: "ICTHOME", label: "ICT devices at home", description: "Number of devices (0–20)", min: 0, max: 20, step: 1 },
      { key: "ICTAVHOM", label: "ICT use at home", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "ICTSCH", label: "ICT devices at school", description: "Number of devices (0–20)", min: 0, max: 20, step: 1 },
      { key: "ICTAVSCH", label: "ICT use at school", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "ICTQUAL", label: "ICT quality", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "ICTENQ", label: "ICT for inquiry learning", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "ICTFEED", label: "ICT for feedback", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
    ],
  },
  {
    title: "School Context",
    fields: [
      { key: "SCHLTYPE", label: "School type", description: "1 = public, 2 = private", min: 1, max: 2, step: 1 },
      { key: "SCHSIZE", label: "School size", description: "Total students enrolled (10–10000)", min: 10, max: 10000, step: 1 },
      { key: "STRATIO", label: "Student-teacher ratio", description: "Students per teacher (1–100)", min: 1, max: 100, step: 0.1 },
      { key: "SCMATEDU", label: "Material resources", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "SCHCLIM", label: "School climate (principal)", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "TCSHORT", label: "Teacher shortage", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "STAFFSHORT", label: "Staff shortage", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "LEADINST", label: "Instructional leadership", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "SCHAUTON", label: "School autonomy", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
      { key: "SCREADRES", label: "Reading resources", description: "Standardised index (−5 to 5)", min: -5, max: 5, step: 0.01 },
    ],
  },
];

/** Flat map: field key → FieldDef for quick lookups */
export const FIELD_MAP: Record<string, FieldDef> = {};
for (const group of FIELD_GROUPS) {
  for (const field of group.fields) {
    FIELD_MAP[field.key] = field;
  }
}

/** All field keys in order */
export const ALL_FIELD_KEYS = FIELD_GROUPS.flatMap((g) =>
  g.fields.map((f) => f.key),
);
