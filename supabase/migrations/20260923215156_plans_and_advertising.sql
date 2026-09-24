-- Vendor plans, the 4-inquiry limit, and the Spotlight+ advertising foundation.

-- Plans: the single source for plan names, prices, what each includes and
-- the inquiry limit. The dashboard, comparison and database rules all read it.
create table public.vendor_plans (
  id text primary key,
  name text not null,
  tagline text not null,
  price_ttd int,                 -- null = no cost
  billing_period text,           -- 'month' for paid plans
  inquiry_limit int,             -- null = unlimited
  includes_label text,           -- e.g. 'Everything in Spotlight, plus:'
  features text[] not null,
  sort_order int not null
);
alter table public.vendor_plans enable row level security;
create policy "plans are public" on public.vendor_plans for select using (true);

insert into public.vendor_plans values
  ('basic', 'No-Cost Listing', 'Get listed on Eventory at no cost.', null, null, 4, null,
   array['Public vendor profile', 'Discovery through Eventory', 'Up to 4 inquiries'], 0),
  ('spotlight', 'Spotlight', 'Get more visibility. Get unlimited inquiries.', 175, 'month', null, null,
   array['Unlimited inquiries', 'Email marketing', 'Featured placement on Eventory', 'Social media features: Eventory features your business on its channels', 'Eventory Magazine features'], 1),
  ('spotlight_plus', 'Spotlight+', 'Go beyond visibility. Advertise with Eventory.', 300, 'month', null, 'Everything in Spotlight, plus:',
   array['Eventory website advertising on relevant pages', 'Social media advertising: promotional posts, reels and campaigns', 'Sponsored placements in relevant Eventory Magazine content'], 2);

-- "top" was the old internal name for Spotlight+.
alter table public.vendors drop constraint vendors_tier_check;
alter table public.spotlight_requests drop constraint spotlight_requests_tier_check;
update public.vendors set tier = 'spotlight_plus' where tier = 'top';
update public.spotlight_requests set tier = 'spotlight_plus' where tier = 'top';
alter table public.vendors add constraint vendors_tier_fkey foreign key (tier) references public.vendor_plans(id);
alter table public.spotlight_requests add constraint spotlight_requests_tier_fkey foreign key (tier) references public.vendor_plans(id);

-- Plan-change requests are handled by the Eventory team (no checkout).
alter table public.spotlight_requests
  add column status text not null default 'pending' check (status in ('pending', 'contacted', 'activated', 'declined'));

-- Inquiry limit comes from the vendor's plan: on the no-cost listing the
-- first 4 inquiries open normally, later ones are saved and held until the
-- vendor upgrades. Paid plans have no limit.
create or replace function public.inquiry_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_limit int; v_found boolean; v_count int;
begin
  select true, p.inquiry_limit into v_found, v_limit
  from public.vendors v join public.vendor_plans p on p.id = v.tier
  where v.id = new.vendor_id and v.published;
  if v_found is null then raise exception 'vendor not found'; end if;
  select count(*) into v_count from public.inquiries where vendor_id = new.vendor_id;
  new.held := v_limit is not null and v_count >= v_limit;
  new.status := 'new';
  new.emailed_at := null;
  new.created_at := now();
  return new;
end $$;

-- A held inquiry stays locked only while the vendor's plan has a limit, so
-- upgrading opens everything that was waiting.
create or replace function public.vendor_inbox()
returns table (id uuid, event_type text, event_other text, event_date date, guests text, location text,
  package_name text, budget text, message text, name text, email text, phone text, contact_pref text,
  status text, held boolean, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select i.id, i.event_type, i.event_other, i.event_date, i.guests, i.location,
    case when h then '' else i.package_name end, case when h then '' else i.budget end,
    case when h then '' else i.message end, case when h then '' else i.name end,
    case when h then '' else i.email end, case when h then '' else i.phone end,
    i.contact_pref, i.status, h, i.created_at
  from public.inquiries i
  join public.vendors v on v.id = i.vendor_id
  join public.vendor_plans p on p.id = v.tier
  cross join lateral (select i.held and p.inquiry_limit is not null as h) x
  where v.owner_user_id = (select auth.uid())
  order by i.created_at desc
$$;

create or replace function public.set_inquiry_status(p_id uuid, p_status text) returns void
language sql security definer set search_path = '' as $$
  update public.inquiries i set status = p_status
  from public.vendors v join public.vendor_plans p on p.id = v.tier
  where i.id = p_id and v.id = i.vendor_id and v.owner_user_id = (select auth.uid())
    and p_status in ('new','replied') and not (i.held and p.inquiry_limit is not null)
$$;

-- Spotlight+ website advertising ----------------------------------------
-- One row per promotional placement. Eventory's team creates and activates
-- placements; only Spotlight+ vendors are eligible, so a placement stops
-- showing automatically if the vendor changes plan. Targeting keeps ads
-- contextual: a placement shows only on pages matching its type and targets.
-- Impressions/clicks are measured in GA4 (view_promotion / select_promotion,
-- promotion_id = placement id); a stats table can be added later.
create table public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  placement_type text not null check (placement_type in ('home', 'category', 'event', 'location', 'article')),
  category_ids text[] not null default '{}',     -- category pages / articles to target
  event_type_ids text[] not null default '{}',   -- event-type pages / articles to target
  location_slugs text[] not null default '{}',   -- location pages to target (town or island slug)
  headline text not null default '',             -- optional promotional line
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'ended')),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ad_placements_vendor_idx on public.ad_placements(vendor_id);
create trigger ad_placements_touch before update on public.ad_placements
  for each row execute function public.touch_updated_at();
alter table public.ad_placements enable row level security;
create policy "live placements of Spotlight+ vendors are public" on public.ad_placements for select
  using (status = 'active'
    and (starts_on is null or starts_on <= current_date)
    and (ends_on is null or ends_on >= current_date)
    and exists (select 1 from public.vendors v where v.id = vendor_id and v.published and v.tier = 'spotlight_plus'));
create policy "vendors see their own placements" on public.ad_placements for select to authenticated
  using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = (select auth.uid())));

-- Admin helper: draft placements targeted from the vendor's own profile
-- (their category, event types and location). Review, then set status to
-- 'active' in the dashboard. Not callable from the website.
create function public.create_default_ad_placements(p_vendor uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare v record; n int := 0;
begin
  select id, category_id, also_categories, events, tier into v from public.vendors where id = p_vendor;
  if v.id is null then raise exception 'vendor not found'; end if;
  if v.tier <> 'spotlight_plus' then raise exception 'only Spotlight+ vendors are eligible for advertising placements'; end if;
  insert into public.ad_placements (vendor_id, placement_type, category_ids, event_type_ids)
  values (v.id, 'category', array[v.category_id] || v.also_categories, v.events),
         (v.id, 'event', '{}', v.events),
         (v.id, 'article', array[v.category_id] || v.also_categories, v.events);
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.create_default_ad_placements(uuid) from public, anon, authenticated;
