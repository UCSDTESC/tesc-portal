import { describe, expect, it } from "vitest";
import {
  AS_ATTENDANCE_AFFILIATION,
  AS_ATTENDANCE_FORM_BASE,
  AS_ATTENDANCE_HEAR_ABOUT,
  buildAsAttendanceFormUrl,
  classYearFormLabel,
} from "./asAttendanceForm";

describe("classYearFormLabel", () => {
  it("maps known graduation years to the exact form radio labels", () => {
    expect(classYearFormLabel(2027)).toBe("Class of \u201827");
    expect(classYearFormLabel("2028")).toBe("Class of '28");
    expect(classYearFormLabel("2029")).toBe("Class of '29");
    expect(classYearFormLabel(2030)).toBe("Class of '30");
  });

  it("omits unknown or missing years", () => {
    expect(classYearFormLabel(2031)).toBeUndefined();
    expect(classYearFormLabel("")).toBeUndefined();
    expect(classYearFormLabel(null)).toBeUndefined();
    expect(classYearFormLabel(undefined)).toBeUndefined();
  });
});

describe("buildAsAttendanceFormUrl", () => {
  it("prefills year, affiliation, how they heard, and food", () => {
    const url = buildAsAttendanceFormUrl({
      foodProvided: "Pizza",
      expectedGrad: 2028,
    });
    const parsed = new URL(url);
    expect(`${parsed.origin}${parsed.pathname}`).toBe(AS_ATTENDANCE_FORM_BASE);
    expect(parsed.searchParams.get("usp")).toBe("pp_url");
    expect(parsed.searchParams.get("embedded")).toBeNull();
    expect(parsed.searchParams.get("entry.219446721")).toBeNull();
    expect(parsed.searchParams.get("entry.570464428")).toBe("Pizza");
    expect(parsed.searchParams.get("entry.1687560837")).toBe("Class of '28");
    expect(parsed.searchParams.get("entry.1851239463")).toBe(AS_ATTENDANCE_AFFILIATION);
    expect(parsed.searchParams.get("entry.153208156")).toBe(AS_ATTENDANCE_HEAR_ABOUT);
  });

  it("uses N/A when food is missing and omits year when unknown", () => {
    const url = buildAsAttendanceFormUrl({
      foodProvided: "  ",
      expectedGrad: 2035,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("entry.570464428")).toBe("N/A");
    expect(parsed.searchParams.get("entry.1687560837")).toBeNull();
  });
});
