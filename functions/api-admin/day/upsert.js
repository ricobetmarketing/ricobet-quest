import { json, handleOptions, requireAdmin } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    requireAdmin(request, env);
    const d = await request.json().catch(() => ({}));

    const id = String(d.id || "").trim();
    const weekId = String(d.weekId || "").trim();
    const date = String(d.date || "").trim();
    const label = String(d.label || "").trim();
    const title = String(d.title || "").trim();
    const provider = String(d.provider || "").trim();
    const reward = String(d.reward || "").trim();
    const voucherCode = String(d.voucherCode || "").trim();
    const adminStatus = String(d.adminStatus || "auto").trim();
    const finalTag = String(d.finalTag || "").trim();
    const tnc = Array.isArray(d.tnc) ? d.tnc : [];

    if (!id || !weekId || !date || !title || !reward || !voucherCode) {
      throw new Error("Day requires id,weekId,date,title,reward,voucherCode");
    }

    const tncJson = JSON.stringify(tnc.map(x => String(x)));

    await env.DB.prepare(`
      INSERT INTO quest_days (
        id, week_id, date, label, title, provider, reward,
        voucher_code, tnc_json, admin_status, final_tag, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        week_id=excluded.week_id,
        date=excluded.date,
        label=excluded.label,
        title=excluded.title,
        provider=excluded.provider,
        reward=excluded.reward,
        voucher_code=excluded.voucher_code,
        tnc_json=excluded.tnc_json,
        admin_status=excluded.admin_status,
        final_tag=excluded.final_tag,
        updated_at=datetime('now')
    `).bind(
      id, weekId, date, label, title, provider, reward,
      voucherCode, tncJson, adminStatus, finalTag
    ).run();

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, e?.message === "Unauthorized" ? 401 : 500);
  }
}
