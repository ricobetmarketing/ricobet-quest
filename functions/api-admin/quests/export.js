import { json, handleOptions, requireAdmin } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const opt = handleOptions(request);
  if (opt) return opt;

  try {
    requireAdmin(request, env);

    const weeks = await env.DB.prepare(`
      SELECT id, name, start_date as startDate, end_date as endDate, description, created_at as createdAt, updated_at as updatedAt
      FROM quest_weeks
      ORDER BY start_date DESC
    `).all();

    const days = await env.DB.prepare(`
      SELECT
        id, week_id as weekId, date, label, title, provider, reward,
        voucher_code as voucherCode,
        tnc_json as tncJson,
        admin_status as adminStatus,
        final_tag as finalTag,
        created_at as createdAt, updated_at as updatedAt
      FROM quest_days
      ORDER BY date ASC
    `).all();

    const settings = await env.DB.prepare(`
      SELECT key, value FROM quest_settings
    `).all();

    return json({
      ok: true,
      weeks: weeks.results || [],
      days: (days.results || []).map(d => ({
        ...d,
        tnc: (() => { try { const a = JSON.parse(d.tncJson || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } })()
      })),
      settings: settings.results || []
    });
  } catch (e) {
    return json({ ok:false, error:String(e?.message||e) }, e?.message==="Unauthorized"?401:500);
  }
}
