export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
  }; 
}
 
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

export function handleOptions(request) {
  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders() });
  }
  return null;
}

export function isAdmin(request, env) {
  const key = request.headers.get("X-Admin-Key") || "";
  return key && env.ADMIN_KEY && key === env.ADMIN_KEY;
}

export function requireAdmin(request, env) {
  if (!isAdmin(request, env)) throw new Error("Unauthorized");
}

export function safeJsonArray(x) {
  try {
    const v = JSON.parse(x || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function sha256Hex(input) {
  if (!input) return "";
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
 
