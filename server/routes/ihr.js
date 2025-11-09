// server/routes/ihr.js
import express from "express";
import { getIhrAlerts, getIhrNetwork } from "../ihrClient.js";

const router = express.Router();

/**
 * GET /api/ihr/alerts?asn=AS21928&minutes=5
 * 200 → ok:true, fresh or stale
 * 202 → warming (no cache yet + upstream failed)
 */
router.get("/ihr/alerts", async (req, res) => {
  const asn = String(req.query.asn || process.env.IHR_ASN || "AS21928");
  const minutes = Number(req.query.minutes || 5);

  try {
    const { ok, data, stale, ts, error } = await getIhrAlerts({ asn, minutes });

    if (!ok && !data) {
      return res.status(202).json({
        ok: false,
        data: null,
        stale: false,
        ts: null,
        error: error || "warming",
      });
    }

    return res.status(200).json({
      ok: true,
      data,
      stale: !!stale,
      ts,
      error: stale ? error || null : null,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      data: null,
      stale: false,
      ts: null,
      error: e?.message || "server_error",
    });
  }
});

/**
 * GET /api/ihr/network?asn=AS21928
 * 200 → ok:true, fresh or stale
 * 202 → warming (no cache yet + upstream failed)
 */
router.get("/ihr/network", async (req, res) => {
  const asn = String(req.query.asn || process.env.IHR_ASN || "AS21928");

  try {
    const { ok, data, stale, ts, error } = await getIhrNetwork({ asn });

    if (!ok && !data) {
      return res.status(202).json({
        ok: false,
        data: null,
        stale: false,
        ts: null,
        error: error || "warming",
      });
    }

    return res.status(200).json({
      ok: true,
      data,
      stale: !!stale,
      ts,
      error: stale ? error || null : null,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      data: null,
      stale: false,
      ts: null,
      error: e?.message || "server_error",
    });
  }
});

export default router;
