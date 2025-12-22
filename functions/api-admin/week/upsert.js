import { json, handleOptions, requireAdmin } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const opt = handleOptions(request);
  if (opt) return opt;
  if (request.method !== "POST") return json({ ok:false, error:"Method not allowed" }, 405);

  try {
    requireAdmin(request, env);
    const w = await request.json().catch(()=>({}));

    const id = String(w.id||"").trim();
    const name = String(w.name||"").trim();
    const startDate = String(w.startDate||"").trim();
    const endDate = String(w.endDate||"").trim();
    const description = String(w.description||"");

    if (!id || !name || !startDate || !endDate) throw new Error("Week requires id,name,startDate,endDate");

    await env.DB.prepare(`
      INSERT INTO quest_weeks (id, name, start_date, end_date, description, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        start_date=excluded.start_date,
        end_date=excluded.end_date,
        description=excluded.description,
        updated_at=datetime('now')
    `).bind(id, name, startDate, endDate, description).run();

    return json({ ok:true });
  } catch (e) {
    return json({ ok:false, error:String(e?.message||e) }, e?.message==="Unauthorized"?401:500);
  }
}
