-- Spotlight and Spotlight+ are one-time payments: TTD $175 and TTD $1,600.
update public.vendor_plans set price_ttd = 175, billing_period = 'one-time' where id = 'spotlight';
update public.vendor_plans set price_ttd = 1600, billing_period = 'one-time' where id = 'spotlight_plus';
