-- Vendors can list any number of packages, services or products, at sign-up
-- (listing.packages in the sign-up metadata) and later from their dashboard
-- (set_my_packages). Vendors name each item themselves, and can rename the
-- section heading on their profile (packages_title, blank = "Packages & services").

alter table public.vendors add column packages_title text not null default ''
  check (char_length(packages_title) <= 60);
grant select (packages_title) on public.vendors to anon, authenticated;
grant insert (packages_title), update (packages_title) on public.vendors to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  l jsonb := new.raw_user_meta_data -> 'listing';
  v_cat text; v_slug text; v_id uuid; v_events text[]; v_pkgs jsonb;
begin
  if coalesce(new.raw_user_meta_data ->> 'role', '') <> 'vendor' or l is null then
    return new;
  end if;
  select id into v_cat from public.categories where id = l ->> 'cat';
  select coalesce(array_agg(e), '{}') into v_events
    from jsonb_array_elements_text(coalesce(l -> 'events', '[]')) e
    where e in (select id from public.event_types);
  v_slug := trim(both '-' from regexp_replace(lower(coalesce(l ->> 'name', 'vendor')), '[^a-z0-9]+', '-', 'g'));
  v_slug := left(coalesce(nullif(v_slug, ''), 'vendor'), 50) || '-' || substr(md5(new.id::text), 1, 5);
  insert into public.vendors (slug, owner_user_id, name, category_id, location, events, from_label,
    tagline, instagram, facebook, email, phone, packages_title, published)
  values (v_slug, new.id, left(coalesce(nullif(trim(l ->> 'name'), ''), 'New vendor'), 120),
    coalesce(v_cat, 'planning'), left(coalesce(l ->> 'location', ''), 80), v_events,
    left(coalesce(nullif(trim(l ->> 'from'), ''), 'Price on request'), 60),
    left(coalesce(l ->> 'tagline', ''), 300), left(coalesce(l ->> 'ig', ''), 80),
    left(coalesce(l ->> 'fb', ''), 120), new.email, left(coalesce(l ->> 'phone', ''), 40),
    left(trim(coalesce(l ->> 'pkgTitle', '')), 60), new.email_confirmed_at is not null)
  returning id into v_id;
  -- Older sign-up pages send a single pkgName/pkgPrice/pkgDesc.
  v_pkgs := case when jsonb_typeof(l -> 'packages') = 'array' then l -> 'packages'
    else jsonb_build_array(jsonb_build_object('name', l ->> 'pkgName', 'price', l ->> 'pkgPrice', 'desc', l ->> 'pkgDesc')) end;
  insert into public.packages (vendor_id, name, price_label, description, sort_order)
  select v_id, left(trim(p ->> 'name'), 120), left(coalesce(trim(p ->> 'price'), ''), 60),
    left(coalesce(trim(p ->> 'desc'), ''), 2000), (n - 1)::int
  from jsonb_array_elements(v_pkgs) with ordinality as t(p, n)
  where jsonb_typeof(p) = 'object' and coalesce(trim(p ->> 'name'), '') <> '' and n <= 50;
  return new;
end $$;

-- Replaces the caller's package list in one transaction. Runs as the caller,
-- so the packages row level security policies decide what it may change.
create function public.set_my_packages(p_vendor uuid, p_packages jsonb, p_title text default null) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.vendors v where v.id = p_vendor and v.owner_user_id = (select auth.uid())) then
    raise exception 'Not your listing';
  end if;
  if jsonb_typeof(p_packages) <> 'array' or jsonb_array_length(p_packages) > 50 then
    raise exception 'Up to 50 packages';
  end if;
  if p_title is not null then
    update public.vendors set packages_title = left(trim(p_title), 60) where id = p_vendor;
  end if;
  delete from public.packages where vendor_id = p_vendor;
  insert into public.packages (vendor_id, name, price_label, description, img_url, sort_order)
  select p_vendor, left(trim(p ->> 'name'), 120), left(coalesce(trim(p ->> 'price'), ''), 60),
    left(coalesce(trim(p ->> 'desc'), ''), 2000), nullif(p ->> 'img', ''), (n - 1)::int
  from jsonb_array_elements(p_packages) with ordinality as t(p, n)
  where jsonb_typeof(p) = 'object' and coalesce(trim(p ->> 'name'), '') <> '';
end $$;
revoke execute on function public.set_my_packages(uuid, jsonb, text) from public, anon;
grant execute on function public.set_my_packages(uuid, jsonb, text) to authenticated;
