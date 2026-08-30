export const ORG_LEADER_ASSIGNABLE_ROLES = ["member", "board", "org leader"] as const;

export type OrgLeaderAssignableRole = (typeof ORG_LEADER_ASSIGNABLE_ROLES)[number];

export function normalizeRoleName(name: string | undefined | null): string {
  return (name ?? "").trim().toLowerCase();
}

export function resolveUserRoleFromNames(roleNames: string[]): string {
  if (!roleNames.length) return "member";
  const names = roleNames.map((name) => normalizeRoleName(name));
  if (names.includes("company")) return "company";
  if (names.includes("super_user")) return "super_user";
  if (names.includes("org leader")) return "org leader";
  if (names.includes("board")) return "board";
  if (names.includes("internal")) return "board";
  return roleNames[0]?.trim() ?? "member";
}

export function canManageOrgProfile(role: string | undefined): boolean {
  const normalized = normalizeRoleName(role);
  return normalized === "board" || normalized === "org leader" || normalized === "super_user";
}

export function canManageUsers(activeOrgName: string, activeOrgRole: string | undefined): boolean {
  return activeOrgName === "super_org" && normalizeRoleName(activeOrgRole) === "super_user";
}

export function canManageOrgMembers(activeOrgName: string, activeOrgRole: string | undefined): boolean {
  return activeOrgName !== "super_org" && normalizeRoleName(activeOrgRole) === "org leader";
}

export function isOrgLeaderAssignableRole(roleName: string): boolean {
  return ORG_LEADER_ASSIGNABLE_ROLES.includes(
    normalizeRoleName(roleName) as OrgLeaderAssignableRole,
  );
}

export function formatRoleLabel(roleName: string): string {
  const normalized = normalizeRoleName(roleName);
  if (normalized === "org leader") return "Org leader";
  if (normalized === "super_user") return "Super user";
  if (!normalized) return "Member";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
