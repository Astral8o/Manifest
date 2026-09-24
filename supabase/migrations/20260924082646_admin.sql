-- Admin page (/admin/). Everything goes through the functions below, which
-- check is_admin() first; no table grants or policies are widened, so the
-- public site and vendor/planner accounts are unaffected.

create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;  -- no policies: not readable through the API
insert into public.admins (email) values ('astral.ochoa@hotmail.com');

-- True for a signed-in, email-confirmed user whose address is in admins.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u join public.admins a on a.email = lower(u.email)
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null)
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create function public.admin_guard() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
end $$;
revoke execute on function public.admin_guard() from public, anon, authenticated;

-- Overview ---------------------------------------------------------------
create function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  return jsonb_build_object(
    'vendors', (select count(*) from public.vendors),
    'published', (select count(*) from public.vendors where published),
    'spotlight', (select count(*) from public.vendors where tier = 'spotlight'),
    'spotlight_plus', (select count(*) from public.vendors where tier = 'spotlight_plus'),
    'pending_requests', (select count(*) from public.spotlight_requests where status = 'pending'),
    'inquiries', (select count(*) from public.inquiries),
    'inquiries_30d', (select count(*) from public.inquiries where created_at > now() - interval '30 days'),
    'held', (select count(*) from public.inquiries where held),
    'posts', (select count(*) from public.blog_posts),
    'active_ads', (select count(*) from public.ad_placements where status = 'active'));
end $$;

-- Vendors ----------------------------------------------------------------
create function public.admin_vendors() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  return coalesce((select jsonb_agg(to_jsonb(v) || jsonb_build_object(
      'login_email', u.email,
      'inquiry_count', (select count(*) from public.inquiries i where i.vendor_id = v.id),
      'packages', coalesce((select jsonb_agg(jsonb_build_object('name', p.name, 'price', p.price_label, 'desc', p.description, 'img', coalesce(p.img_url, '')) order by p.sort_order)
                            from public.packages p where p.vendor_id = v.id), '[]'))
    order by v.created_at desc)
    from public.vendors v left join auth.users u on u.id = v.owner_user_id), '[]');
end $$;

create function public.admin_save_vendor(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_slug text := trim(both '-' from regexp_replace(lower(coalesce(nullif(trim(p ->> 'slug'), ''), p ->> 'name', '')), '[^a-z0-9]+', '-', 'g'));
  arr text[];
begin
  perform public.admin_guard();
  if coalesce(trim(p ->> 'name'), '') = '' then raise exception 'Name is required'; end if;
  v_slug := left(coalesce(nullif(v_slug, ''), 'vendor'), 60);
  if exists (select 1 from public.vendors where slug = v_slug and id is distinct from v_id) then
    raise exception 'The web address "%" is already used by another vendor', v_slug;
  end if;
  if v_id is null then
    insert into public.vendors (slug, name, category_id) values (v_slug, trim(p ->> 'name'), p ->> 'category_id') returning id into v_id;
  end if;
  update public.vendors set
    slug = v_slug,
    name = left(trim(p ->> 'name'), 120),
    category_id = p ->> 'category_id',
    also_categories = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'also_categories', '[]')) x), '{}'),
    location = coalesce(p ->> 'location', ''),
    areas_served = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'areas_served', '[]')) x), '{}'),
    events = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'events', '[]')) x), '{}'),
    from_label = coalesce(nullif(trim(p ->> 'from_label'), ''), 'Price on request'),
    reply_label = coalesce(p ->> 'reply_label', ''),
    tagline = coalesce(p ->> 'tagline', ''),
    about = coalesce(p ->> 'about', ''),
    instagram = coalesce(p ->> 'instagram', ''),
    facebook = coalesce(p ->> 'facebook', ''),
    website = coalesce(p ->> 'website', ''),
    specialties = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'specialties', '[]')) x), '{}'),
    photos = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'photos', '[]')) x), '{}'),
    tier = coalesce(nullif(p ->> 'tier', ''), 'basic'),
    published = coalesce((p ->> 'published')::boolean, false),
    email = coalesce(p ->> 'email', ''),
    phone = coalesce(p ->> 'phone', ''),
    packages_title = left(trim(coalesce(p ->> 'packages_title', '')), 60)
  where id = v_id;
  if jsonb_typeof(p -> 'packages') = 'array' then
    delete from public.packages where vendor_id = v_id;
    insert into public.packages (vendor_id, name, price_label, description, img_url, sort_order)
    select v_id, left(trim(x ->> 'name'), 120), left(coalesce(trim(x ->> 'price'), ''), 60),
      left(coalesce(trim(x ->> 'desc'), ''), 2000), nullif(x ->> 'img', ''), (n - 1)::int
    from jsonb_array_elements(p -> 'packages') with ordinality as t(x, n)
    where coalesce(trim(x ->> 'name'), '') <> '';
  end if;
  return v_id;
end $$;

create function public.admin_delete_vendor(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  delete from public.vendors where id = p_id;
end $$;

-- Plan requests -----------------------------------------------------------
create function public.admin_requests() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'tier', r.tier, 'status', r.status, 'created_at', r.created_at,
      'vendor_id', v.id, 'vendor', v.name, 'slug', v.slug, 'current_tier', v.tier, 'email', v.email, 'phone', v.phone)
    order by (r.status = 'pending') desc, r.created_at desc)
    from public.spotlight_requests r join public.vendors v on v.id = r.vendor_id), '[]');
end $$;

