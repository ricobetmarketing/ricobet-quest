import { json, handleOptions, sha256Hex } from "/_utils.js";
 
export async function onRequest({ request, env }) {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const body = await request.json().catch(() => ({}));
  const voucherCode = String(body.voucherCode || "").trim();
  const alias = String(body.alias || "").trim();

  if (!voucherCode) return json({ ok: false, error: "Missing voucherCode" }, 400);

  const id = crypto.randomUUID();
  const ua = request.headers.get("User-Agent") || "";
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ip_hash = await sha256Hex(ip);

  await env.DB.prepare(`
    INSERT INTO quest_optins (id, voucher_code, alias, ip_hash, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, voucherCode, alias, ip_hash, ua).run();

  return json({ ok: true });
}
