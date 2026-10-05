import { describe, expect, it } from "vitest";
import {
  clearMemberProfileSetupSkip,
  isMemberProfileIncomplete,
  shouldSkipMemberProfileSetupPrompt,
  skipMemberProfileSetupPrompt,
} from "./userProfile";

describe("isMemberProfileIncomplete", () => {
  it("treats a missing row as incomplete", () => {
    expect(isMemberProfileIncomplete(null)).toBe(true);
    expect(isMemberProfileIncomplete(undefined)).toBe(true);
  });

  it("requires first name, last name, major, and graduation year", () => {
    expect(
      isMemberProfileIncomplete({
        first_name: "Ada",
        last_name: "Lovelace",
        major: "CSE",
        expected_grad: 2027,
      }),
    ).toBe(false);
    expect(
      isMemberProfileIncomplete({
        first_name: "Ada",
        last_name: "Lovelace",
        major: "CSE",
        expected_grad: "2027",
      }),
    ).toBe(false);
  });

  it("treats blank or whitespace fields as incomplete", () => {
    const complete = {
      first_name: "Ada",
      last_name: "Lovelace",
      major: "CSE",
      expected_grad: 2027,
    };
    expect(isMemberProfileIncomplete({ ...complete, first_name: "  " })).toBe(true);
    expect(isMemberProfileIncomplete({ ...complete, last_name: "" })).toBe(true);
    expect(isMemberProfileIncomplete({ ...complete, major: null })).toBe(true);
    expect(isMemberProfileIncomplete({ ...complete, expected_grad: "" })).toBe(true);
    expect(isMemberProfileIncomplete({ ...complete, expected_grad: null })).toBe(true);
  });
});

describe("profile setup skip", () => {
  it("skips only for the dismissed user until cleared", () => {
    clearMemberProfileSetupSkip();
    skipMemberProfileSetupPrompt("user-1");
    expect(shouldSkipMemberProfileSetupPrompt("user-1")).toBe(true);
    expect(shouldSkipMemberProfileSetupPrompt("user-2")).toBe(false);
    clearMemberProfileSetupSkip();
    expect(shouldSkipMemberProfileSetupPrompt("user-1")).toBe(false);
  });
});
