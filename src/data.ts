// Demo content and derived deal fields. All businesses and offers are fictional.

/** Demo "today". The prototype is pinned to Mon 23 Nov 2026 so expiry labels stay stable. */
export const TODAY = new Date(2026, 10, 23);
const DAY = 864e5;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const fmt = (d: Date) => d.getDate() + ' ' + MON[d.getMonth()];
export const todayLabel = `${DOW[TODAY.getDay()]} ${fmt(TODAY)}`;
const pd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const INK = '#141210';
export const CREAM = '#FFF6E5';
export const PAPER = '#FFFDF8';
export const TOMATO = '#F0412F';
export const SUN = '#FFC531';
export const PINK = '#FF8FB8';
export const LILAC = '#B79CF0';
export const LIME = '#C6E83C';
export const SKY = '#7CC6F2';
export const ORANGE = '#FF8A3D';

export type CatKey = 'food' | 'shopping' | 'beauty' | 'events' | 'experiences';
export const CATS: Record<CatKey, { label: string; color: string }> = {
  food: { label: 'Food & Drink', color: TOMATO },
  shopping: { label: 'Shopping', color: SUN },
  beauty: { label: 'Beauty & Wellness', color: PINK },
  events: { label: 'Events', color: LILAC },
  experiences: { label: 'Experiences', color: LIME },
};

export const REGIONS = ['POS & West', 'East', 'Central', 'South', 'Tobago', 'Online'] as const;
export type Region = (typeof REGIONS)[number];

export type Action = 'WhatsApp Business' | 'Show In Store' | 'Book Now' | 'Get Tickets' | 'Get Deal' | 'View Offer';
export type Format = 'In-store' | 'Online' | 'Online & in-store';

const DEST: Record<Action, [string, string]> = {
  'WhatsApp Business': ['Opens a WhatsApp chat with the business', 'WhatsApp'],
  'Show In Store': ['Shows a pass to show at the counter', 'the in-store pass'],
  'Book Now': ['Opens the booking page', 'the booking page'],
  'Get Tickets': ['Opens the official ticketing page', 'the ticketing page'],
  'Get Deal': ['Opens the online store', 'the online store'],
  'View Offer': ["Opens the organiser's page", "the organiser's page"],
};

const CLAIM: Record<Action, (b: string) => string[]> = {
  'WhatsApp Business': (b) => [
    `Tap “WhatsApp Business”. A message to ${b} opens with the deal pre-filled.`,
    'Confirm quantity and pickup or delivery time with the business.',
    'Pay the business directly. EventoryTT never takes payment.',
  ],
  'Show In Store': (b) => [`Visit ${b}.`, 'Tap “Show In Store” and show the pass at the counter before you order.', 'Pay in store at the promo price.'],
  'Book Now': (b) => [`Tap “Book Now” to open ${b}’s booking page.`, 'Pick a date and mention EventoryTT in the notes.', 'Pay the business directly.'],
  'Get Tickets': () => ['Tap “Get Tickets” to open the official ticketing page.', 'Buy or reserve your tickets there.', 'Bring your e-ticket on the day.'],
  'Get Deal': (b) => [`Tap “Get Deal” to open the ${b} online store.`, 'The discount is applied automatically at checkout.', 'Shopping in person? Show this page at the till.'],
  'View Offer': () => ["Tap “View Offer” for the organiser's full details.", 'No booking needed. Just show up.', 'Free to attend. Bring water and a friend.'],
};

const TERMS = ['While stocks or spaces last.', 'Cannot be combined with other offers.', 'The business sets final prices and availability.'];

type Raw = [
  id: string, biz: string, title: string, cat: CatKey, price: number, was: number, region: Region, area: string, address: string,
  start: string, end: string, added: number, action: Action, format: Format, img: string, tags: string[], hot: number,
  featured: boolean, blurb: string, when: string,
];

