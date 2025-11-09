// server/ihrClient.js
// Cached, de-duped, backoff’d HTTP getters for IHR endpoints.

import axios from "axios";

// ✅ Correct JSON API base (no "www", no "/ihr")
const IHR_BASE = process.env.IHR_BASE || "https://ihr.live/api";

/** Strip "AS" prefix → numeric string (e.g., "AS21928" -> "21928") */
const asnNumber = (asn) => String(asn || "").replace(/^AS/i, "");

/**
 * Generic cached fetcher
 * - Caches successful responses for ttlMs
 * - Coalesces concurrent calls
 * - Exponential backoff after failures (serves stale cache if available)
 * - Hard timeout via AbortController
 */
export function makeCachedFetcher({
  name = "fetcher",
  ttlMs = 60_000,
  timeoutMs = 5000,
  urlBuilder,
  axiosOpts = {},
}) {
  if (typeof urlBuilder !== "function")
    throw new Error(`[${name}] urlBuilder must be a function`);

  let cache = null; // { data, ts }
  let inFlight = null;
  let failures = 0;
  let nextAllowedAt = 0; // ms epoch for backoff gate

  async function fetchFresh(params = {}) {
    const now = Date.now();

    // Backoff gate: serve stale cache during cool-down if we have one
    if (now < nextAllowedAt) {
      return {
        ok: Boolean(cache?.data),
        data: cache?.data ?? null,
        stale: true,
        ts: cache?.ts ?? null,
        error: `backoff:${Math.ceil((nextAllowedAt - now) / 1000)}s`,
      };
    }

    if (inFlight) return inFlight; // coalesce concurrent calls

    inFlight = (async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const url = urlBuilder(params);
        const res = await axios.get(url, {
          signal: ctrl.signal,
          timeout: timeoutMs,
          headers: {
            "User-Agent": `IhrClient/${name}`,
            Accept: "application/json,text/html,*/*",
          },
          validateStatus: (s) => s >= 200 && s < 300,
          ...axiosOpts,
        });
        clearTimeout(timer);
        failures = 0;
        cache = { data: res.data, ts: Date.now() };
        return {
          ok: true,
          data: cache.data,
          stale: false,
          ts: cache.ts,
          error: null,
        };
      } catch (e) {
        clearTimeout(timer);
        failures += 1;
        // Exponential backoff up to 5 minutes
        const delay = Math.min(300_000, 2 ** Math.min(10, failures) * 1000);
        nextAllowedAt = Date.now() + delay;

        return {
          ok: Boolean(cache?.data),
          data: cache?.data ?? null,
          stale: true,
          ts: cache?.ts ?? null,
          error:
            e?.message ||
            (e?.code ? `axios:${e.code}` : "upstream_error_or_timeout"),
        };
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  }

  return async function get(params = {}) {
    const now = Date.now();
    const age = cache ? now - cache.ts : Infinity;
    if (cache?.data && age <= ttlMs) {
      return {
        ok: true,
        data: cache.data,
        stale: false,
        ts: cache.ts,
        error: null,
      };
    }
    return fetchFresh(params);
  };
}

/* ---------------------- Specific IHR endpoints ---------------------- */

/**
 * Recent network delay alarms (alerts)
 * Endpoint accepts AS-form (e.g., "AS21928") and time filter via ts__gte.
 * GET https://ihr.live/api/network_delay/alarms/?asn=AS21928&ts__gte=ISO
 */
export const getIhrAlerts = makeCachedFetcher({
  name: "ihrAlerts",
  ttlMs: 60_000,
  timeoutMs: 10_000,
  urlBuilder: ({ asn = "AS21928", minutes = 5 }) => {
    const sinceISO = new Date(
      Date.now() - Number(minutes) * 60_000
    ).toISOString();
    const url = new URL(`${IHR_BASE}/network_delay/alarms/`); // ✅ trailing slash
    url.searchParams.set("asn", String(asn));
    url.searchParams.set("ts__gte", sinceISO);
    return url.toString();
  },
});

/**
 * Network metadata / overall view (single ASN)
 * Use the numeric path for deterministic results.
 * GET https://ihr.live/api/networks/21928/
 */
export const getIhrNetwork = makeCachedFetcher({
  name: "ihrNetwork",
  ttlMs: 120_000,
  timeoutMs: 10_000,
  urlBuilder: ({ asn = "AS21928" }) => {
    const n = asnNumber(asn);
    return `${IHR_BASE}/networks/${n}/`; // ✅ trailing slash
  },
});

/**
 * Optional helper: fuzzy search networks by name (returns array)
 * Example: name__icontains=t-mobile&country=US
 */
export const searchIhrNetworks = makeCachedFetcher({
  name: "ihrSearchNetworks",
  ttlMs: 10 * 60_000,
  timeoutMs: 10_000,
  urlBuilder: ({ q = "t-mobile", country = "US" } = {}) => {
    const url = new URL(`${IHR_BASE}/networks/`); // ✅ trailing slash
    if (q) url.searchParams.set("name__icontains", q);
    if (country) url.searchParams.set("country", country);
    return url.toString();
  },
});

// For testing/debugging
export const __IHR_BASE = IHR_BASE;
export const __asnNumber = asnNumber;
