-- Every plan now includes unlimited inquiries. The No-Cost Listing's
-- 4-inquiry limit is removed (inquiry_limit null means no limit, so nothing
-- is held any more), and "Unlimited inquiries" moves from Spotlight's
-- extras to the base plan. Prices and the other features are unchanged.
update public.vendor_plans set
  inquiry_limit = null,
  features = array['Public vendor profile', 'Discovery through Eventory', 'Unlimited inquiries']
where id = 'basic';

update public.vendor_plans set
  tagline = 'Get more visibility on Eventory.',
  features = array_remove(features, 'Unlimited inquiries')
where id = 'spotlight';

-- Anything held under the old limit opens now.
update public.inquiries set held = false where held;
