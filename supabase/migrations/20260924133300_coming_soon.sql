-- Coming-soon mode and launch waitlist. The switch lives in site_settings so
-- it can be flipped from /admin/ without a deploy.

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
create policy "settings are public" on public.site_settings for select using (true);
grant select on public.site_settings to anon, authenticated;
insert into public.site_settings (key, value) values ('coming_soon', 'true');

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~ '^\S+@\S+\.\S+$' and length(email) <= 200),
  role text not null default 'planner' check (role in ('planner', 'vendor')),
  created_at timestamptz not null default now()
);
create unique index waitlist_email_idx on public.waitlist (lower(email));
alter table public.waitlist enable row level security;
-- Anyone can join; nobody can read the list through the API.
create policy "anyone can join the waitlist" on public.waitlist for insert to anon, authenticated with check (true);
revoke all on public.waitlist from anon, authenticated;
grant insert (email, role) on public.waitlist to anon, authenticated;

create function public.admin_set_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  insert into public.site_settings (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;

create function public.admin_waitlist() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  return coalesce((select jsonb_agg(to_jsonb(w) order by w.created_at desc) from public.waitlist w), '[]');
end $$;

create function public.admin_delete_waitlist(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_guard();
  delete from public.waitlist where id = p_id;
end $$;

revoke execute on function public.admin_set_setting(text, jsonb) from public, anon;
revoke execute on function public.admin_waitlist() from public, anon;
revoke execute on function public.admin_delete_waitlist(uuid) from public, anon;
grant execute on function public.admin_set_setting(text, jsonb) to authenticated;
grant execute on function public.admin_waitlist() to authenticated;
grant execute on function public.admin_delete_waitlist(uuid) to authenticated;
