// Deal content and derived fields. All offers are real and checked by the EventoryTT team.

/** "Today" for labels such as "Added today" and "Ends in N days". */
export const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const DAY = 864e5;
const daysSince = (d: Date) => Math.max(0, Math.round((+TODAY - +d) / DAY));
const addedLabelFor = (n: number) => (n === 0 ? 'Added today' : n === 1 ? 'Added yesterday' : `Added ${n} days ago`);
/** Next Friday–Sunday (or the current one, if it's already the weekend). */
const weekendLabel = (() => {
  const dow = TODAY.getDay();
  const fri = new Date(TODAY); fri.setDate(TODAY.getDate() + (dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow));
  const sun = new Date(fri); sun.setDate(fri.getDate() + 2);
  const m = (d: Date) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  return fri.getMonth() === sun.getMonth() ? `Fri ${fri.getDate()} – Sun ${sun.getDate()} ${m(sun)}` : `Fri ${fri.getDate()} ${m(fri)} – Sun ${sun.getDate()} ${m(sun)}`;
})();
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const fmt = (d: Date) => d.getDate() + ' ' + MON[d.getMonth()];
export const todayLabel = `${DOW[TODAY.getDay()]} ${fmt(TODAY)}`;

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

/** Real deals can be islandwide chains, which match every region filter. */
export type DealRegion = Region | 'Islandwide';

export interface Deal {
  id: string; biz: string; title: string; cat: CatKey; price: number; was: number; region: DealRegion; area: string; address: string;
  action: Action; format: Format; img: string; tags: string[]; hot: number; featured: boolean; blurb: string; when: string;
  added: number; daysLeft: number; startsIn: number; pct: number;
  catLabel: string; color: string; priceLabel: string; wasLabel: string; saveLabel: string;
  endsLabel: string; endsShort: string; endingSoon: boolean; isNew: boolean; addedLabel: string;
  validity: string; checked: string; destLabel: string; destShort: string; claimSteps: string[]; terms: string[]; hours: string; code: string;
  /** true for fictional demo content; real offers are false. */
  demo: boolean;
  /** Real product photo, served from /public. Deals without one show a striped placeholder. */
  image?: string;
  /** Shape of the photo when it isn't square, e.g. '5 / 2' for wide banners. */
  imageRatio?: string;
  /** Short campaign tag taken from the business's own promo, e.g. 'Black Friday Week'. */
  promo?: string;
  /** The business's own page for the offer. When set, the claim button opens it. */
  url?: string;
  /** What the deal is, for browsing ("Pizza", "Burgers"…). */
  kind?: Kind;
  /** Who it feeds: one person, two or three sharing, or a family. */
  size?: Size;
}

export type Kind = 'pizza' | 'burger' | 'sandwich';
export const KINDS: Record<Kind, string> = { pizza: 'Pizza', burger: 'Burgers', sandwich: 'Sandwiches' };
export type Size = 'solo' | 'share' | 'family';
export const SIZES: Record<Size, string> = { solo: 'Just for me', share: 'For 2–3', family: 'Family meals' };

// ---------- Real offers ----------

/**
 * Mario's Pizzeria offers, checked against mymarios.com on 23 Nov 2026.
 * Mario's publishes no end dates and no "was" prices, so neither is shown (labels left empty).
 * `live: false` holds an offer back until its product page can be confirmed.
 */
