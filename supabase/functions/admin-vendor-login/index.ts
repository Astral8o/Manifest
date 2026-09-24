import { createClient } from "jsr:@supabase/supabase-js@2";

// Called from /admin/ to give a vendor a login (or a new password) that the
// admin hands over directly. Creating the account here, with the service
// role, keeps the admin's own browser session signed in.
//   { action: "create", vendorId, email, password? }
//   { action: "reset",  vendorId, password? }
// Returns { email, password }. A password is generated when none is sent.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const service = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function tempPassword() {
  const words = "coral lime mango palm reef samba steel tassa tide wave".split(" ");
  const b = crypto.getRandomValues(new Uint32Array(3));
  return words[b[0] % words.length] + "-" + words[b[1] % words.length] + "-" + (1000 + (b[2] % 9000));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  // The caller must be a signed-in admin (checked by the database).
  const auth = req.headers.get("Authorization") || "";
  const caller = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: ok } = await caller.rpc("is_admin");
  if (ok !== true) return reply(403, { error: "Admins only" });

  let body: { action?: string; vendorId?: string; email?: string; password?: string };
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid JSON" }); }
  const password = body.password || tempPassword();
  if (password.length < 8) return reply(400, { error: "Password must be at least 8 characters" });

  const { data: vendor } = await service.from("vendors").select("id, owner_user_id").eq("id", body.vendorId || "").maybeSingle();
  if (!vendor) return reply(404, { error: "Vendor not found" });

  if (body.action === "reset") {
    if (!vendor.owner_user_id) return reply(400, { error: "This vendor has no login yet" });
    const { data, error } = await service.auth.admin.updateUserById(vendor.owner_user_id, { password, email_confirm: true });
    if (error) return reply(400, { error: error.message });
    return reply(200, { email: data.user.email, password });
  }

  if (body.action === "create") {
    const email = (body.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return reply(400, { error: "Enter a valid email" });
    if (vendor.owner_user_id) return reply(409, { error: "This vendor already has a login" });
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: "" } });
    if (error || !data.user) return reply(400, { error: /already/i.test(error?.message || "") ? "That email already has an Eventory account" : error?.message || "Could not create the login" });
    const { error: upd } = await service.from("vendors").update({ owner_user_id: data.user.id, email }).eq("id", vendor.id);
    if (upd) { await service.auth.admin.deleteUser(data.user.id); return reply(400, { error: upd.message }); }
    return reply(200, { email, password });
  }

  return reply(400, { error: "Unknown action" });
});
