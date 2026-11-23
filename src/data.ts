// Deal content and derived fields. All offers are real and checked by the EventoryTT team.

/** "Today" for labels such as "Added today" and "Ends in N days". */
export const TODAY = new Date(2026, 10, 23);
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
  /** The business's own page for the offer. When set, the claim button opens it. */
  url?: string;
}

// ---------- Real offers ----------

/**
 * Mario's Pizzeria offers, checked against mymarios.com on 23 Nov 2026.
 * Mario's publishes no end dates and no "was" prices, so neither is shown (labels left empty).
 * `live: false` holds an offer back until its product page can be confirmed.
 */
type MariosRow = [id: string, title: string, price: number, description: string, conditions: string, slug: string, hot: number, live: boolean, extraTags?: string[]];
const MARIOS: MariosRow[] = [
  ['MAR-001', 'Burger and Slushie Combo', 43, 'Classic or veggie burger with any slushie.', '', 'burger-and-slushie-combo', 70, false],
  ['MAR-002', 'Delivery Feast', 249, 'Two family specialty pizzas and Triple Cheese Stix.', 'Delivery only; delivery fee included.', 'delivery-feast', 84, true, ['family']],
  ['MAR-003', 'Delivery Lime', 175, 'Family specialty pizza, 2L soft drink and Triple Cheese Stix.', 'Delivery only; delivery fee included.', 'delivery-lime', 94, true, ['family', 'weekend']],
  ['MAR-004', 'Three Family Specialty Pizzas (Delivery Only)', 299, 'Three family specialty pizzas.', 'Delivery only; delivery fee included.', 'three-family-specialty-pizzas-copy-d629e8b9', 76, true, ['family']],
  ['MAR-005', 'Family Specialty and Triple Cheese Stix', 175, 'Family specialty pizza and Triple Cheese Stix.', '', 'cheesy-stix-combo-copy-daeec350', 80, true, ['family']],
  ['MAR-006', 'Oven Toasted Sandwich and Drink', 59, 'Any oven-toasted sandwich and a 16oz drink.', '', 'oven-toasted-sandwich-and-drink', 68, false],
  ['MAR-007', 'Personal Two Topping Pizza, Small Snack and a Drink', 39, 'Personal pizza with two chosen toppings, small snack and 16oz drink.', '', 'personal-two-topping-pizza-small-snack-and-a-drink', 91, true],
  ['MAR-008', 'Three Burgers and Three Drinks', 99, 'Three classic or veggie burgers and three 16oz drinks.', '', 'two-burgers-and-two-drinks-copy-03ab0995', 82, true, ['family']],
  ['MAR-009', 'Three Family Specialty Pizzas', 299, 'Three family specialty pizzas.', '', 'three-family-specialty-pizzas', 78, true, ['family']],
  ['MAR-010', 'Two Burgers and Two Drinks', 69, 'Two classic or veggie burgers and two 16oz drinks.', '', 'two-burgers-and-two-drinks', 86, true, ['date']],
  ['MAR-011', 'Two Family Specialty Pizzas', 210, 'Two family specialty pizzas.', '', 'two-family-specilaty-pizzas', 79, true, ['family']],
  ['MAR-012', 'Two Medium Specialty Pizzas', 175, 'Two medium specialty pizzas.', '', 'two-medium-specialty-pizzas', 74, true],
  ['MAR-013', 'Two Sandwiches and Two Drinks', 110, 'Two oven-toasted sandwiches and two 16oz drinks.', '', 'two-sandwiches-and-two-drinks', 72, true, ['date']],
];

const MARIOS_DEALS: Deal[] = MARIOS.filter((r) => r[7]).map(([code, title, price, description, conditions, slug, hot, , extraTags = []]) => {
  const delivery = conditions.startsWith('Delivery only');
  const biz = "Mario's";
  const tags = ['food', ...extraTags];
  if (price <= 100) tags.push('budget');
  return {
    id: 'marios-' + code.slice(4), biz, title, cat: 'food', price, was: 0, region: 'Islandwide',
    area: delivery ? 'Delivery islandwide' : 'Islandwide · delivery & branches',
    address: "Mario's branches across Trinidad & Tobago. Order at mymarios.com.",
    action: 'Get Deal', format: delivery ? 'Online' : 'Online & in-store', img: '', tags, hot, featured: code === 'MAR-003',
    blurb: description, when: delivery ? 'Delivery' : 'Delivery or pickup', added: 0, daysLeft: Infinity, startsIn: 0, pct: 0,
    catLabel: CATS.food.label, color: CATS.food.color,
    priceLabel: 'TT$' + price, wasLabel: '', saveLabel: '',
    endsLabel: '', endsShort: '', endingSoon: false, isNew: true, addedLabel: 'Added today',
    validity: '',
    checked: fmt(TODAY) + ' 2026',
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

export const DEALS: Deal[] = MARIOS_DEALS;

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
];

export type CollKey = 'weekend' | 'free' | 'date' | 'family' | 'food' | 'outdoor' | 'events' | 'budget';
export const COLLS: { k: CollKey; label: string; color: string; intro: string }[] = [
  { k: 'weekend', label: 'This Weekend', color: TOMATO, intro: 'Fri 27 – Sun 29 Nov. The best of what’s on, picked by our team.' },
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
  if (f.region !== 'all') r = r.filter((d) => (f.region === 'Online' ? d.format !== 'In-store' : d.region === f.region || d.region === 'Islandwide'));
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
