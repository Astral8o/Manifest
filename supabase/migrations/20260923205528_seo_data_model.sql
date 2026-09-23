-- SEO / discovery data model.
-- Categories, event types and locations become first-class landing-page
-- entities with their own URL slug, intro copy and FAQs. Vendors gain the
-- few fields planners actually ask about (website, areas served,
-- specialties, secondary categories). Blog posts gain magazine sections and
-- explicit links to the event types and categories they cover, so internal
-- links come from data rather than hardcoded lists.

-- Categories --------------------------------------------------------------
alter table public.categories
  add column seo_slug text unique,          -- /photographers/
  add column combo_slug text,               -- /wedding-photographers/
  add column singular text,                 -- "photographer" (used in sentences)
  add column plural text,                   -- "Photographers" (used in headings)
  add column intro text not null default '',
  add column faqs jsonb not null default '[]'::jsonb;

update public.categories c set seo_slug = v.seo_slug, combo_slug = v.combo_slug, singular = v.singular, plural = v.plural, intro = v.intro, faqs = v.faqs::jsonb
from (values
  ('photography', 'photographers', 'photographers', 'photographer', 'Photographers',
   'Event photographers capture the day as it happens: the people, the details and the moments you will want to look back on. Compare photographers by the events they cover, their packages and where they are based, then send an inquiry with your date.',
   '[{"q":"What should I include when I contact a photographer?","a":"Send your event date, the type of event, the location and roughly how many hours of coverage you need. Photographers can only confirm availability and give an accurate quote once they know the date and the length of the day."},{"q":"How far ahead should I book a photographer?","a":"Book as soon as your date and venue are fixed. Photographers usually cover a limited number of events per weekend, so popular dates fill first."}]'),
  ('videography', 'videographers', 'videographers', 'videographer', 'Videographers',
   'Videographers film your event and edit it into highlight reels, full-length films or short social clips. Use Eventory to find videographers by event type and location and ask what formats and turnaround they offer.',
   '[{"q":"What should I ask a videographer?","a":"Ask what you receive at the end (highlight film, full edit, social cuts), how long editing takes, and whether they need power or space at the venue for equipment."}]'),
  ('catering', 'caterers', 'caterers', 'caterer', 'Caterers',
   'Caterers plan, cook and serve the food for your event, from drop-off trays to plated dinners with service staff. Compare caterers by their menus, service style and the events they cater, then send your guest count for a quote.',
   '[{"q":"How do caterers quote for an event?","a":"Most caterers price per guest. Your quote depends on the guest count, the menu, and whether you need buffet service, plated service or drop-off only. Include all three in your inquiry for an accurate figure."},{"q":"Can caterers handle dietary requirements?","a":"Many can. Mention vegetarian, no-pork, halal or allergy requirements in your inquiry so the caterer can confirm before quoting."}]'),
  ('decor', 'decorators', 'decorators', 'decorator', 'Decorators',
   'Event decorators design and install the look of your event: backdrops, balloon garlands, draping, table styling and centrepieces. Browse decorators by the events they style and send your theme, colours and venue.',
   '[{"q":"What does an event decorator need to know?","a":"Your venue, event date, colour palette or theme, guest count and the setup and breakdown times allowed by the venue."}]'),
  ('venues', 'venues', 'venues', 'venue', 'Venues',
   'Event venues range from banquet halls and hotel ballrooms to outdoor spaces and waterfront decks. Compare venues by capacity, the events they host and location, then check availability for your date.',
   '[{"q":"What should I ask an event venue?","a":"Confirm the date is free, the capacity for your layout, what furniture and equipment is included, access times for setup, and whether you must use their in-house caterer or bar."},{"q":"When should I book the venue?","a":"Book the venue first. Most other vendors need your date and location before they can confirm."}]'),
  ('entertainment', 'djs-and-entertainment', 'djs-and-entertainment', 'DJ or entertainment provider', 'DJs and Entertainment',
   'DJs, MCs, bands and entertainers set the energy of your event. Find entertainment by the events they play and ask about sound, lighting and set lengths.',
   '[{"q":"Does a DJ bring their own sound system?","a":"Many do, but not all. Ask whether sound and lighting are included and how many guests or how large a space their setup covers."}]'),
  ('cakes', 'cake-vendors', 'cake-vendors', 'cake maker', 'Cake Vendors',
   'Cake vendors bake custom celebration cakes, cupcakes and dessert tables to order. Browse cake makers by the events they serve and send your date, servings and design ideas.',
   '[{"q":"How far ahead should I order a custom cake?","a":"Contact cake makers once your date and guest count are set. Tiered and custom designs need more lead time than simple cakes, so ask each vendor for their minimum notice."}]'),
  ('florals', 'florists', 'florists', 'florist', 'Florists',
   'Florists create bouquets, centrepieces and floral installations for ceremonies, receptions and corporate events. Share your colours, venue and date to get a quote.',
   '[]'),
  ('rentals', 'event-rentals', 'rentals', 'rental company', 'Event Rentals',
   'Rental companies supply tents, tables, chairs, linens, staging and other equipment for events of every size. Compare rental companies by what they supply and where they deliver.',
   '[{"q":"What should I include in a rental inquiry?","a":"List the items and quantities you need, the event address, and the delivery and collection times. Delivery distance often affects the price."}]'),
  ('makeup', 'makeup-and-hair', 'makeup-and-hair', 'makeup and hair artist', 'Makeup and Hair Artists',
   'Makeup artists and hair stylists prepare you and your party for weddings, photoshoots and special occasions, in studio or on location. Compare artists by service and location.',
   '[{"q":"Should I book a makeup trial?","a":"For weddings and major events a trial is worth it. It lets you agree on the look and timing before the day. Ask each artist whether trials are offered and how they are priced."}]'),
  ('planning', 'event-planners', 'planners', 'event planner', 'Event Planners',
   'Event planners and coordinators manage your event from planning to the day itself: timelines, vendors, budgets and on-the-day coordination. Find planners by the events they run.',
   '[]'),
  ('bar', 'bar-services', 'bar-services', 'bar service', 'Bar Services',
   'Mobile bars and bartending services provide drinks, bartenders and signature cocktails for weddings, fetes and corporate events.',
   '[]')
) as v(id, seo_slug, combo_slug, singular, plural, intro, faqs)
where c.id = v.id;