type MariosRow = [id: string, title: string, price: number, description: string, conditions: string, slug: string, hot: number, live: boolean, kind: Kind, size: Size, extraTags?: string[]];
const MARIOS: MariosRow[] = [
  ['MAR-001', 'Burger and Slushie Combo', 43, 'Classic or veggie burger with any slushie.', '', 'burger-and-slushie-combo', 70, true, 'burger', 'solo'],
  ['MAR-002', 'Delivery Feast', 249, 'Two family specialty pizzas and Triple Cheese Stix.', 'Delivery only; delivery fee included.', 'delivery-feast', 84, true, 'pizza', 'family', ['family']],
  ['MAR-003', 'Delivery Lime', 175, 'Family specialty pizza, 2L soft drink and Triple Cheese Stix.', 'Delivery only; delivery fee included.', 'delivery-lime', 94, true, 'pizza', 'family', ['family', 'weekend']],
  ['MAR-004', 'Three Family Specialty Pizzas (Delivery Only)', 299, 'Three family specialty pizzas.', 'Delivery only; delivery fee included.', 'three-family-specialty-pizzas-copy-d629e8b9', 76, true, 'pizza', 'family', ['family']],
  ['MAR-005', 'Family Specialty and Triple Cheese Stix', 175, 'Family specialty pizza and Triple Cheese Stix.', '', 'cheesy-stix-combo-copy-daeec350', 80, true, 'pizza', 'family', ['family']],
  ['MAR-006', 'Oven Toasted Sandwich and Drink', 59, 'Any oven-toasted sandwich and a 16oz drink.', '', 'oven-toasted-sandwich-and-drink', 68, true, 'sandwich', 'solo'],
  ['MAR-007', 'Personal Two Topping Pizza, Small Snack and a Drink', 39, 'Personal pizza with two chosen toppings, small snack and 16oz drink.', '', 'personal-two-topping-pizza-small-snack-and-a-drink', 91, true, 'pizza', 'solo'],
  ['MAR-008', 'Three Burgers and Three Drinks', 99, 'Three classic or veggie burgers and three 16oz drinks.', '', 'two-burgers-and-two-drinks-copy-03ab0995', 82, true, 'burger', 'share', ['family']],
  ['MAR-009', 'Three Family Specialty Pizzas', 299, 'Three family specialty pizzas.', '', 'three-family-specialty-pizzas', 78, true, 'pizza', 'family', ['family']],
  ['MAR-010', 'Two Burgers and Two Drinks', 69, 'Two classic or veggie burgers and two 16oz drinks.', '', 'two-burgers-and-two-drinks', 86, true, 'burger', 'share', ['date']],
  ['MAR-011', 'Two Family Specialty Pizzas', 210, 'Two family specialty pizzas.', '', 'two-family-specilaty-pizzas', 79, true, 'pizza', 'family', ['family']],
  ['MAR-012', 'Two Medium Specialty Pizzas', 175, 'Two medium specialty pizzas.', '', 'two-medium-specialty-pizzas', 74, true, 'pizza', 'share'],
  ['MAR-013', 'Two Sandwiches and Two Drinks', 110, 'Two oven-toasted sandwiches and two 16oz drinks.', '', 'two-sandwiches-and-two-drinks', 72, true, 'sandwich', 'share', ['date']],
];

/** The day the Mario's offers were checked against mymarios.com. */
const MARIOS_CHECKED = new Date(2026, 10, 23);