const RAW: Raw[] = [
  ['bake-shark', 'Shore Thing Bake & Shark', 'Bake & shark for two + 2 sorrels', 'food', 90, 120, 'POS & West', 'Maracas Bay', 'Beach facilities, Maracas Bay', '2026-11-20', '2026-11-30', 0, 'WhatsApp Business', 'In-store', 'bake & shark, beachside', ['weekend', 'food', 'date'], 96, true, 'The North Coast drive is half the fun. Order ahead on WhatsApp and skip the Sunday line.', 'Sat & Sun · 10am–6pm'],
  ['doubles-four', "Aunty Vee's Doubles", 'Doubles breakfast for four: 8 doubles + 4 drinks', 'food', 48, 64, 'East', 'Curepe', 'Southern Main Rd, Curepe', '2026-11-23', '2026-11-25', 0, 'Show In Store', 'In-store', 'doubles wrapped in paper', ['food', 'budget', 'family'], 99, false, 'Slight pepper, extra channa. The breakfast run your whole office will thank you for.', 'Mon–Wed · 6am–11am'],
  ['sunday-brunch', 'Breadfruit & Co.', 'Sunday Lime brunch with bottomless mimosas', 'food', 185, 240, 'POS & West', 'Woodbrook', 'Ariapita Ave, Woodbrook', '2026-11-15', '2026-11-30', 3, 'Book Now', 'In-store', 'brunch table spread', ['weekend', 'date', 'food'], 88, true, 'Long tables, local fruit, saltfish buljol done properly. Book a late seating and stay for the music.', 'Sundays · 10am–2pm'],
  ['pulse-month', 'Pulse Fitness', 'One month of unlimited classes', 'beauty', 299, 450, 'Central', 'Chaguanas', 'Price Plaza, Chaguanas', '2026-11-10', '2026-12-05', 6, 'WhatsApp Business', 'In-store', 'spin class studio', [], 61, false, 'Spin, HIIT and dance classes, seven days a week.', 'Daily · 5am–9pm'],
  ['gloss-mani', 'Gloss Studio', 'Gel manicure + pedicure', 'beauty', 220, 320, 'South', 'San Fernando', 'Coffee St, San Fernando', '2026-11-18', '2026-11-26', 2, 'Book Now', 'In-store', 'gel nails close-up', [], 74, false, 'Ninety minutes, one cold drink, nails that last to Christmas.', 'Tue–Sat'],
  ['kicks-running', 'Kicks Corner', 'Running sneakers, 30% off all brands', 'shopping', 420, 600, 'East', 'Trincity Mall', 'Trincity Mall, Level 1', '2026-11-21', '2026-11-29', 1, 'Get Deal', 'Online & in-store', 'sneakers on a bright backdrop', [], 83, true, 'Every running shoe in store and online, including new season colours.', 'Mall hours'],
  ['parang-night', 'Paramin Parang Lime', 'Parang night under the stars', 'events', 150, 0, 'POS & West', 'Paramin', 'Paramin Community Centre', '2026-11-01', '2026-11-28', 4, 'Get Tickets', 'In-store', 'parang band with cuatro', ['weekend', 'events', 'date'], 90, false, 'Cuatro, maracas and pastelles up in the hills. Dress warm. It gets cool after dark.', 'Sat 28 Nov · 7pm'],
  ['sunset-yoga', 'Savannah Flow Collective', 'Free sunset yoga on the Savannah', 'experiences', 0, 0, 'POS & West', "Queen's Park Savannah", "Queen's Park Savannah, near the Grand Stand", '2026-11-01', '2026-12-31', 1, 'View Offer', 'In-store', 'yoga mats on grass at sunset', ['weekend', 'free', 'outdoor', 'family', 'budget'], 79, false, 'An hour of easy flow as the sun drops behind the hills. All levels, bring your own mat.', 'Every Sat · 5pm'],
  ['reef-kayak', 'Tobago Reef Paddle', 'Glass-bottom kayak tour for two', 'experiences', 280, 350, 'Tobago', 'Pigeon Point', 'Pigeon Point Heritage Park', '2026-11-10', '2026-12-15', 5, 'Book Now', 'In-store', 'clear kayak over reef', ['outdoor', 'date', 'weekend'], 85, true, 'Paddle over Buccoo Reef in a see-through kayak. Guides point out the parrotfish.', 'Daily · 8am & 3pm'],
  ['pastelles', "Mama Rosa's Kitchen", 'Christmas pastelles, one dozen', 'food', 120, 150, 'East', 'Arima', 'Pickup on Queen Mary Ave, Arima', '2026-11-22', '2026-12-20', 0, 'WhatsApp Business', 'In-store', 'pastelles in banana leaf', ['food', 'family'], 92, false, 'Beef, chicken or lentil. Order early: last year they sold out by the 10th.', 'Pickup Thu–Sat'],
  ['case-bogo', 'Case Lab TT', 'Buy one phone case, get one free', 'shopping', 95, 190, 'Online', 'Islandwide delivery', 'Online only, delivery islandwide', '2026-11-20', '2026-11-24', 2, 'Get Deal', 'Online', 'phone cases flat lay', [], 58, false, 'Mix and match any two cases. Free delivery over TT$150.', 'Online'],
  ['kaiso-comedy', 'Kaiso Comedy Club', 'Friday stand-up night', 'events', 100, 150, 'POS & West', 'St. James', 'Western Main Rd, St. James', '2026-11-15', '2026-11-27', 3, 'Get Tickets', 'In-store', 'comedian on stage', ['events', 'date', 'weekend'], 77, false, 'Five local comics, one strict host, and a bar that stays open late.', 'Fri 27 Nov · 8:30pm'],
  ['zipline-family', 'Treetop Trail TT', 'Family zipline pass: 2 adults + 2 kids', 'experiences', 520, 680, 'POS & West', 'Chaguaramas', 'Tucker Valley Rd, Chaguaramas', '2026-11-01', '2026-12-31', 9, 'Book Now', 'In-store', 'zipline through rainforest', ['family', 'outdoor', 'weekend'], 70, false, 'Seven lines through the Tucker Valley canopy. Kids from age 6.', 'Wed–Sun · 9am–4pm'],
  ['lopinot-walk', 'Lopinot Village Collective', 'Free heritage walk + cocoa tasting', 'experiences', 0, 0, 'East', 'Lopinot', 'Lopinot Historical Complex', '2026-11-23', '2026-11-29', 1, 'View Offer', 'In-store', 'cocoa pods and village path', ['free', 'outdoor', 'family', 'weekend', 'budget'], 66, false, 'A two-hour walk through the valley with a local guide, ending with fresh cocoa tea.', 'Sun 29 Nov · 9am'],
  ['roti-friday', 'Roti Republic', 'Two buss-up-shut rotis, Fridays', 'food', 55, 70, 'South', 'San Fernando', 'Cipero St, San Fernando', '2026-11-20', '2026-11-27', 0, 'Show In Store', 'In-store', 'buss-up-shut and curry', ['food', 'budget'], 87, false, 'Curry chicken, goat or channa and aloo. Come before noon.', 'Fridays · 10am–3pm'],
  ['skyline-cocktails', 'Skyline Lounge', '2-for-1 cocktails at sunset', 'food', 90, 180, 'POS & West', 'Port of Spain', 'Rooftop, Wrightson Rd, Port of Spain', '2026-11-16', '2026-11-24', 4, 'Show In Store', 'In-store', 'cocktails on a rooftop', ['date'], 81, false, 'Harbour views and a sorrel spritz worth the trip downtown.', 'Daily · 5pm–7pm'],
  ['still-waters-spa', 'Still Waters Spa', 'Full-day spa package', 'beauty', 450, 600, 'Tobago', 'Crown Point', 'Store Bay Local Rd, Crown Point', '2026-11-01', '2026-12-23', 8, 'Book Now', 'In-store', 'spa stones and towels', ['date'], 64, false, 'Massage, facial and lunch by the pool.', 'Daily · 9am–6pm'],
  ['outdoor-movie', 'Cinema Under Stars', 'Free outdoor movie night: family classics', 'events', 0, 0, 'East', 'St. Augustine', 'Campus lawn, St. Augustine', '2026-11-23', '2026-11-28', 0, 'Get Tickets', 'In-store', 'projector screen on a lawn', ['free', 'family', 'weekend', 'events', 'budget'], 72, false, 'Bring a blanket. Free tickets cap numbers so everyone gets a good spot.', 'Sat 28 Nov · 6:30pm'],
  ['pages-pepper', 'Pages & Pepper', 'Local authors box set: 4 books', 'shopping', 160, 200, 'POS & West', 'Woodbrook', 'Tragarete Rd, Woodbrook', '2026-11-19', '2026-12-10', 2, 'Get Deal', 'Online & in-store', 'stack of paperbacks', [], 55, false, 'Four Caribbean novels picked by the shop, gift-wrapped free.', 'Mon–Sat'],
];

