import { json, handleOptions, safeJsonArray } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== "GET") return json({ ok: false, error: "Method not allowed" }, 405);

  const gp = await env.DB.prepare(`SELECT value FROM quest_settings WHERE key='grandPrize'`).first();
  const grandPrize = gp?.value || "";

  const weeksRes = await env.DB.prepare(`
    SELECT id, name, start_date as startDate, end_date as endDate, description
    FROM quest_weeks
    ORDER BY start_date DESC
  `).all();

  const weeks = weeksRes.results || [];
  if (!weeks.length) return json([]);

  const weekIds = weeks.map(w => w.id);
  const placeholders = weekIds.map(() => "?").join(",");

  const daysRes = await env.DB.prepare(`
    SELECT
      id, week_id, date, label, title, provider, reward,
      voucher_code as voucherCode,
      tnc_json as tncJson,
      admin_status as adminStatus,
      final_tag as finalTag
    FROM quest_days
    WHERE week_id IN (${placeholders})
    ORDER BY date ASC
  `).bind(...weekIds).all();

  const days = daysRes.results || [];
  const byWeek = new Map();

  for (const d of days) {
    const tnc = safeJsonArray(d.tncJson);
    const item = {
      id: d.id,
      date: d.date,
      label: d.label,
      title: d.title,
      provider: d.provider,
      reward: d.reward,
      voucherCode: d.voucherCode,
      tnc,
      adminStatus: d.adminStatus || "auto",
      finalTag: d.finalTag || ""
    };
    if (!byWeek.has(d.week_id)) byWeek.set(d.week_id, []);
    byWeek.get(d.week_id).push(item);
  }

  return json(
    weeks.map(w => ({
      ...w,
      grandPrize,
      days: byWeek.get(w.id) || []
    }))
  );
}
