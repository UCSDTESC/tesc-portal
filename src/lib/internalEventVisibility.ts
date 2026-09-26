export function toOrgIdKey(orgId: string | number | null | undefined): string | null {
  if (orgId == null || orgId === "") return null;
  return String(orgId);
}

export function canViewInternalEvent(
  event: { type?: string; org_id?: string | number | null },
  options: {
    isSuperOrg?: boolean;
    userOrgIds?: Array<string | number>;
    userId?: string;
  },
): boolean {
  if (event.type !== "internal") return true;
  if (options.isSuperOrg) return true;
  if (!options.userId) return false;
  const eventOrgId = toOrgIdKey(event.org_id);
  if (!eventOrgId) return false;
  const orgIdSet = new Set((options.userOrgIds ?? []).map(toOrgIdKey).filter(Boolean));
  return orgIdSet.has(eventOrgId);
}

export function filterEventsForInternalVisibility<
  T extends { type?: string; org_id?: string | number | null },
>(
  events: T[],
  options: {
    isSuperOrg?: boolean;
    userOrgIds?: Array<string | number>;
    userId?: string;
  },
): T[] {
  if (options.isSuperOrg) return events;
  return events.filter((event) => canViewInternalEvent(event, options));
}