export interface Deal {
  id: string; biz: string; title: string; cat: CatKey; price: number; was: number; region: Region; area: string; address: string;
  action: Action; format: Format; img: string; tags: string[]; hot: number; featured: boolean; blurb: string; when: string;
  added: number; daysLeft: number; startsIn: number; pct: number;
  catLabel: string; color: string; priceLabel: string; wasLabel: string; saveLabel: string;
  endsLabel: string; endsShort: string; endingSoon: boolean; isNew: boolean; addedLabel: string;
  validity: string; checked: string; destLabel: string; destShort: string; claimSteps: string[]; terms: string[]; hours: string; code: string;
}

export const DEALS: Deal[] = RAW.map((r, i) => {
  const [id, biz, title, cat, price, was, region, area, address, start, end, added, action, format, img, tags, hot, featured, blurb, when] = r;
  const s = pd(start), e = pd(end);
  const daysLeft = Math.round((+e - +TODAY) / DAY), startsIn = Math.round((+s - +TODAY) / DAY);
  const pct = was ? Math.round(((was - price) / was) * 100) : 0;
  const t = [...tags];
  if (price <= 100 && !t.includes('budget')) t.push('budget');
  return {
    id, biz, title, cat, price, was, region, area, address, action, format, img, tags: t, hot, featured, blurb, when, added, daysLeft, startsIn, pct,
    catLabel: CATS[cat].label,
    color: CATS[cat].color,
    priceLabel: price === 0 ? 'FREE' : 'TT$' + price,
    wasLabel: was ? 'TT$' + was : '',
    saveLabel: was ? `Save TT$${was - price} (${pct}%)` : '',
    endsLabel: startsIn > 0 ? `Starts ${fmt(s)}` : daysLeft <= 0 ? 'Ends today' : daysLeft === 1 ? 'Ends tomorrow' : daysLeft <= 7 ? `Ends in ${daysLeft} days` : `Valid until ${fmt(e)}`,
    endsShort: daysLeft <= 0 ? 'ENDS TODAY' : daysLeft === 1 ? 'ENDS TOMORROW' : `${daysLeft} DAYS LEFT`,
    endingSoon: daysLeft <= 3 && startsIn <= 0,
    isNew: added <= 1,
    addedLabel: added === 0 ? 'Added today' : added === 1 ? 'Added yesterday' : `Added ${added} days ago`,
    validity: `${fmt(s)} – ${fmt(e)} 2026`,
    checked: fmt(new Date(+TODAY - Math.max(0, added) * DAY)) + ' 2026',
    destLabel: DEST[action][0],
    destShort: DEST[action][1],
    claimSteps: CLAIM[action](biz),
    terms: price === 0 ? ['Free entry. Space is first come, first served.', 'Organiser may change times due to weather.'] : TERMS,
    hours: 'Hours: ' + when,
    code: 'ETT-' + (1123 + i * 7),
  };
});

