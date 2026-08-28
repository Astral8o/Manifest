import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Reuses the same project-wide secrets as send-inquiry-email — this is an
// internal Postgres-trigger-to-function call, not a separate integration,
// so it doesn't need its own webhook secret or Resend "from" address.
const WEBHOOK_SECRET = Deno.env.get("INQUIRY_WEBHOOK_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
const FROM_EMAIL = Deno.env.get("INQUIRY_FROM_EMAIL") || "Eventory <onboarding@resend.dev>";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>
  )[c]);
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}

Deno.serve(async (req: Request) => {
  if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!RESEND_API_KEY) {
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }
  if (!ADMIN_EMAIL) {
    return new Response("ADMIN_NOTIFICATION_EMAIL not configured", { status: 500 });
  }

  let vendor_id: string | undefined;
  try {
    ({ vendor_id } = await req.json());
  } catch {
    // fall through to the missing-id response below
  }
  if (!vendor_id) return new Response("Missing vendor_id", { status: 400 });

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id, name, email, city, category_code, submitted_at")
    .eq("id", vendor_id)
    .single();

  if (vendorError || !vendor) {
    return new Response(`Vendor not found: ${vendorError?.message}`, { status: 404 });
  }

  const html = `
    <h2>${escapeHtml(vendor.name)} submitted their profile for review</h2>
    <p>
      <strong>Email:</strong> ${escapeHtml(vendor.email || "—")}<br/>
      <strong>City:</strong> ${escapeHtml(vendor.city || "—")}<br/>
      <strong>Category:</strong> ${escapeHtml(vendor.category_code || "—")}
    </p>
    <p><a href="https://www.eventorytt.com/?admin=1">Review it in the admin dashboard →</a></p>
  `;

  try {
    await sendEmail(ADMIN_EMAIL, `[Eventory] ${vendor.name} submitted for review`, html);
    return new Response(JSON.stringify({ status: "sent" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ status: "error", message: (e as Error).message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
