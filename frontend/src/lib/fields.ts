/**
 * PISA indicator field definitions — mirrors REQUIRED_FIELDS from the backend
 * ml_interface.py. Grouped for the profile form UI.
 */

export interface FieldDef {
  key: string;
  label: string;
  description: string;
}

export interface FieldGroup {
  title: string;
  fields: FieldDef[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "Demographics",
    fields: [
      { key: "ST004D01T", label: "Gender", description: "1 = female, 2 = male" },
      { key: "AGE", label: "Age", description: "Student age in years at the time of the test" },
      { key: "GRADE", label: "Grade", description: "Grade level (e.g. 9, 10)" },
      { key: "IMMIG", label: "Immigration status", description: "1 = native, 2 = second-gen, 3 = first-gen immigrant" },
      { key: "LANGN", label: "Language at home", description: "Whether the student speaks the test language at home" },
      { key: "REPEAT", label: "Repeated a grade", description: "0 = never, 1 = repeated at least once" },
    ],
  },
  {
    title: "Socioeconomic & Home",
    fields: [
      { key: "ESCS", label: "Economic/social/cultural status", description: "Higher = more advantaged background" },
      { key: "HOMEPOS", label: "Home possessions", description: "Books, desk, computer, etc. Higher = more resources" },
      { key: "ICTRES", label: "ICT resources at home", description: "Computer/internet resources at home" },
      { key: "HISEI", label: "Parental occupation status", description: "Highest parental occupational status. Higher = higher status" },
      { key: "MISCED", label: "Mother's education (years)", description: "Mother's education level in years of schooling" },
      { key: "FISCED", label: "Father's education (years)", description: "Father's education level in years of schooling" },
      { key: "HISCED", label: "Highest parental education", description: "Highest education of either parent (years)" },
      { key: "PAREDINT", label: "Parental interest", description: "How much parents show interest in school activities" },
    ],
  },
  {
    title: "Behaviour & Attendance",
    fields: [
      { key: "SKIPPING", label: "Skipping", description: "How often the student skips classes (higher = more)" },
      { key: "TARDYSD", label: "Tardiness", description: "How often the student arrives late to school" },
      { key: "MISSSC", label: "Missed school hours", description: "School hours missed in the last two weeks" },
      { key: "WORKPAY", label: "Paid work (hrs/week)", description: "Hours per week working for pay outside school" },
      { key: "WORKHOME", label: "Family work (hrs/week)", description: "Hours per week working in family business/farm" },
    ],
  },
  {
    title: "School Climate",
    fields: [
      { key: "DISCLIM", label: "Disciplinary climate", description: "Higher = calmer, more orderly classroom" },
      { key: "TEACHSUP", label: "Teacher support", description: "How much teachers help and encourage" },
      { key: "RELATST", label: "Student-teacher relations", description: "Higher = warmer, more supportive" },
      { key: "SCHRISK", label: "School safety risk", description: "Perceived safety risks (higher = less safe)" },
      { key: "BELONG", label: "Sense of belonging", description: "Higher = student feels more accepted at school" },
      { key: "BULLIED", label: "Bullying", description: "How often bullied (higher = more frequent)" },
      { key: "FEELSAFE", label: "Feels safe", description: "How safe the student feels at school" },
      { key: "CURSUPP", label: "Curriculum support", description: "Whether lessons feel relevant and well-structured" },
    ],
  },
  {
    title: "Attitudes & Beliefs",
    fields: [
      { key: "MATHMOT", label: "Math motivation", description: "Motivation to learn mathematics" },
      { key: "MATHEFF", label: "Math self-efficacy", description: "Confidence in solving math problems" },
      { key: "ANXMAT", label: "Math anxiety", description: "Nervousness about math (higher typically hurts performance)" },
      { key: "MATHPERS", label: "Math persistence", description: "Willingness to keep trying on hard problems" },
      { key: "PERSEVAGR", label: "Perseverance", description: "Tendency to stick with tasks" },
      { key: "CURIOAGR", label: "Curiosity", description: "Enjoys exploring new ideas" },
    ],
  },
  {
    title: "Technology (ICT)",
    fields: [
      { key: "ICTHOME", label: "ICT devices at home", description: "Number of ICT devices available at home" },
      { key: "ICTAVHOM", label: "ICT use at home", description: "How often ICT is used at home for schoolwork" },
      { key: "ICTSCH", label: "ICT devices at school", description: "Number of ICT devices at school" },
      { key: "ICTAVSCH", label: "ICT use at school", description: "How often ICT is used at school" },
      { key: "ICTQUAL", label: "ICT quality", description: "Perceived quality/reliability of school ICT" },
      { key: "ICTENQ", label: "ICT for inquiry learning", description: "How much ICT is used for inquiry-based learning" },
      { key: "ICTFEED", label: "ICT for feedback", description: "How much ICT is used for feedback/assessment" },
    ],
  },
  {
    title: "School Context",
    fields: [
      { key: "SCHLTYPE", label: "School type", description: "1 = public, 2 = private" },
      { key: "SCHSIZE", label: "School size", description: "Total students enrolled" },
      { key: "STRATIO", label: "Student-teacher ratio", description: "Lower = more individual attention" },
      { key: "SCMATEDU", label: "Material resources", description: "Quality of educational materials and infrastructure" },
      { key: "SCHCLIM", label: "School climate (principal)", description: "Overall school climate reported by principal" },
      { key: "TCSHORT", label: "Teacher shortage", description: "Shortage of teaching staff (higher = worse)" },
      { key: "STAFFSHORT", label: "Staff shortage", description: "Shortage of support staff (higher = worse)" },
      { key: "LEADINST", label: "Instructional leadership", description: "How actively the principal supports teaching quality" },
      { key: "SCHAUTON", label: "School autonomy", description: "Freedom over curriculum and budget decisions" },
      { key: "SCREADRES", label: "Reading resources", description: "Reading-related resources at school (library, etc.)" },
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
