import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  AUTH_RETURN_TO_KEY,
  PRODUCTION_APP_ORIGIN,
  buildEventQrUrl,
  consumeAuthReturnTo,
  googleOAuthRedirectTo,
  rememberAuthReturnTo,
} from "./eventLinks";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
  Object.defineProperty(globalThis, "location", {
    value: {
      origin: "https://portal.tescatucsd.org",
      pathname: "/bulletin/42",
      search: "?from=qr&token=abc",
    },
    configurable: true,
  });
});

describe("buildEventQrUrl", () => {
  it("points phones at production instead of localhost", () => {
    const url = buildEventQrUrl("42", "abc");
    expect(url).toBe(`${PRODUCTION_APP_ORIGIN}/bulletin/42?from=qr&token=abc`);
    expect(url).not.toContain("localhost");
  });
});

describe("googleOAuthRedirectTo", () => {
  it("drops search params so QR tokens are not part of the allowlisted URL", () => {
    expect(googleOAuthRedirectTo()).toBe("https://portal.tescatucsd.org/bulletin/42");
  });
});

describe("auth return path", () => {
  afterEach(() => {
    globalThis.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  });

  it("stores and consumes the QR path for after Google returns", () => {
    rememberAuthReturnTo("/bulletin/42?from=qr&token=abc");
    expect(consumeAuthReturnTo()).toBe("/bulletin/42?from=qr&token=abc");
    expect(consumeAuthReturnTo()).toBeNull();
  });
});