alter table public.categories
  alter column seo_slug set not null, alter column combo_slug set not null,
  alter column singular set not null, alter column plural set not null;

-- Event types --------------------------------------------------------------
alter table public.event_types
  add column seo_slug text unique,          -- /wedding-vendors/, /wedding-photographers/
  add column noun text,                     -- "wedding" (used in sentences)
  add column intro text not null default '',
  add column faqs jsonb not null default '[]'::jsonb;

insert into public.event_types (id, label, short, needs, sort_order) values
  ('fetes', 'Fetes', 'Fetes', array['venues','entertainment','bar','catering','rentals'], 9),
  ('conferences', 'Conferences', 'Conferences', array['venues','catering','videography','photography','planning','rentals'], 10),
  ('graduations', 'Graduations', 'Graduations', array['venues','catering','photography','cakes','decor','entertainment'], 11),
  ('community', 'Community Events', 'Community', array['rentals','entertainment','catering','planning'], 12),
  ('private', 'Private Events', 'Private', array['venues','catering','bar','entertainment','decor'], 13);
update public.event_types set sort_order = 14 where id = 'other';

update public.event_types e set seo_slug = v.seo_slug, noun = v.noun, intro = v.intro, faqs = v.faqs::jsonb
from (values
  ('weddings', 'wedding', 'wedding',
   'A wedding usually brings together more vendors than any other event: a venue, photographer, caterer, decor, florals, cake, makeup, entertainment and bar. Start with the vendors that take one event per day, then fill in the rest once your date is set.',
   '[{"q":"Which wedding vendors should I book first?","a":"Book the venue first because your date depends on it. Photographers and caterers usually come next, since they take a limited number of events per weekend. Decor, florals, cake and makeup can follow once the venue and colours are settled."}]'),
  ('birthdays', 'birthday', 'birthday',
   'Birthday events range from backyard parties to milestone celebrations in a hall. Most need a venue or rentals, food, a cake and some entertainment.',
   '[]'),
  ('corporate', 'corporate-event', 'corporate event',
   'Corporate events such as launches, staff functions, award nights and family days need vendors who work to a brief and a timeline: venues, catering, audio-visual, photography, entertainment and planners.',
   '[{"q":"What vendors does a corporate event need?","a":"Most need a venue, catering and someone to handle sound and presentation. Add photography or video if you want coverage for internal or social use, and a planner if your team does not have time to coordinate vendors."}]'),
  ('christenings', 'christening', 'christening',
   'Christenings are usually smaller gatherings after the service, with catering, a cake, some decor and a photographer.',
   '[]'),
  ('sports', '5k', '5K or sports event',
   'A 5K or sports event needs vendors for the start and finish: rentals for arches, barriers and tents, a sound system and MC, photography and refreshments.',
   '[{"q":"What does a 5K need besides the course?","a":"Plan for a start and finish area with an arch or banner, barriers, a PA system the runners can hear, water stations, tents and someone photographing the finish."}]'),
  ('launches', 'product-launch', 'product launch',
   'A product launch needs a room, a way to capture it and something for guests to experience. Typical vendors are venues, video and photography, decor, a bar and a planner.',
   '[]'),
  ('family', 'family-day', 'family day',
   'Family days are daytime events for staff, members or communities. They usually need tents and rentals, catering, entertainment for children and adults, and decor.',
   '[]'),
  ('religious', 'religious-event', 'religious event',
   'Religious events and celebrations often need a venue, catering suited to dietary customs, decor and florals.',
   '[]'),
  ('fetes', 'fete', 'fete',
   'Fetes need a venue, sound and DJs, a bar, food and rentals such as tents, staging and barriers.',
   '[]'),
  ('conferences', 'conference', 'conference',
   'Conferences need a venue with the right capacity and layout, catering for breaks and meals, audio-visual support, photography or video, and often a planner.',
   '[]'),
  ('graduations', 'graduation', 'graduation',
   'Graduation celebrations usually need a venue or rentals, catering, a cake, decor, photography and entertainment.',
   '[]'),
  ('community', 'community-event', 'community event',
   'Community events such as festivals and open days usually need rentals, sound and entertainment, food vendors and coordination.',
   '[]'),
  ('private', 'private-event', 'private event',
   'Private events such as anniversaries, dinners and house parties usually need catering, a bar, entertainment and decor.',
   '[]'),
  ('other', null, 'event', '', '[]')
) as v(id, seo_slug, noun, intro, faqs)
where e.id = v.id;
alter table public.event_types alter column noun set not null;