export type CollKey = 'weekend' | 'free' | 'date' | 'family' | 'food' | 'outdoor' | 'events' | 'budget';
export const COLLS: { k: CollKey; label: string; color: string; intro: string }[] = [
  { k: 'weekend', label: 'This Weekend', color: TOMATO, intro: 'Fri 27 – Sun 29 Nov. The best of what’s on, picked by our team.' },
  { k: 'free', label: 'Free Things to Do', color: LIME, intro: 'Good days out that cost nothing.' },
  { k: 'date', label: 'Date Ideas', color: PINK, intro: 'From rooftop sunsets to reef kayaks.' },
  { k: 'family', label: 'Family Activities', color: SUN, intro: 'Plans that work for every age in the car.' },
  { k: 'food', label: 'Food & Dining', color: ORANGE, intro: 'Where to eat this week, and what to order.' },
  { k: 'outdoor', label: 'Outdoor', color: SKY, intro: 'Beaches, trails and fresh air on both islands.' },
  { k: 'events', label: 'Events & Entertainment', color: LILAC, intro: 'Shows, limes and live music.' },
  { k: 'budget', label: 'Under TT$100', color: LIME, intro: 'Big plans, small spend.' },
];

export const inColl = (k: CollKey, all: Deal[] = DEALS) =>
  all.filter((d) => d.tags.includes(k) || (k === 'free' && d.price === 0)).sort((a, b) => b.hot - a.hot);

