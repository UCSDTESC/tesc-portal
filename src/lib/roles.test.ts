import { describe, expect, it } from "vitest";
import {
  canManageOrgMembers,
  canManageOrgProfile,
  canManageUsers,
  formatRoleLabel,
  isOrgLeaderAssignableRole,
  resolveUserRoleFromNames,
} from "./roles";

describe("resolveUserRoleFromNames", () => {
  it("prefers higher-privilege roles", () => {
    expect(resolveUserRoleFromNames(["member", "board", "org leader"])).toBe("org leader");
    expect(resolveUserRoleFromNames(["member", "board"])).toBe("board");
    expect(resolveUserRoleFromNames(["member"])).toBe("member");
  });

  it("maps board instead of internal", () => {
    expect(resolveUserRoleFromNames(["board"])).toBe("board");
    expect(resolveUserRoleFromNames(["internal"])).toBe("board");
  });
});

describe("permissions", () => {
  it("canManageOrgProfile includes board and org leader", () => {
    expect(canManageOrgProfile("board")).toBe(true);
    expect(canManageOrgProfile("org leader")).toBe(true);
    expect(canManageOrgProfile("member")).toBe(false);
  });

  it("canManageUsers is super_org super_user only", () => {
    expect(canManageUsers("super_org", "super_user")).toBe(true);
    expect(canManageUsers("TESC", "org leader")).toBe(false);
  });

  it("canManageOrgMembers is org leader on non-super org only", () => {
    expect(canManageOrgMembers("ACM", "org leader")).toBe(true);
    expect(canManageOrgMembers("super_org", "org leader")).toBe(false);
    expect(canManageOrgMembers("ACM", "board")).toBe(false);
  });
});

describe("isOrgLeaderAssignableRole", () => {
  it("allows member, board, and org leader", () => {
    expect(isOrgLeaderAssignableRole("member")).toBe(true);
    expect(isOrgLeaderAssignableRole("board")).toBe(true);
    expect(isOrgLeaderAssignableRole("org leader")).toBe(true);
    expect(isOrgLeaderAssignableRole("org leader\n")).toBe(true);
  });

  it("blocks privileged roles", () => {
    expect(isOrgLeaderAssignableRole("super_user")).toBe(false);
    expect(isOrgLeaderAssignableRole("company")).toBe(false);
  });
});

describe("formatRoleLabel", () => {
  it("formats display names", () => {
    expect(formatRoleLabel("board")).toBe("Board");
    expect(formatRoleLabel("org leader")).toBe("Org leader");
  });
});
