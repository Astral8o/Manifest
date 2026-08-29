import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Reuses the same project-wide secrets as send-inquiry-email — this is an
// internal Postgres-trigger-to-function call, not a separate integration,
// so it doesn't need its own webhook secret or Resend "from" address.
const WEBHOOK_SECRET = Deno.env.get("INQUIRY_WEBHOOK_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
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

  let request_id: string | undefined;
  try {
    ({ request_id } = await req.json());
  } catch {
    // fall through to the missing-id response below
  }
  if (!request_id) return new Response("Missing request_id", { status: 400 });

  const { data: quote, error: quoteError } = await supabase
    .from("quote_requests")
    .select(
      "id, event_type, event_type_other, event_date, venue, category_answers, contact_name, contact_email, contact_phone, vendors(id, name, email)"
    )
    .eq("id", request_id)
    .single();

  if (quoteError || !quote) {
    return new Response(`Quote request not found: ${quoteError?.message}`, { status: 404 });
  }

  const vendor = (quote as { vendors: { id: string; name: string; email: string | null } | null }).vendors;
  if (!vendor?.email) {
    return new Response("Vendor has no email on file", { status: 200 });
  }

  const eventType = quote.event_type_other || quote.event_type || "—";
  const answers = (quote.category_answers || {}) as Record<string, string>;
  const answersHtml = Object.values(answers).filter(Boolean).length
    ? `<ul>${Object.entries(answers)
        .filter(([, v]) => v)
        .map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</li>`)
        .join("")}</ul>`
    : "";

  const html = `
    <h2>New quote request for ${escapeHtml(vendor.name)}</h2>
    <p>
      <strong>Event type:</strong> ${escapeHtml(eventType)}<br/>
      <strong>Event date:</strong> ${escapeHtml(quote.event_date || "—")}<br/>
      <strong>Venue:</strong> ${escapeHtml(quote.venue || "—")}
    </p>
    ${answersHtml}
    <p>
      <strong>From:</strong> ${escapeHtml(quote.contact_name)}<br/>
      <strong>Email:</strong> ${escapeHtml(quote.contact_email)}<br/>
      <strong>Phone:</strong> ${escapeHtml(quote.contact_phone || "—")}
    </p>
    <p><a href="https://www.eventorytt.com/?vendor=${encodeURIComponent(vendor.id)}">View it in your Eventory dashboard →</a></p>
  `;

  try {
    await sendEmail(vendor.email, `[Eventory] New quote request from ${quote.contact_name}`, html);
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
