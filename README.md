# Eventory

eventorytt.com: event vendor discovery for Trinidad & Tobago. Static site on
Vercel (no build step, see `vercel.json`), backed by the **Eventory v2**
Supabase project (`oiwjuvzsydhuhmetcuqk`).

## Layout

- `index.html`: the page. Markup and styles come from the Eventory v2 design
  export; the page logic is the inline `<script type="text/x-dc">` near the end.
- `js/eventory-data.js`: every Supabase read and write the page makes
  (vendors, packages, blog, inquiries, sign-in/sign-up, saved vendors, inbox).
- `js/dc-runtime.js`, `js/eventory-ds.js`, `VendorTile2.dc.html`: design
  runtime and components from the export. Treat them as vendored; don't edit.
- `js/vendor/`: React and supabase-js, served locally.
- `assets/`: images and fonts.
- `supabase/migrations/`: schema, row level security and triggers, in order.
- `supabase/functions/notify-inquiry/`: emails the vendor when an inquiry
  arrives (Resend).

## Run locally

Any static server works, e.g. `npx serve .` then open http://localhost:3000.

## Supabase settings that live outside this repo

- **Edge function secrets** (Project Settings → Edge Functions):
  `RESEND_API_KEY` (required for inquiry emails), optionally
  `ADMIN_NOTIFICATION_EMAIL` and `INQUIRY_FROM_EMAIL`.
- **Auth → SMTP**: set a custom SMTP provider (e.g. Resend) so sign-up
  confirmation emails reach real users. Supabase's built-in sender only
  delivers to the project's team members.
- **Auth → URL configuration**: Site URL `https://www.eventorytt.com`.
- **Auth → Providers → Google**: needed for "Continue with Google".
- Vendor plans: "Choose Spotlight" records a row in `spotlight_requests`;
  change `vendors.tier` in the dashboard once the vendor has paid.
