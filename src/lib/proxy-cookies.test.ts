import { describe, expect, test } from "bun:test";
import { parseCookies, SAVE_FILENAME, unexpiredCookies } from "./proxy-cookies";

const cookie = { id: ".example.com@/@session", domain: ".example.com", path: "/", name: "session", value: "test-only", set: "2026-11-06T00:00:00.000Z", httpOnly: true, secure: true };

describe("portable proxy cookies", () => {
  test("save is JSON with the requested .intonixsave extension", () => {
    expect(SAVE_FILENAME).toBe("intonix-save.intonixsave");
    expect(parseCookies(JSON.parse(JSON.stringify([cookie])))[0]?.value).toBe("test-only");
  });
  test("cookie dates and flags survive JSON roundtrip", () => {
    const restored = parseCookies([cookie])[0];
    expect(restored?.set).toEqual(new Date(cookie.set));
    expect(restored?.httpOnly).toBe(true);
    expect(restored?.secure).toBe(true);
  });
  test("expired cookies are not restored and session cookies are retained", () => {
    const cookies = parseCookies([cookie, { ...cookie, maxAge: 0 }, { ...cookie, expires: "2026-11-05T00:00:00Z" }]);
    expect(unexpiredCookies(cookies, Date.parse("2026-11-06T01:20:00Z"))).toEqual([cookies[0]]);
  });
  test("malformed cookies are rejected before writing", () => {
    expect(() => parseCookies([{ ...cookie, set: "invalid" }])).toThrow();
    expect(() => parseCookies([{ ...cookie, id: "wrong" }])).toThrow();
  });
});