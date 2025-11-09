// src/components/IHRStatusCard.jsx
import React, { useEffect, useState, useMemo } from "react";

export default function IHRStatusCard({ asn = "AS21928", minutes = 5 }) {
  const [ihr, setIhr] = useState({
    loading: true,
    data: null,
    stale: false,
    error: null,
  });

  const loadIhr = async () => {
    try {
      const res = await fetch(
        `/api/ihr/alerts?asn=${encodeURIComponent(
          asn
        )}&minutes=${encodeURIComponent(minutes)}`
      );
      const body = await res.json();
      if (res.status === 202) {
        setIhr({
          loading: true,
          data: body.data ?? null,
          stale: true,
          error: body.error ?? null,
        });
      } else if (res.ok) {
        setIhr({
          loading: false,
          data: body.data ?? null,
          stale: !!body.stale,
          error: null,
        });
      } else {
        setIhr({
          loading: false,
          data: null,
          stale: false,
          error: `HTTP ${res.status}`,
        });
      }
    } catch (e) {
      setIhr({
        loading: false,
        data: null,
        stale: false,
        error: e?.message || "Network error",
      });
    }
  };

  useEffect(() => {
    loadIhr();
    // no polling — only once on mount
  }, [asn, minutes]);

  const lastUpdated = useMemo(() => {
    if (!ihr?.data?.ts && !ihr?.ts) return null;
    const ts = ihr?.data?.ts || ihr.ts;
    try {
      const d = new Date(ts);
      if (Number.isNaN(+d)) return null;
      return d.toLocaleString();
    } catch {
      return null;
    }
  }, [ihr]);

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{
        background: "rgba(255,255,255,0.75)",
        borderColor: "rgba(255,255,255,0.3)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-slate-900 font-semibold">
            IHR Overall Status ({minutes}m)
          </div>
          <div className="text-xs text-slate-600">
            ASN: <code>{asn}</code>
          </div>
        </div>
        <button
          onClick={loadIhr}
          className="text-sm px-3 py-1.5 rounded-xl text-white"
          style={{
            background: "#E20074",
            boxShadow: "0 6px 18px rgba(226,0,116,0.28)",
          }}
        >
          Refresh
        </button>
      </div>

      {/* States */}
      {ihr.loading ? (
        <div className="text-sm text-slate-600">
          {ihr.stale
            ? "Showing cached data… refreshing in background…"
            : "Warming cache…"}
        </div>
      ) : ihr.error ? (
        <div className="text-sm text-rose-600">
          IHR unavailable{": "}
          {ihr.error}
        </div>
      ) : null}

      {/* Content */}
      {ihr.data ? (
        <div className="space-y-2">
          {/* Try a few common fields if present */}
          <div className="text-sm">
            <span className="text-slate-600">Status: </span>
            <span className="font-medium text-slate-900">
              {ihr.data.status ?? "OK"}
            </span>
            {ihr.stale && (
              <span className="ml-2 inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                stale
              </span>
            )}
          </div>

          {/* If upstream returns metrics/details, show them compactly */}
          <pre
            className="text-xs p-2 rounded-lg overflow-auto"
            style={{
              background: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {JSON.stringify(ihr.data, null, 2)}
          </pre>

          {lastUpdated && (
            <div className="text-xs text-slate-500">
              Last updated: {lastUpdated}
            </div>
          )}
        </div>
      ) : (
        !ihr.loading &&
        !ihr.error && (
          <div className="text-sm text-slate-600">
            No data yet. Try “Refresh” in a moment.
          </div>
        )
      )}
    </div>
  );
}