-- Locations -----------------------------------------------------------------
-- Canonical place names used in vendor locations. Island is plain geography,
-- used to group places; it is never used to invent a vendor's location.
create table public.locations (
  slug text primary key,
  name text not null unique,
  island text not null check (island in ('Trinidad', 'Tobago')),
  sort_order int not null default 0
);
alter table public.locations enable row level security;
create policy "locations are public" on public.locations for select using (true);
insert into public.locations (slug, name, island) values
  ('arima','Arima','Trinidad'), ('chaguanas','Chaguanas','Trinidad'), ('chaguaramas','Chaguaramas','Trinidad'),
  ('couva','Couva','Trinidad'), ('diego-martin','Diego Martin','Trinidad'), ('la-romain','La Romain','Trinidad'),
  ('maraval','Maraval','Trinidad'), ('point-fortin','Point Fortin','Trinidad'), ('port-of-spain','Port of Spain','Trinidad'),
  ('princes-town','Princes Town','Trinidad'), ('san-fernando','San Fernando','Trinidad'), ('sangre-grande','Sangre Grande','Trinidad'),
  ('siparia','Siparia','Trinidad'), ('st-augustine','St. Augustine','Trinidad'), ('trincity','Trincity','Trinidad'),
  ('tunapuna','Tunapuna','Trinidad'), ('scarborough','Scarborough, Tobago','Tobago');

-- Vendors -------------------------------------------------------------------
alter table public.vendors
  add column website text not null default '',
  add column areas_served text[] not null default '{}',   -- place names the vendor serves, as they state them
  add column specialties text[] not null default '{}',    -- short phrases, e.g. "Vegetarian and no-pork menus"
  add column also_categories text[] not null default '{}'; -- secondary category ids

grant select (website, areas_served, specialties, also_categories) on public.vendors to anon, authenticated;
grant insert (website, areas_served, specialties, also_categories) on public.vendors to authenticated;
grant update (website, areas_served, specialties, also_categories) on public.vendors to authenticated;

-- Carried over from the old project's vendor tags (the only structured
-- specialty data it had).
update public.vendors set specialties = array['Staffed service', 'Vegetarian and no pork', 'Own service ware']
where slug = 'cocoa-pod-catering';

-- Magazine ------------------------------------------------------------------
alter table public.blog_posts
  add column section text not null default 'Planning Guides'
    check (section in ('Planning Guides','Vendor Guides','Event Types','Local Guides','Vendor Spotlights','Real Events')),
  add column author text not null default 'Eventory',
  add column updated_on date,
  add column event_type_ids text[] not null default '{}',
  add column category_ids text[] not null default '{}',
  add column faqs jsonb not null default '[]'::jsonb;

update public.blog_posts b set section = v.section, event_type_ids = v.ev, category_ids = v.cats, faqs = v.faqs::jsonb
from (values
  ('wedding-first', 'Planning Guides', array['weddings'], array['venues','photography','catering','decor','florals','cakes','makeup'],
   '[{"q":"What should I book first for a wedding in Trinidad?","a":"The venue. Popular venues in Chaguaramas and Port of Spain are often booked a year out for December and Carnival-adjacent weekends, and your date depends on the venue."},{"q":"When should I book decor, florals, cake and makeup?","a":"Usually three to six months out, once your venue and colour palette are settled."}]'),
  ('launch-pos', 'Event Types', array['launches','corporate'], array['venues','videography','bar','planning'],
   '[{"q":"What vendors does a product launch need?","a":"A room, a planner or coordinator, video and photography for coverage, and a bar or experience for guests."}]'),
  ('per-head', 'Vendor Guides', array[]::text[], array['catering'],
   '[{"q":"What is included in a caterer''s per-head price?","a":"Usually the food, and often staff, chafing dishes and cleanup, but this varies, so ask. Plated service costs more than buffet because it needs more staff."}]'),
  ('soundwave', 'Vendor Spotlights', array['weddings','birthdays','sports'], array['entertainment'], '[]'),
  ('5k', 'Planning Guides', array['sports'], array['rentals','entertainment','photography'],
   '[{"q":"How many water stations does a 5K need?","a":"Plan one water station per two kilometres, plus one at the finish."}]')
) as v(id, section, ev, cats, faqs)
where b.id = v.id;
