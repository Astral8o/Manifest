-- Reference data --------------------------------------------------------
create table public.categories (
  id text primary key,
  label text not null,
  img_path text,
  sort_order int not null default 0
);

create table public.event_types (
  id text primary key,
  label text not null,
  short text not null,
  needs text[] not null default '{}',   -- category ids this event usually needs
  sort_order int not null default 0
);

-- Vendors ---------------------------------------------------------------
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  owner_user_id uuid unique references auth.users(id) on delete set null,
  name text not null check (length(name) between 1 and 120),
  category_id text not null references public.categories(id),
  location text not null default '',
  events text[] not null default '{}',
  from_label text not null default 'Price on request',
  reply_label text not null default '',
  tagline text not null default '',
  about text not null default '',
  instagram text not null default '',
  facebook text not null default '',
  photos text[] not null default '{}',
  tier text not null default 'basic' check (tier in ('basic','spotlight','top')),
  published boolean not null default true,
  -- private contact details, never exposed to anon (column grants below)
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vendors_category_idx on public.vendors(category_id);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  price_label text not null default '',
  description text not null default '',
  img_url text,
  sort_order int not null default 0
);
create index packages_vendor_idx on public.packages(vendor_id);

-- Inquiries -------------------------------------------------------------
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  planner_user_id uuid references auth.users(id) on delete set null,
  event_type text not null default '',
  event_other text not null default '',
  event_date date,
  guests text not null default '',
  location text not null default '',
  package_name text not null default '',
  budget text not null default '',
  message text not null default '' check (length(message) <= 5000),
  name text not null check (length(name) between 1 and 200),
  email text not null check (email ~ '^\S+@\S+\.\S+$'),
  phone text not null default '',
  contact_pref text not null default 'Email' check (contact_pref in ('Email','Phone','WhatsApp')),
  status text not null default 'new' check (status in ('new','replied')),
  held boolean not null default false,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index inquiries_vendor_idx on public.inquiries(vendor_id, created_at desc);
create index inquiries_planner_idx on public.inquiries(planner_user_id);

create table public.saved_vendors (
  planner_user_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (planner_user_id, vendor_id)
);

create table public.spotlight_requests (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  tier text not null check (tier in ('basic','spotlight','top')),
  created_at timestamptz not null default now()
);

-- Blog ------------------------------------------------------------------
create table public.blog_posts (
  id text primary key,                 -- url slug
  tag text not null,
  published_on date not null default current_date,
  read_label text not null default '',
  img_path text,
  title text not null,
  excerpt text not null default '',
  body text[] not null default '{}',   -- one entry per paragraph
  vendor_slugs text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Carried over from the old site: scraped businesses not yet on Eventory.
create table public.unclaimed_businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  old_category_code text not null,
  category_id text references public.categories(id),
  city text,
  phone text,
  source_url text,
  created_at timestamptz not null default now()
);

-- Housekeeping ----------------------------------------------------------
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger vendors_touch before update on public.vendors
  for each row execute function public.touch_updated_at();

-- Basic-tier vendors get a limited number of open inquiries; the rest are
-- held until they upgrade. Computed server-side so clients can't bypass it.
create function public.inquiry_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_tier text; v_count int;
begin
  select tier into v_tier from public.vendors where id = new.vendor_id and published;
  if v_tier is null then raise exception 'vendor not found'; end if;
  select count(*) into v_count from public.inquiries where vendor_id = new.vendor_id;
  new.held := v_tier = 'basic' and v_count >= 4;
  new.status := 'new';
  new.emailed_at := null;
  new.created_at := now();
  return new;
end $$;
create trigger inquiries_before_insert before insert on public.inquiries
  for each row execute function public.inquiry_before_insert();

-- RLS -------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.event_types enable row level security;
alter table public.vendors enable row level security;
alter table public.packages enable row level security;
alter table public.inquiries enable row level security;
alter table public.saved_vendors enable row level security;
alter table public.spotlight_requests enable row level security;
alter table public.blog_posts enable row level security;
alter table public.unclaimed_businesses enable row level security;

