export const PRODUCTION_APP_ORIGIN = "https://portal.tescatucsd.org";
export const AUTH_RETURN_TO_KEY = "tesc_auth_return_to";

function isLocalOrigin(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function publicAppOrigin(): string {
  const envUrl =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_URL
      ? String(import.meta.env.VITE_APP_URL).replace(/\/$/, "")
      : "";
  if (envUrl && !isLocalOrigin(envUrl)) return envUrl;

  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    const origin = globalThis.location.origin;
    if (origin && !isLocalOrigin(origin)) return origin;
  }

  return PRODUCTION_APP_ORIGIN;
}

export function buildEventQrUrl(eventId: string, token: string): string {
  const params = new URLSearchParams({ from: "qr", token });
  return `${publicAppOrigin()}/bulletin/${eventId}?${params.toString()}`;
}

export function parseQrSearchParams(search: string): { fromQr: boolean; token: string | null } {
  const params = new URLSearchParams(search);
  return {
    fromQr: params.get("from") === "qr",
    token: params.get("token"),
  };
}

export function qrFlowSessionKey(eventId: string): string {
  return `tesc_qr_completed_${eventId}`;
}

export function googleOAuthRedirectTo(): string | undefined {
  if (typeof globalThis === "undefined" || !("location" in globalThis)) return undefined;
  // Query strings such as ?from=qr&token= are not reliably allowlisted.
  // When they fail, Auth falls back to Site URL (often localhost).
  return `${globalThis.location.origin}${globalThis.location.pathname}`;
}

export function rememberAuthReturnTo(pathWithSearch?: string) {
  const storage = globalThis.sessionStorage;
  if (!storage) return;
  const value =
    pathWithSearch ?? `${globalThis.location.pathname}${globalThis.location.search}`;
  storage.setItem(AUTH_RETURN_TO_KEY, value);
}

export function consumeAuthReturnTo(): string | null {
  const storage = globalThis.sessionStorage;
  if (!storage) return null;
  const value = storage.getItem(AUTH_RETURN_TO_KEY);
  if (value) storage.removeItem(AUTH_RETURN_TO_KEY);
  return value;
}
