import { json, handleOptions, requireAdmin } from "../_utils.js";

export async function onRequest({ request, env }) {
  const opt = handleOptions(request);
  if (opt) return opt;

  try {
    requireAdmin(request, env);

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500);

    const res = await env.DB.prepare(`
      SELECT created_at, voucher_code, alias
      FROM quest_optins
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return json({ ok: true, rows: res.results || [] });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, e?.message === "Unauthorized" ? 401 : 500);
  }
}
