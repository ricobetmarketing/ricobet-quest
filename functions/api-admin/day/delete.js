import { json, handleOptions, requireAdmin } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    requireAdmin(request, env);
    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "").trim();
    if (!id) return json({ ok: false, error: "Missing id" }, 400);

    await env.DB.prepare(`DELETE FROM quest_days WHERE id = ?`).bind(id).run();
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, e?.message === "Unauthorized" ? 401 : 500);
  }
}