const MARIOS_DEALS: Deal[] = MARIOS.filter((r) => r[7]).map(([code, title, price, description, conditions, slug, hot, , kind, size, extraTags = []]) => {
  const added = daysSince(MARIOS_CHECKED);
  const delivery = conditions.startsWith('Delivery only');
  const biz = "Mario's";
  const tags = ['food', ...extraTags];
  if (price <= 100) tags.push('budget');
  return {
    id: 'marios-' + code.slice(4), biz, title, cat: 'food', kind, size, price, was: 0, region: 'Islandwide',
    area: delivery ? 'Delivery islandwide' : 'Islandwide · delivery & branches',
    address: "Mario's branches across Trinidad & Tobago. Order at mymarios.com.",
    action: 'Get Deal', format: delivery ? 'Online' : 'Online & in-store', img: '', tags, hot, featured: code === 'MAR-003',
    blurb: description, when: delivery ? 'Delivery' : 'Delivery or pickup', added, daysLeft: Infinity, startsIn: 0, pct: 0,
    catLabel: CATS.food.label, color: CATS.food.color,
    priceLabel: 'TT$' + price, wasLabel: '', saveLabel: '',
    endsLabel: '', endsShort: '', endingSoon: false, isNew: added <= 2, addedLabel: addedLabelFor(added),
    validity: '',
    checked: `${fmt(MARIOS_CHECKED)} ${MARIOS_CHECKED.getFullYear()}`,
    destLabel: 'Opens the order page on mymarios.com', destShort: 'mymarios.com',
    claimSteps: [
      'Tap “Get Deal” to open this offer on mymarios.com.',
      delivery ? 'Add your delivery address. The delivery fee is already in the price.' : 'Choose delivery or pickup and pick your options.',
      "Pay Mario's directly. EventoryTT never takes payment.",
    ],
    terms: [
      ...(conditions ? [conditions] : []),
      `${description} Options as listed on Mario's site.`,
      'Confirm the price on mymarios.com before you order.',
    ],
    hours: "Hours: see mymarios.com for your nearest branch",
    code: code,
    demo: false,
    image: `/deals/marios/${code}.webp`,
    url: `https://www.mymarios.com/product/${slug}`,
  };
});

/**
 * Domino's Trinidad & Tobago coupon deals, from Domino's own promo banners (24 Nov 2026).
 * All three use the order link Domino's supplied; it opens dominos.tt with coupon BLFRIPAN.
 * No end dates or "was" prices are published, so neither is shown.
 */
const DOMINOS_CHECKED = new Date(2026, 10, 24);
const DOMINOS_URL = 'https://www.dominos.tt/en/pages/order/?couponCode_0=BLFRIPAN&partnerCode=DOMINOS&so=hp#!/locations/search/';
type DominosRow = [code: string, title: string, price: number, description: string, conditions: string[], hot: number, size: Size, featured: boolean];
const DOMINOS: DominosRow[] = [
  ['DOM-001', 'Any 1-Topping Pan Pizza', 99, 'Any 1-topping pan pizza.', ['Black Friday Week offer.', 'Free slice sauce while stocks last.', 'Coupon BLFRIPAN is applied when you order through the link.'], 97, 'share', true],
  ['DOM-002', 'The Big DeXL: XL 1-Topping Pizza, Bread Bites & 2L Drink', 129, 'XL 1-topping hand tossed pizza, bread bites and a 2L drink.', [], 89, 'family', false],
  ['DOM-003', 'The Big DeXL: XL 16" 1-Topping Pizza', 99, 'XL 16-inch 1-topping pizza.', [], 88, 'family', false],
];

const DOMINOS_DEALS: Deal[] = DOMINOS.map(([code, title, price, description, conditions, hot, size, featured]) => {
  const added = daysSince(DOMINOS_CHECKED);
  const biz = "Domino's";
  const tags = ['food', ...(size === 'family' ? ['family'] : []), ...(price <= 100 ? ['budget'] : [])];
  return {
    id: 'dominos-' + code.slice(4), biz, title, cat: 'food', kind: 'pizza', size, price, was: 0, region: 'Islandwide',
    area: 'Islandwide · delivery & carryout',
    address: "Domino's stores across Trinidad & Tobago. Order at dominos.tt.",
    action: 'Get Deal', format: 'Online & in-store', img: '', tags, hot, featured,
    blurb: description, when: 'Delivery or carryout', added, daysLeft: Infinity, startsIn: 0, pct: 0,
    catLabel: CATS.food.label, color: CATS.food.color,
    priceLabel: 'TT$' + price, wasLabel: '', saveLabel: '',
    endsLabel: '', endsShort: '', endingSoon: false, isNew: added <= 2, addedLabel: addedLabelFor(added),
    validity: '',
    checked: `${fmt(DOMINOS_CHECKED)} ${DOMINOS_CHECKED.getFullYear()}`,
    destLabel: 'Opens ordering on dominos.tt', destShort: 'dominos.tt',
    claimSteps: [
      'Tap “Get Deal” to open ordering on dominos.tt.',
      'Pick your nearest store, then choose delivery or carryout.',
      code === 'DOM-001' ? 'Choose your pan pizza and topping. The coupon is already applied.' : 'Choose this deal from the coupons and add it to your order.',
      "Pay Domino's directly. EventoryTT never takes payment.",
    ],
    terms: [
      ...conditions,
      'Available online and in store, for delivery or carryout.',
      'Confirm the price on dominos.tt before you order.',
    ],
    hours: "Hours: see dominos.tt for your nearest store",
    code,
    demo: false,
    image: `/deals/dominos/${code}.webp`,
    imageRatio: '5 / 2',
    promo: code === 'DOM-001' ? 'Black Friday Week' : undefined,
    url: DOMINOS_URL,
  };
});

