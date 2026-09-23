drop extension if exists pg_net;
create extension pg_net with schema extensions;

create index saved_vendors_vendor_idx on public.saved_vendors(vendor_id);
create index spotlight_requests_vendor_idx on public.spotlight_requests(vendor_id);
create index unclaimed_businesses_category_idx on public.unclaimed_businesses(category_id);

drop policy "owners manage their packages" on public.packages;
create policy "owners add packages" on public.packages for insert to authenticated
  with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = (select auth.uid())));
create policy "owners edit packages" on public.packages for update to authenticated
  using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = (select auth.uid())));
create policy "owners delete packages" on public.packages for delete to authenticated
  using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = (select auth.uid())));
