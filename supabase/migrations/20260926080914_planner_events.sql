-- Phase 1: planners' Events ("My Events"). An event holds its details and
-- needed categories; saved vendors and inquiries can point at one. Nothing
-- existing changes: saving without an event and inquiries without an event
-- work exactly as before.

create table public.planner_events (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 120),
  event_type text references public.event_types(id),
  event_other text not null default '' check (char_length(event_other) <= 120),
  event_date date,
  guests text not null default '' check (char_length(guests) <= 40),
  location text not null default '' check (char_length(location) <= 80),
  needs text[] not null default '{}',
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index planner_events_owner_idx on public.planner_events(owner_user_id);
create trigger planner_events_touch before update on public.planner_events
  for each row execute function public.touch_updated_at();
alter table public.planner_events enable row level security;
create policy "planners manage their events" on public.planner_events for all to authenticated
  using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
grant select, insert, update, delete on public.planner_events to authenticated;

-- Saved vendors: the same table, now optionally tied to an event. A vendor
-- can be saved once without an event and once per event.
alter table public.saved_vendors add column event_id uuid references public.planner_events(id) on delete cascade;
alter table public.saved_vendors drop constraint saved_vendors_pkey;
alter table public.saved_vendors add column id uuid not null default gen_random_uuid() primary key;
create unique index saved_vendors_unique_idx on public.saved_vendors
  (planner_user_id, vendor_id, coalesce(event_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index saved_vendors_event_idx on public.saved_vendors(event_id);
drop policy "planners manage saved vendors" on public.saved_vendors;
create policy "planners manage saved vendors" on public.saved_vendors for all to authenticated
  using (planner_user_id = (select auth.uid()))
  with check (planner_user_id = (select auth.uid()) and (event_id is null or exists (
    select 1 from public.planner_events e where e.id = event_id and e.owner_user_id = (select auth.uid()))));

-- Inquiries: which event they were sent for, and where they came from
-- ('eventory' for everything today; later also booking links and inquiries
-- a vendor adds from Instagram, WhatsApp and so on).
alter table public.inquiries add column event_id uuid references public.planner_events(id) on delete set null;
alter table public.inquiries add column source text not null default 'eventory'
  check (source in ('eventory', 'booking_link', 'instagram', 'facebook', 'whatsapp', 'website', 'phone', 'email', 'referral', 'walk_in', 'other'));
create index inquiries_event_idx on public.inquiries(event_id);
grant insert (event_id) on public.inquiries to anon, authenticated;
drop policy "anyone sends inquiries" on public.inquiries;
create policy "anyone sends inquiries" on public.inquiries for insert to anon, authenticated
  with check ((planner_user_id is null or planner_user_id = (select auth.uid()))
    and (event_id is null or exists (
      select 1 from public.planner_events e where e.id = event_id and e.owner_user_id = (select auth.uid()))));