export const DEALS: Deal[] = [...DOMINOS_DEALS, ...MARIOS_DEALS];

// ---------- Business directory ----------

export interface Business {
  name: string; cat: CatKey; about: string; area: string; website: string; websiteLabel: string; logo?: string;
}

/** Every business with at least one live deal should have an entry here. */
export const BUSINESSES: Business[] = [
  {
    name: "Mario's", cat: 'food', about: 'Pizza, burgers and oven-toasted sandwiches. Delivery and pickup from branches across Trinidad & Tobago.',
    area: 'Islandwide', website: 'https://www.mymarios.com', websiteLabel: 'mymarios.com', logo: '/deals/marios/MAR-002.webp',
  },
  {
    name: "Domino's", cat: 'food', about: 'Pizza, bread bites and sides. Delivery or carryout from stores across Trinidad & Tobago.',
    area: 'Islandwide', website: 'https://www.dominos.tt', websiteLabel: 'dominos.tt', logo: '/deals/dominos/logo.webp',
  },
];

export type CollKey = 'weekend' | 'free' | 'date' | 'family' | 'food' | 'outdoor' | 'events' | 'budget';
export const COLLS: { k: CollKey; label: string; color: string; intro: string }[] = [
  { k: 'weekend', label: 'This Weekend', color: TOMATO, intro: `${weekendLabel}. The best of what’s on, picked by our team.` },
  { k: 'free', label: 'Free Things to Do', color: LIME, intro: 'Good days out that cost nothing.' },
  { k: 'date', label: 'Date Ideas', color: PINK, intro: 'Easy plans for two.' },
  { k: 'family', label: 'Family Activities', color: SUN, intro: 'Plans that work for every age in the car.' },
  { k: 'food', label: 'Food & Dining', color: ORANGE, intro: 'Where to eat this week, and what to order.' },
  { k: 'outdoor', label: 'Outdoor', color: SKY, intro: 'Beaches, trails and fresh air on both islands.' },
  { k: 'events', label: 'Events & Entertainment', color: LILAC, intro: 'Shows, limes and live music.' },
  { k: 'budget', label: 'Under TT$100', color: LIME, intro: 'Big plans, small spend.' },
];

export const inColl = (k: CollKey, all: Deal[] = DEALS) =>
  all.filter((d) => d.tags.includes(k) || (k === 'free' && d.price === 0)).sort((a, b) => b.hot - a.hot);

/** Collections and categories that currently have at least one deal; empty ones are hidden. */
export const ACTIVE_COLLS = COLLS.filter((c) => inColl(c.k).length > 0);
export const ACTIVE_CATS = (Object.keys(CATS) as CatKey[]).filter((k) => DEALS.some((d) => d.cat === k));

// ---------- Filtering ----------

export interface Filters {
  q: string;
  cat: 'all' | CatKey;
  region: 'all' | Region;
  price: 'any' | 'free' | 'u50' | 'u100' | 'u200' | 'o200';
  kind: 'any' | Kind;
  size: 'any' | Size;
  biz: string;
  disc: 'any' | '20' | '30' | '50';
  added: 'any' | 'today' | 'week';
  ends: 'any' | '3' | '7';
  format: 'any' | 'store' | 'online';
  sort: 'popular' | 'new' | 'ending' | 'saving' | 'price' | 'priceDesc';
}

