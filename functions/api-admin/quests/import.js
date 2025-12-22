import { json, handleOptions, requireAdmin } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    requireAdmin(request, env);
    const body = await request.json().catch(() => ({}));

    const weeks = Array.isArray(body.weeks) ? body.weeks : [];
    const days = Array.isArray(body.days) ? body.days : [];
    const settings = Array.isArray(body.settings) ? body.settings : [];

    // Replace everything (simple + safe)
    const db = env.DB;

    await db.prepare(`DELETE FROM quest_days`).run();
    await db.prepare(`DELETE FROM quest_weeks`).run();
    await db.prepare(`DELETE FROM quest_settings`).run();

    for (const s of settings) {
      const key = String(s.key || "").trim();
      const value = String(s.value || "").trim();
      if (!key) continue;

      await db.prepare(`
        INSERT INTO quest_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value=excluded.value
      `).bind(key, value).run();
    }

    for (const w of weeks) {
      const id = String(w.id || "").trim();
      const name = String(w.name || "").trim();
      const startDate = String(w.startDate || "").trim();
      const endDate = String(w.endDate || "").trim();
      const description = String(w.description || "");

      if (!id || !name || !startDate || !endDate) continue;

      await db.prepare(`
        INSERT INTO quest_weeks (id, name, start_date, end_date, description, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          start_date=excluded.start_date,
          end_date=excluded.end_date,
          description=excluded.description,
          updated_at=datetime('now')
      `).bind(id, name, startDate, endDate, description).run();
    }

    for (const d of days) {
      const id = String(d.id || "").trim();
      const weekId = String(d.weekId || d.week_id || "").trim();
      const date = String(d.date || "").trim();
      const label = String(d.label || "").trim();
      const title = String(d.title || "").trim();
      const provider = String(d.provider || "").trim();
      const reward = String(d.reward || "").trim();
      const voucherCode = String(d.voucherCode || d.voucher_code || "").trim();
      const adminStatus = String(d.adminStatus || "auto").trim();
      const finalTag = String(d.finalTag || "").trim();

      const tncArr = Array.isArray(d.tnc) ? d.tnc : [];
      const tnc_json = JSON.stringify(tncArr.map(x => String(x)));

      if (!id || !weekId || !date || !title || !reward || !voucherCode) continue;

      await db.prepare(`
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
        voucherCode, tnc_json, adminStatus, finalTag
      ).run();
    }

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, e?.message === "Unauthorized" ? 401 : 500);
  }
}
