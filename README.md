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
- `admin/`: the admin page at `/admin/` (see below). Standalone; the public
  pages never load it.
- `assets/`: images and fonts.
- `supabase/migrations/`: schema, row level security and triggers, in order.
- `supabase/functions/notify-inquiry/`: emails the vendor when an inquiry
  arrives (Resend).
- `supabase/functions/admin-vendor-login/`: creates or resets a vendor's
  login from the admin page.

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

## Plans and advertising

- **Plans** live in `vendor_plans` (names, TTD prices, features, inquiry
  limit). The dashboard, plan comparison, upgrade prompts, database rules and
  inquiry emails all read from it; change a plan there, not in code.
  - No-Cost Listing: up to 4 inquiries. The 5th and later are saved but held
    (contact details hidden) until the vendor upgrades; upgrading opens them.
  - Spotlight (TTD $175/month) and Spotlight+ (TTD $300/month): unlimited.
- **Upgrades** have no checkout: "Choose …" adds a row to
  `spotlight_requests` (status `pending`). After billing is arranged, set
  `vendors.tier` and mark the request `activated`.
- **Spotlight+ website advertising** uses `ad_placements`. Each row is one
  placement (`home`, `category`, `event`, `location` or `article`) with
  category/event/location targeting, status and optional dates. Pages only
  show placements whose targets match the page, labelled "Sponsored", with
  `rel="sponsored"` links and never in structured data. Placements stop
  showing automatically if the vendor leaves Spotlight+.
  To start a vendor: `select create_default_ad_placements('<vendor uuid>');`
  in the SQL editor, review the drafts, then set `status = 'active'`.
  Impressions and clicks are GA4 `view_promotion` / `select_promotion`
  events (`promotion_id` = placement id).

## Coming-soon mode

While `site_settings.coming_soon` is `true`, every public page serves
`coming-soon.html` (with a "Notify me" form that saves to `waitlist`).
Switch it from the admin Overview ("Launch: show the full site"). To see the
real site while it's on, visit any page with `?preview=on` (a cookie for
that browser; `?preview=off` clears it). `/admin/` always works.

## Admin

`/admin/` manages vendors (profile, photos, packages, plan, live/hidden,
logins), plan requests (Activate moves the vendor to the plan), Spotlight+
ad placements, Magazine posts, all inquiries, the launch waitlist and the
coming-soon switch. Sign in with an account
whose confirmed email is in `public.admins`; add another admin with
`insert into public.admins (email) values ('name@example.com');`.
Everything goes through the `admin_*` database functions, which check
`is_admin()`; no table permissions are widened. Saved changes reach the
public pages within about five minutes (page cache).

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