// ---------- Filtering ----------

export interface Filters {
  q: string;
  cat: 'all' | CatKey;
  region: 'all' | Region;
  price: 'any' | 'free' | 'u50' | 'm150' | 'm300' | 'o300';
  disc: 'any' | '20' | '30' | '50';
  added: 'any' | 'today' | 'week';
  ends: 'any' | '3' | '7';
  format: 'any' | 'store' | 'online';
  sort: 'popular' | 'new' | 'ending' | 'saving' | 'price';
}

export const DEFAULT_FILTERS: Filters = { q: '', cat: 'all', region: 'all', price: 'any', disc: 'any', added: 'any', ends: 'any', format: 'any', sort: 'popular' };

export const FILTER_KEYS = ['region', 'price', 'disc', 'added', 'ends', 'format'] as const;

const PRICE: Record<string, (d: Deal) => boolean> = {
  free: (d) => d.price === 0,
  u50: (d) => d.price > 0 && d.price < 50,
  m150: (d) => d.price >= 50 && d.price <= 150,
  m300: (d) => d.price > 150 && d.price <= 300,
  o300: (d) => d.price > 300,
};

const SORT: Record<Filters['sort'], (a: Deal, b: Deal) => number> = {
  popular: (a, b) => b.hot - a.hot,
  new: (a, b) => a.added - b.added,
  ending: (a, b) => a.daysLeft - b.daysLeft,
  saving: (a, b) => b.pct - a.pct,
  price: (a, b) => a.price - b.price,
};

export function filterDeals(all: Deal[], f: Filters): Deal[] {
  let r = all;
  if (f.q) {
    const q = f.q.toLowerCase();
    r = r.filter((d) => [d.biz, d.title, d.area, d.region, d.catLabel, d.price === 0 ? 'free' : ''].join(' ').toLowerCase().includes(q));
  }
  if (f.cat !== 'all') r = r.filter((d) => d.cat === f.cat);
  if (f.region !== 'all') r = r.filter((d) => (f.region === 'Online' ? d.format !== 'In-store' : d.region === f.region));
  if (PRICE[f.price]) r = r.filter(PRICE[f.price]);
  if (f.disc !== 'any') r = r.filter((d) => d.pct >= +f.disc);
  if (f.added === 'today') r = r.filter((d) => d.added === 0);
  else if (f.added === 'week') r = r.filter((d) => d.added <= 7);
  if (f.ends === '3') r = r.filter((d) => d.daysLeft <= 3);
  else if (f.ends === '7') r = r.filter((d) => d.daysLeft <= 7);
  if (f.format === 'store') r = r.filter((d) => d.format !== 'Online');
  else if (f.format === 'online') r = r.filter((d) => d.format !== 'In-store');
  return [...r].sort(SORT[f.sort]);
}

export const dealUrl = (id: string) => `https://eventory.tt/deal/${id}`;
export const whatsappShareUrl = (d: Deal) =>
  'https://wa.me/?text=' + encodeURIComponent(`${d.title} at ${d.biz}, ${d.priceLabel}. Found it on EventoryTT: ${dealUrl(d.id)}`);
