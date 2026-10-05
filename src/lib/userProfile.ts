export type MemberProfileFields = {
  first_name?: string | null;
  last_name?: string | null;
  major?: string | null;
  expected_grad?: string | number | null;
};

let skippedProfileSetupUserId: string | null = null;

export function isMemberProfileIncomplete(
  profile: MemberProfileFields | null | undefined,
): boolean {
  if (!profile) return true;
  if (!String(profile.first_name ?? "").trim()) return true;
  if (!String(profile.last_name ?? "").trim()) return true;
  if (!String(profile.major ?? "").trim()) return true;
  if (profile.expected_grad == null || String(profile.expected_grad).trim() === "") return true;
  return false;
}

export function skipMemberProfileSetupPrompt(userId: string) {
  skippedProfileSetupUserId = userId;
}

export function shouldSkipMemberProfileSetupPrompt(userId: string) {
  return Boolean(userId) && skippedProfileSetupUserId === userId;
}

export function clearMemberProfileSetupSkip() {
  skippedProfileSetupUserId = null;
}