-- Activating a request also moves the vendor to that plan.
create function public.admin_set_request(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  perform public.admin_guard();
  update public.spotlight_requests set status = p_status where id = p_id returning * into r;
  if r.id is null then raise exception 'Request not found'; end if;
  if p_status = 'activated' then update public.vendors set tier = r.tier where id = r.vendor_id; end if;
end $$;

-- Advertising ---------------------------------------------------------------
create function public.admin_ads() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  return coalesce((select jsonb_agg(to_jsonb(a) || jsonb_build_object('vendor', v.name, 'vendor_tier', v.tier) order by v.name, a.placement_type)
    from public.ad_placements a join public.vendors v on v.id = a.vendor_id), '[]');
end $$;

create function public.admin_save_ad(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := nullif(p ->> 'id', '')::uuid;
begin
  perform public.admin_guard();
  if v_id is null then
    insert into public.ad_placements (vendor_id, placement_type) values ((p ->> 'vendor_id')::uuid, p ->> 'placement_type') returning id into v_id;
  end if;
  update public.ad_placements set
    vendor_id = (p ->> 'vendor_id')::uuid,
    placement_type = p ->> 'placement_type',
    category_ids = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'category_ids', '[]')) x), '{}'),
    event_type_ids = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'event_type_ids', '[]')) x), '{}'),
    location_slugs = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'location_slugs', '[]')) x), '{}'),
    headline = coalesce(p ->> 'headline', ''),
    status = coalesce(nullif(p ->> 'status', ''), 'draft'),
    starts_on = nullif(p ->> 'starts_on', '')::date,
    ends_on = nullif(p ->> 'ends_on', '')::date,
    updated_at = now()
  where id = v_id;
  return v_id;
end $$;

create function public.admin_delete_ad(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  delete from public.ad_placements where id = p_id;
end $$;

create function public.admin_default_ads(p_vendor uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  perform public.create_default_ad_placements(p_vendor);
end $$;

-- Magazine -------------------------------------------------------------------
create function public.admin_posts() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  return coalesce((select jsonb_agg(to_jsonb(b) order by b.published_on desc, b.created_at desc) from public.blog_posts b), '[]');
end $$;

create function public.admin_save_post(p jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_old text := nullif(p ->> 'original_id', '');
  v_id text := trim(both '-' from regexp_replace(lower(coalesce(nullif(trim(p ->> 'id'), ''), p ->> 'title', '')), '[^a-z0-9]+', '-', 'g'));
begin
  perform public.admin_guard();
  if coalesce(trim(p ->> 'title'), '') = '' then raise exception 'Title is required'; end if;
  v_id := left(coalesce(nullif(v_id, ''), 'post'), 80);
  if exists (select 1 from public.blog_posts where id = v_id) and v_id is distinct from v_old then
    raise exception 'The web address "%" is already used by another post', v_id;
  end if;
  if v_old is null then
    insert into public.blog_posts (id, tag, title) values (v_id, '', trim(p ->> 'title'));
  elsif v_old <> v_id then
    update public.blog_posts set id = v_id where id = v_old;
  end if;
  update public.blog_posts set
    title = trim(p ->> 'title'),
    tag = coalesce(nullif(trim(p ->> 'tag'), ''), coalesce(nullif(p ->> 'section', ''), 'Planning Guides')),
    section = coalesce(nullif(p ->> 'section', ''), 'Planning Guides'),
    excerpt = coalesce(p ->> 'excerpt', ''),
    body = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'body', '[]')) x where trim(x) <> ''), '{}'),
    img_path = nullif(p ->> 'img_path', ''),
    author = coalesce(nullif(trim(p ->> 'author'), ''), 'Eventory'),
    read_label = coalesce(p ->> 'read_label', ''),
    published_on = coalesce(nullif(p ->> 'published_on', '')::date, current_date),
    updated_on = case when v_old is null then null else current_date end,
    published = coalesce((p ->> 'published')::boolean, false),
    event_type_ids = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'event_type_ids', '[]')) x), '{}'),
    category_ids = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'category_ids', '[]')) x), '{}'),
    vendor_slugs = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'vendor_slugs', '[]')) x), '{}'),
    faqs = coalesce(p -> 'faqs', '[]')
  where id = v_id;
  return v_id;
end $$;

create function public.admin_delete_post(p_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  delete from public.blog_posts where id = p_id;
end $$;

-- Inquiries --------------------------------------------------------------------
create function public.admin_inquiries(p_limit int default 200) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  return coalesce((select jsonb_agg(to_jsonb(i) || jsonb_build_object('vendor', v.name, 'vendor_tier', v.tier) order by i.created_at desc)
    from (select * from public.inquiries order by created_at desc limit least(greatest(p_limit, 1), 1000)) i
    join public.vendors v on v.id = i.vendor_id), '[]');
end $$;

do $$
declare f text;
begin
  foreach f in array array['admin_overview()', 'admin_vendors()', 'admin_save_vendor(jsonb)', 'admin_delete_vendor(uuid)',
    'admin_requests()', 'admin_set_request(uuid, text)', 'admin_ads()', 'admin_save_ad(jsonb)', 'admin_delete_ad(uuid)',
    'admin_default_ads(uuid)', 'admin_posts()', 'admin_save_post(jsonb)', 'admin_delete_post(text)', 'admin_inquiries(int)'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- Photo uploads from the admin page go to vendor-photos/admin/...
create policy "admins upload photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'vendor-photos' and (storage.foldername(name))[1] = 'admin' and (select public.is_admin()));
create policy "admins delete photos" on storage.objects for delete to authenticated
  using (bucket_id = 'vendor-photos' and (storage.foldername(name))[1] = 'admin' and (select public.is_admin()));
