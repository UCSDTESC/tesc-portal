const UCSD_EMAIL = /@(?:[\w-]+\.)*ucsd\.edu$/i;

export function isAllowedMemberEmail(email: string) {
  return UCSD_EMAIL.test(email.trim());
}

export function formatAuthError(message?: string | null, recruiter = false) {
  const raw = (message ?? "").toLowerCase();

  if (
    raw.includes("email domain not allowed") ||
    raw.includes("database error saving new user")
  ) {
    return recruiter
      ? "This work email is not approved. Email contact@tescatucsd.org for access."
      : "Please use a UCSD email (@ucsd.edu) to create an account.";
  }

  if (raw.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  const trimmed = message?.trim();
  return trimmed || "Something went wrong. Please try again.";
}

export function consumeAuthCallbackError(): string | null {
  if (typeof globalThis === "undefined" || !("location" in globalThis)) return null;

  const url = new URL(globalThis.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const description =
    url.searchParams.get("error_description") ??
    hashParams.get("error_description") ??
    url.searchParams.get("error") ??
    hashParams.get("error");

  if (!description) return null;

  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  hashParams.delete("error");
  hashParams.delete("error_code");
  hashParams.delete("error_description");
  url.hash = hashParams.toString();
  globalThis.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);

  return decodeURIComponent(description.replace(/\+/g, " "));
}
