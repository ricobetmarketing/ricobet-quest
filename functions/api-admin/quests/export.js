import { json, handleOptions, requireAdmin, safeJsonArray } from "../../../_utils.js";

export async function onRequest({ request, env }) {
  const opt = handleOptions(request);
  if (opt) return opt;

  try {
    requireAdmin(request, env);

    const weeksRes = await env.DB.prepare(`
      SELECT id, name, start_date as startDate, end_date as endDate, description
      FROM quest_weeks
      ORDER BY start_date DESC
    `).all();

    const daysRes = await env.DB.prepare(`
      SELECT
        id,
        week_id as weekId,
        date,
        label,
        title,
        provider,
        reward,
        voucher_code as voucherCode,
        tnc_json as tncJson,
        admin_status as adminStatus,
        final_tag as finalTag
      FROM quest_days
      ORDER BY date ASC
    `).all();

    const settingsRes = await env.DB.prepare(`
      SELECT key, value
      FROM quest_settings
    `).all();

    const days = (daysRes.results || []).map(d => ({
      id: d.id,
      weekId: d.weekId,
      date: d.date,
      label: d.label,
      title: d.title,
      provider: d.provider,
      reward: d.reward,
      voucherCode: d.voucherCode,
      adminStatus: d.adminStatus || "auto",
      finalTag: d.finalTag || "",
      tnc: safeJsonArray(d.tncJson)
    }));

    return json({
      ok: true,
      weeks: weeksRes.results || [],
      days,
      settings: settingsRes.results || []
    });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, e?.message === "Unauthorized" ? 401 : 500);
  }
}
