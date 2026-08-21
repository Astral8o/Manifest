import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

function renderDetails(inquiry: any, group: any, items: any[]) {
  const itemsHtml = items
    .map((it) => {
      const specs = Object.entries(it.spec_answers || {})
        .map(([k, v]) => `<li>${escapeHtml(k)}: ${escapeHtml(v)}</li>`)
        .join("");
      return `<li><strong>${escapeHtml(it.product_name)}</strong> &times; ${escapeHtml(it.qty)}${specs ? `<ul>${specs}</ul>` : ""}</li>`;
    })
    .join("");

  return `
    <p>
      <strong>Buyer:</strong> ${escapeHtml(inquiry.buyer_name || "—")}<br/>
      <strong>Email:</strong> ${escapeHtml(inquiry.buyer_email)}<br/>
      <strong>Phone:</strong> ${escapeHtml(inquiry.buyer_phone || "—")}
    </p>
    <p>
      <strong>Event date:</strong> ${escapeHtml(inquiry.event_date || "—")}${inquiry.event_time ? ` at ${escapeHtml(inquiry.event_time)}` : ""}<br/>
      <strong>Guests:</strong> ${escapeHtml(inquiry.guests_expected ?? "—")}<br/>
      <strong>Fulfilment:</strong> ${escapeHtml(inquiry.fulfilment || "—")}<br/>
      ${inquiry.venue_address ? `<strong>Venue:</strong> ${escapeHtml(inquiry.venue_address)}<br/>` : ""}
      ${inquiry.access_notes ? `<strong>Access notes:</strong> ${escapeHtml(inquiry.access_notes)}<br/>` : ""}
    </p>
    ${group.note_to_vendor ? `<p><strong>Note to vendor:</strong> ${escapeHtml(group.note_to_vendor)}</p>` : ""}
    <p><strong>Items requested:</strong></p>
    <ul>${itemsHtml}</ul>
  `;
}

Deno.serve(async (req: Request) => {
  if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!RESEND_API_KEY) {
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  let group_id: string | undefined;
  try {
    ({ group_id } = await req.json());
  } catch {
    // fall through to the missing-id response below
  }
  if (!group_id) return new Response("Missing group_id", { status: 400 });

  const { data: group, error: groupError } = await supabase
    .from("inquiry_vendor_groups")
    .select("*, inquiries(*), vendors(*), inquiry_items(*)")
    .eq("id", group_id)
    .single();

  if (groupError || !group) {
    return new Response(`Group not found: ${groupError?.message}`, { status: 404 });
  }

  const inquiry = group.inquiries;
  const vendor = group.vendors;
  const items = group.inquiry_items || [];
  const detailsHtml = renderDetails(inquiry, group, items);

  const results: Record<string, string> = {};

  try {
    await sendEmail(
      vendor.email,
      `New Eventory inquiry from ${inquiry.buyer_name || inquiry.buyer_email}`,
      `<h2>New inquiry via Eventory</h2><p>Vendor: ${escapeHtml(vendor.name)}</p>${detailsHtml}`
    );
    results.vendor = "sent";
    await supabase
      .from("inquiry_vendor_groups")
      .update({ vendor_email_sent_at: new Date().toISOString() })
      .eq("id", group_id);
  } catch (e) {
    results.vendor = `error: ${(e as Error).message}`;
  }

  if (ADMIN_EMAIL) {
    try {
      await sendEmail(
        ADMIN_EMAIL,
        `[Eventory] New inquiry for ${vendor.name}`,
        `<h2>New inquiry (admin copy)</h2><p>Vendor: ${escapeHtml(vendor.name)} (${escapeHtml(vendor.email)})</p>${detailsHtml}`
      );
      results.admin = "sent";
      await supabase
        .from("inquiry_vendor_groups")
        .update({ admin_email_sent_at: new Date().toISOString() })
        .eq("id", group_id);
    } catch (e) {
      results.admin = `error: ${(e as Error).message}`;
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
