# Eventory

eventorytt.com: event vendor discovery for Trinidad & Tobago. Static site on
Vercel (no build step, see `vercel.json`), backed by the **Eventory v2**
Supabase project (`oiwjuvzsydhuhmetcuqk`).

## Layout

- `app.html`: the page template. Markup and styles come from the Eventory v2
  design export; the page logic is the inline `<script type="text/x-dc">` near
  the end. It is never served directly.
- `api/render.js`: every page URL is rewritten here (see `vercel.json`). It
  fills `app.html` with that page's title, description, canonical, robots,
  Open Graph/Twitter tags, JSON-LD and a crawlable HTML copy of the content,
  and embeds the public data so the app opens on the same screen.
- `api/sitemap.js`: `/sitemap.xml`, generated from live data.
- `js/seo-core.js`: the single source for URLs, page copy, related links,
  index/noindex rules and structured data. Used by both the server and the
  browser. Inventory thresholds for indexable landing pages are in `MIN`.
- `js/eventory-data.js`: every Supabase read and write the page makes
  (vendors, packages, blog, inquiries, sign-in/sign-up, saved vendors, inbox).
- `js/dc-runtime.js`, `js/eventory-ds.js`, `VendorTile2.dc.html`: design
  runtime and components from the export. Treat them as vendored; don't edit.
- `js/vendor/`: React and supabase-js, served locally.
- `assets/`: images and fonts.
- `supabase/migrations/`: schema, row level security and triggers, in order.
- `supabase/functions/notify-inquiry/`: emails the vendor when an inquiry
  arrives (Resend).

## URLs

| Page | URL | Indexed when |
| --- | --- | --- |
| Vendor profile | `/vendors/<slug>/` | profile has a description and packages or photos |
| Category | `/<category>/` e.g. `/photographers/` | ≥1 vendor |
| Event type | `/<event>-vendors/` e.g. `/wedding-vendors/` | ≥2 vendors |
| Event + category | `/<event>-<category>/` e.g. `/wedding-photographers/` | ≥3 vendors |
| Category + place | `/<category>/<place>/` e.g. `/photographers/san-fernando/` | ≥3 vendors and fewer than the whole category |
| Place | `/locations/<place>/` | ≥3 vendors and fewer than all vendors |
| Magazine | `/magazine/`, `/magazine/topics/<section>/`, `/magazine/<post>/` | section has ≥1 article |

Pages below the threshold still work for visitors but are `noindex` and left
out of the sitemap. Sign-in, account, inbox, join, plan, saved and inquiry
screens are always `noindex`. Search/filter query strings are `noindex` with
a canonical to the clean page.

## Run locally

`vercel dev` runs the site with the render function. A plain static server
(e.g. `npx serve .` then open `/app.html`) also works: the page loads its data
from Supabase in the browser.

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
