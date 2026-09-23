-- New vendor listings stay hidden until the owner confirms their email
-- (immediately, if email confirmation is turned off in Auth settings).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  l jsonb := new.raw_user_meta_data -> 'listing';
  v_cat text; v_slug text; v_id uuid; v_events text[];
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
    tagline, instagram, facebook, email, phone, published)
  values (v_slug, new.id, left(coalesce(nullif(trim(l ->> 'name'), ''), 'New vendor'), 120),
    coalesce(v_cat, 'planning'), left(coalesce(l ->> 'location', ''), 80), v_events,
    left(coalesce(nullif(trim(l ->> 'from'), ''), 'Price on request'), 60),
    left(coalesce(l ->> 'tagline', ''), 300), left(coalesce(l ->> 'ig', ''), 80),
    left(coalesce(l ->> 'fb', ''), 120), new.email, left(coalesce(l ->> 'phone', ''), 40),
    new.email_confirmed_at is not null)
  returning id into v_id;
  if coalesce(trim(l ->> 'pkgName'), '') <> '' then
    insert into public.packages (vendor_id, name, price_label, description)
    values (v_id, left(l ->> 'pkgName', 120), left(coalesce(l ->> 'pkgPrice', ''), 60), left(coalesce(l ->> 'pkgDesc', ''), 2000));
  end if;
  return new;
end $$;

create function public.handle_user_confirmed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.vendors set published = true
  where owner_user_id = new.id and not published and created_at > now() - interval '30 days';
  return new;
end $$;
revoke execute on function public.handle_user_confirmed() from public, anon, authenticated;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_user_confirmed();