create policy "categories are public" on public.categories for select using (true);
create policy "event types are public" on public.event_types for select using (true);
create policy "published blog posts are public" on public.blog_posts for select using (published);

create policy "published vendors are public" on public.vendors for select
  using (published or owner_user_id = (select auth.uid()));
create policy "signed-in users create their own listing" on public.vendors for insert to authenticated
  with check (owner_user_id = (select auth.uid()) and tier = 'basic');
create policy "owners edit their listing" on public.vendors for update to authenticated
  using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));

-- Contact details and tier are not client-writable/readable beyond these columns.
revoke select, insert, update on public.vendors from anon, authenticated;
grant select (id, slug, owner_user_id, name, category_id, location, events, from_label, reply_label,
  tagline, about, instagram, facebook, photos, tier, published, created_at, updated_at)
  on public.vendors to anon, authenticated;
grant insert (slug, owner_user_id, name, category_id, location, events, from_label, reply_label,
  tagline, about, instagram, facebook, photos, email, phone) on public.vendors to authenticated;
grant update (name, category_id, location, events, from_label, reply_label, tagline, about,
  instagram, facebook, photos, email, phone) on public.vendors to authenticated;

create policy "packages of published vendors are public" on public.packages for select
  using (exists (select 1 from public.vendors v where v.id = vendor_id
                 and (v.published or v.owner_user_id = (select auth.uid()))));
create policy "owners manage their packages" on public.packages for all to authenticated
  using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = (select auth.uid())));

-- Anyone can send an inquiry; planners attach it to themselves only.
create policy "anyone sends inquiries" on public.inquiries for insert to anon, authenticated
  with check (planner_user_id is null or planner_user_id = (select auth.uid()));
create policy "planners see their own inquiries" on public.inquiries for select to authenticated
  using (planner_user_id = (select auth.uid()));
revoke insert, update on public.inquiries from anon, authenticated;
grant insert (vendor_id, planner_user_id, event_type, event_other, event_date, guests, location,
  package_name, budget, message, name, email, phone, contact_pref) on public.inquiries to anon, authenticated;

create policy "planners manage saved vendors" on public.saved_vendors for all to authenticated
  using (planner_user_id = (select auth.uid())) with check (planner_user_id = (select auth.uid()));

create policy "owners request spotlight" on public.spotlight_requests for insert to authenticated
  with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = (select auth.uid())));
create policy "owners see their spotlight requests" on public.spotlight_requests for select to authenticated
  using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = (select auth.uid())));
-- unclaimed_businesses: no policies, so only the service role/dashboard can read it.

-- Vendor inbox: held inquiries come back without contact details or message.
create function public.vendor_inbox()
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
  cross join lateral (select i.held and v.tier = 'basic' as h) x
  where v.owner_user_id = (select auth.uid())
  order by i.created_at desc
$$;
revoke execute on function public.vendor_inbox() from public, anon;
grant execute on function public.vendor_inbox() to authenticated;

create function public.set_inquiry_status(p_id uuid, p_status text) returns void
language sql security definer set search_path = '' as $$
  update public.inquiries i set status = p_status
  from public.vendors v
  where i.id = p_id and v.id = i.vendor_id and v.owner_user_id = (select auth.uid())
    and p_status in ('new','replied') and not (i.held and v.tier = 'basic')
$$;
revoke execute on function public.set_inquiry_status(uuid, text) from public, anon;
grant execute on function public.set_inquiry_status(uuid, text) to authenticated;

revoke execute on function public.inquiry_before_insert() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Photos ----------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vendor-photos', 'vendor-photos', true, 5242880, array['image/jpeg','image/png','image/webp']);

create policy "vendors upload to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'vendor-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "vendors replace their own photos" on storage.objects for update to authenticated
  using (bucket_id = 'vendor-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "vendors delete their own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'vendor-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
