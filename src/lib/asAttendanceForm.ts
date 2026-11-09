export const AS_ATTENDANCE_FORM_BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSc3CypbxjZgU7ZzbhlpEy1XtytmzDquuU4ELmf_VtDRjkDomw/viewform";

const ACADEMIC_YEAR_ENTRY = "entry.1687560837";
const AFFILIATION_ENTRY = "entry.1851239463";
const HEAR_ABOUT_ENTRY = "entry.153208156";
const FOOD_ENTRY = "entry.570464428";

export const AS_ATTENDANCE_AFFILIATION = "Attendee / Prospective Member";
export const AS_ATTENDANCE_HEAR_ABOUT = "Posted Flyers / Posters";

/** Exact Google Form radio labels, including the curly apostrophe on 2027. */
const CLASS_YEAR_LABELS: Record<string, string> = {
  "2027": "Class of \u201827",
  "2028": "Class of '28",
  "2029": "Class of '29",
  "2030": "Class of '30",
};

export function classYearFormLabel(
  expectedGrad: string | number | null | undefined,
): string | undefined {
  if (expectedGrad == null || expectedGrad === "") return undefined;
  const year = String(expectedGrad).trim();
  return CLASS_YEAR_LABELS[year];
}

export function buildAsAttendanceFormUrl({
  foodProvided,
  expectedGrad,
}: {
  foodProvided?: string | null;
  expectedGrad?: string | number | null;
}): string {
  const params = new URLSearchParams({
    usp: "pp_url",
    [AFFILIATION_ENTRY]: AS_ATTENDANCE_AFFILIATION,
    [HEAR_ABOUT_ENTRY]: AS_ATTENDANCE_HEAR_ABOUT,
    [FOOD_ENTRY]: foodProvided?.trim() ? foodProvided.trim() : "N/A",
  });
  const yearLabel = classYearFormLabel(expectedGrad);
  if (yearLabel) params.set(ACADEMIC_YEAR_ENTRY, yearLabel);
  return `${AS_ATTENDANCE_FORM_BASE}?${params.toString()}`;
}
