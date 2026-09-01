import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Lets the admin create a real login for a vendor whose profile they built
// on the vendor's behalf, without the admin's own browser session being
// swapped out for the new account (which is what a normal client-side
// signUp() call would do). Uses the temp password the admin sent, which
// she hands to the vendor herself (WhatsApp, in person, etc.) — the vendor
// can change it later from their dashboard whenever they actually sign in.

const ADMIN_EMAIL = "astral.ochoa@hotmail.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user || userData.user.email !== ADMIN_EMAIL) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: { vendorId?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const vendorId = body.vendorId;
  const email = (body.email || "").trim();
  const password = body.password || "";
  if (!vendorId || !email) {
    return new Response("Missing vendorId or email", { status: 400 });
  }
  if (password.length < 8) {
    return new Response("Password must be at least 8 characters", { status: 400 });
  }

  const { data: vendor, error: vendorError } = await adminClient
    .from("vendors")
    .select("id, owner_user_id")
    .eq("id", vendorId)
    .maybeSingle();
  if (vendorError) {
    return new Response(vendorError.message, { status: 400 });
  }
  if (!vendor) {
    return new Response("Vendor not found", { status: 404 });
  }
  if (vendor.owner_user_id) {
    return new Response("This vendor already has a login.", { status: 409 });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return new Response(createError?.message || "Could not create account", { status: 400 });
  }

  const { error: updateError } = await adminClient
    .from("vendors")
    .update({ owner_user_id: created.user.id, email })
    .eq("id", vendorId);
  if (updateError) {
    return new Response(updateError.message, { status: 400 });
  }

  return new Response(JSON.stringify({ userId: created.user.id }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
