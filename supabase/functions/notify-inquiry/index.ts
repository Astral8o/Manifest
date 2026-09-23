import { createClient } from "jsr:@supabase/supabase-js@2";

// Called by the inquiries_after_insert trigger with { inquiry_id }.
// No JWT: it only ever emails a real inquiry that hasn't been emailed yet,
// so a forged call can't send anything new.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
const FROM_EMAIL = Deno.env.get("INQUIRY_FROM_EMAIL") || "Eventory <onboarding@resend.dev>";
const SITE = "https://www.eventorytt.com";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]);

async function send(to: string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  let id: string | undefined;
  try { ({ inquiry_id: id } = await req.json()); } catch { /* handled below */ }
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return new Response("Missing inquiry_id", { status: 400 });
  if (!RESEND_API_KEY) return new Response("RESEND_API_KEY not configured", { status: 200 });

  // Claim the row first so concurrent calls can't double-send.
  const { data: q } = await sb.from("inquiries")
    .update({ emailed_at: new Date().toISOString() })
    .eq("id", id).is("emailed_at", null)
    .select("*, vendors(name, email, tier)").maybeSingle();
  if (!q) return new Response("Nothing to send", { status: 200 });

  const v = q.vendors as { name: string; email: string; tier: string };
  const held = q.held && v.tier === "basic";
  const event = q.event_type === "other" && q.event_other ? q.event_other : q.event_type;
  const details = held
    ? `<p>You have a new inquiry waiting in your Eventory inbox. Your basic profile has reached its inquiry limit, so upgrade to Spotlight to open it.</p>`
    : `<p><strong>${esc(q.name)}</strong> sent an inquiry.</p>
       <p>Event: ${esc(event || "—")}<br/>Date: ${esc(q.event_date || "Not set")}<br/>Guests: ${esc(q.guests || "—")}<br/>
       Location: ${esc(q.location || "—")}<br/>Package: ${esc(q.package_name || "Not sure yet")}<br/>Budget: ${esc(q.budget || "—")}</p>
       <p>${esc(q.message || "No message added.")}</p>
       <p>Reply to ${esc(q.email)}${q.phone ? ` or ${esc(q.phone)} (${esc(q.contact_pref)})` : ""}.</p>`;
  const html = `${details}<p><a href="${SITE}">Open your Eventory inbox</a></p>`;

  try {
    if (v.email) await send([v.email], held ? "New inquiry waiting on Eventory" : `New inquiry from ${q.name}`, html);
    if (ADMIN_EMAIL) await send([ADMIN_EMAIL], `[Eventory] Inquiry to ${v.name}`, `<p>Vendor: ${esc(v.name)}${held ? " (held)" : ""}</p>${details}`);
  } catch (e) {
    // Release the claim so a retry can send it.
    await sb.from("inquiries").update({ emailed_at: null }).eq("id", id);
    return new Response(String(e), { status: 502 });
  }
  return new Response("Sent", { status: 200 });
});