export const DEFAULT_FILTERS: Filters = { q: '', cat: 'all', region: 'all', price: 'any', kind: 'any', size: 'any', biz: 'any', disc: 'any', added: 'any', ends: 'any', format: 'any', sort: 'popular' };

/** Filters shown in the filter panel (category, search and sort live elsewhere). */
export const FILTER_KEYS = ['price', 'kind', 'size', 'format', 'biz', 'region', 'disc', 'added', 'ends'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

const PRICE: Record<string, (d: Deal) => boolean> = {
  free: (d) => d.price === 0,
  u50: (d) => d.price <= 50,
  u100: (d) => d.price <= 100,
  u200: (d) => d.price <= 200,
  o200: (d) => d.price > 200,
};

const SORT: Record<Filters['sort'], (a: Deal, b: Deal) => number> = {
  popular: (a, b) => b.hot - a.hot,
  new: (a, b) => a.added - b.added,
  ending: (a, b) => a.daysLeft - b.daysLeft,
  saving: (a, b) => b.pct - a.pct,
  price: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
};

/** Words a shopper might type that should match a deal. */
const searchText = (d: Deal) =>
  [d.biz, d.title, d.promo, d.blurb, d.area, d.region, d.catLabel, d.kind && KINDS[d.kind], d.size && SIZES[d.size], d.format !== 'In-store' ? 'delivery' : '', d.price === 0 ? 'free' : '']
    .join(' ').toLowerCase();

export function filterDeals(all: Deal[], f: Filters, skip?: FilterKey): Deal[] {
  let r = all;
  if (f.q) {
    const words = f.q.toLowerCase().split(/\s+/).filter(Boolean).map((w) => w.replace(/s$/, ''));
    r = r.filter((d) => { const t = searchText(d); return words.every((w) => t.includes(w)); });
  }
  if (skip !== 'kind' && f.kind !== 'any') r = r.filter((d) => d.kind === f.kind);
  if (skip !== 'size' && f.size !== 'any') r = r.filter((d) => d.size === f.size);
  if (skip !== 'biz' && f.biz !== 'any') r = r.filter((d) => d.biz === f.biz);
  if (f.cat !== 'all') r = r.filter((d) => d.cat === f.cat);
  if (skip !== 'region' && f.region !== 'all') r = r.filter((d) => (f.region === 'Online' ? d.format !== 'In-store' : d.region === f.region || d.region === 'Islandwide'));
  if (skip !== 'price' && PRICE[f.price]) r = r.filter(PRICE[f.price]);
  if (skip !== 'disc' && f.disc !== 'any') r = r.filter((d) => d.pct >= +f.disc);
  if (skip === 'added') { /* counting */ } else if (f.added === 'today') r = r.filter((d) => d.added === 0);
  else if (f.added === 'week') r = r.filter((d) => d.added <= 7);
  if (skip === 'ends') { /* counting */ } else if (f.ends === '3') r = r.filter((d) => d.daysLeft <= 3);
  else if (f.ends === '7') r = r.filter((d) => d.daysLeft <= 7);
  if (skip === 'format') { /* counting */ } else if (f.format === 'store') r = r.filter((d) => d.format !== 'Online');
  else if (f.format === 'online') r = r.filter((d) => d.format !== 'In-store');
  return [...r].sort(SORT[f.sort]);
}

export const dealUrl = (id: string) => `https://eventory.tt/deal/${id}`;
export const whatsappShareUrl = (d: Deal) =>
  'https://wa.me/?text=' + encodeURIComponent(`${d.title} at ${d.biz}, ${d.priceLabel}. Found it on EventoryTT: ${dealUrl(d.id)}`);
