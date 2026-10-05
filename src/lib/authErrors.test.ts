import { describe, expect, it } from "vitest";
import { formatAuthError, isAllowedMemberEmail } from "./authErrors";

describe("isAllowedMemberEmail", () => {
  it("accepts ucsd.edu and subdomains", () => {
    expect(isAllowedMemberEmail("abassette@ucsd.edu")).toBe(true);
    expect(isAllowedMemberEmail("name@eng.ucsd.edu")).toBe(true);
  });

  it("rejects personal emails", () => {
    expect(isAllowedMemberEmail("person@gmail.com")).toBe(false);
    expect(isAllowedMemberEmail("person@ucsd.edu.com")).toBe(false);
  });
});

describe("formatAuthError", () => {
  it("explains the domain restriction instead of a database error", () => {
    expect(formatAuthError("Database error saving new user")).toBe(
      "Please use a UCSD email (@ucsd.edu) to create an account.",
    );
    expect(
      formatAuthError("ERROR: Email domain not allowed. Try again with another email."),
    ).toBe("Please use a UCSD email (@ucsd.edu) to create an account.");
  });

  it("uses the recruiter copy when the work email is not approved", () => {
    expect(formatAuthError("Database error saving new user", true)).toBe(
      "This work email is not approved. Email contact@tescatucsd.org for access.",
    );
  });
});
