import { describe, expect, it, vi } from "vitest";
import {
  countryForTimeZone,
  currencyForCountry,
  detectCountry,
  offlineCurrencyGuess,
  parseTraceCountry,
} from "./geo";

const TRACE = (loc: string) =>
  `fl=123abc\nh=numflo.com\nip=203.0.113.9\nts=1790000000.1\nvisit_scheme=https\nuag=Mozilla\ncolo=BOM\nloc=${loc}\ntls=TLSv1.3\n`;

describe("currencyForCountry (issue #3)", () => {
  it.each([
    ["GB", "GBP"],
    ["US", "USD"],
    ["IN", "INR"],
    ["MX", "MXN"],
    ["DE", "EUR"],
    ["es", "EUR"],
  ])("%s -> %s", (c, cur) => expect(currencyForCountry(c)).toBe(cur));

  it("unmapped countries return null so the caller falls back to USD", () => {
    expect(currencyForCountry("JP")).toBeNull();
    expect(currencyForCountry("AR")).toBeNull();
    expect(currencyForCountry("")).toBeNull();
    expect(currencyForCountry(undefined)).toBeNull();
  });
});

describe("parseTraceCountry", () => {
  it("reads the loc line", () => {
    expect(parseTraceCountry(TRACE("IN"))).toBe("IN");
    expect(parseTraceCountry(TRACE("GB"))).toBe("GB");
  });
  it("rejects unknown, Tor, malformed and hostile values", () => {
    expect(parseTraceCountry(TRACE("XX"))).toBeNull();
    expect(parseTraceCountry(TRACE("T1"))).toBeNull();
    expect(parseTraceCountry(TRACE("<script>"))).toBeNull();
    expect(parseTraceCountry(TRACE("gb"))).toBeNull();
    expect(parseTraceCountry("no location here")).toBeNull();
    expect(parseTraceCountry("<html>error page</html>")).toBeNull();
    expect(parseTraceCountry("x".repeat(5000))).toBeNull();
    expect(parseTraceCountry(null)).toBeNull();
  });
});

describe("time zone fallback", () => {
  it.each([
    ["Asia/Kolkata", "IN"],
    ["Asia/Calcutta", "IN"],
    ["Europe/London", "GB"],
    ["America/New_York", "US"],
    ["America/Los_Angeles", "US"],
    ["America/Indiana/Indianapolis", "US"],
    ["America/Mexico_City", "MX"],
    ["Europe/Madrid", "ES"],
  ])("%s -> %s", (tz, c) => expect(countryForTimeZone(tz)).toBe(c));

  it("unknown or ambiguous zones return null", () => {
    expect(countryForTimeZone("Asia/Tokyo")).toBeNull();
    expect(countryForTimeZone("America/Toronto")).toBeNull();
    expect(countryForTimeZone("UTC")).toBeNull();
    expect(countryForTimeZone(undefined)).toBeNull();
  });

  it("offline guess: time zone first, then browser region, then USD", () => {
    expect(offlineCurrencyGuess("Asia/Kolkata", ["en-US"])).toBe("INR");
    expect(offlineCurrencyGuess("Asia/Tokyo", ["en-GB"])).toBe("GBP");
    expect(offlineCurrencyGuess("Asia/Tokyo", ["ja-JP"])).toBe("USD");
    expect(offlineCurrencyGuess(undefined, [])).toBe("USD");
  });
});

describe("detectCountry", () => {
  const ok = (body: string, status = 200) =>
    vi.fn(async () => new Response(body, { status })) as unknown as typeof fetch;

  it("returns the country from the trace endpoint", async () => {
    const f = ok(TRACE("GB"));
    expect(await detectCountry(f)).toBe("GB");
    expect(f).toHaveBeenCalledWith("/cdn-cgi/trace", expect.objectContaining({ credentials: "omit" }));
  });
  it("returns null on HTTP errors", async () => {
    expect(await detectCountry(ok("Not found", 404))).toBeNull();
  });
  it("returns null when the request fails", async () => {
    const f = vi.fn(async () => {
      throw new TypeError("network");
    }) as unknown as typeof fetch;
    expect(await detectCountry(f)).toBeNull();
  });
  it("gives up after the timeout", async () => {
    const f = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))),
        ),
    ) as unknown as typeof fetch;
    expect(await detectCountry(f, 20)).toBeNull();
  });
});
