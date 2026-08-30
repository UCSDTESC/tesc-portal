const APP_ORIGIN =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_URL
    ? String(import.meta.env.VITE_APP_URL).replace(/\/$/, "")
    : typeof globalThis !== "undefined" && "location" in globalThis
      ? globalThis.location.origin
      : "";

export function buildEventQrUrl(eventId: string, token: string): string {
  const params = new URLSearchParams({ from: "qr", token });
  return `${APP_ORIGIN}/bulletin/${eventId}?${params.toString()}`;
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
