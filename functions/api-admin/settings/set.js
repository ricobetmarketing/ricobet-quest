import { json, handleOptions, requireAdmin } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    requireAdmin(request, env);
    const body = await request.json().catch(() => ({}));

    const key = String(body.key || "").trim();
    const value = String(body.value || "").trim();
    if (!key) return json({ ok: false, error: "Missing key" }, 400);

    await env.DB.prepare(`
      INSERT INTO quest_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `).bind(key, value).run();

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, e?.message === "Unauthorized" ? 401 : 500);
  }
}
