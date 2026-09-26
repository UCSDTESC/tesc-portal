import { describe, expect, it } from "vitest";
import {
  canViewInternalEvent,
  filterEventsForInternalVisibility,
} from "./internalEventVisibility";

describe("canViewInternalEvent", () => {
  it("always allows non-internal events", () => {
    expect(canViewInternalEvent({ type: "external", org_id: 1 }, { userId: "u" })).toBe(true);
  });

  it("lets super_org see internals from any org", () => {
    expect(
      canViewInternalEvent(
        { type: "internal", org_id: 42 },
        { isSuperOrg: true, userOrgIds: [], userId: "u" },
      ),
    ).toBe(true);
  });

  it("matches numeric event org_id to string membership ids", () => {
    expect(
      canViewInternalEvent(
        { type: "internal", org_id: 42 },
        { userOrgIds: ["42"], userId: "u" },
      ),
    ).toBe(true);
  });

  it("hides internals for other orgs and logged-out users", () => {
    expect(
      canViewInternalEvent(
        { type: "internal", org_id: 42 },
        { userOrgIds: ["7"], userId: "u" },
      ),
    ).toBe(false);
    expect(
      canViewInternalEvent({ type: "internal", org_id: 42 }, { userOrgIds: ["42"] }),
    ).toBe(false);
  });
});

describe("filterEventsForInternalVisibility", () => {
  const events = [
    { id: 1, type: "external" as const, org_id: 1 },
    { id: 2, type: "internal" as const, org_id: 42 },
    { id: 3, type: "internal" as const, org_id: 7 },
  ];

  it("keeps the selected org's internals when membership ids are strings", () => {
    expect(
      filterEventsForInternalVisibility(events, { userOrgIds: ["42"], userId: "u" }).map(
        (event) => event.id,
      ),
    ).toEqual([1, 2]);
  });
});
