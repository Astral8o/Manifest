import { useState, useEffect, useRef } from 'react';
import {
  LOCATIONS,
  GROUPS,
  FIELDS,
  FIELDS_DEFAULT,
  money,
} from './data';
import {
  fetchCatalog,
  submitInquiry,
  submitVendorReview,
  sendMagicLink,
  submitPlanningRequest,
  adminListVendors,
  adminSetPublished,
  adminCreateVendor,
  createVendorAccount,
  submitVendorOnboarding,
  uploadVendorMedia,
} from './catalog';
import { supabase } from './supabaseClient';
import heroPhoto from './assets/hero-photo.jpg';
import cateringPhoto from './assets/categories/catering.jpg';
import venuesPhoto from './assets/categories/venues.jpg';
import rentalsPhoto from './assets/categories/rentals.jpg';
import productionPhoto from './assets/categories/production.jpg';
import photographyPhoto from './assets/categories/photography.jpg';
import entertainmentPhoto from './assets/categories/entertainment.jpg';

const CATEGORY_PHOTOS = {
  'CAT.01': cateringPhoto,
  'CAT.02': venuesPhoto,
  'CAT.04': rentalsPhoto,
  'CAT.06': productionPhoto,
  'CAT.08': photographyPhoto,
  'CAT.09': entertainmentPhoto,
};

const EVENT_TYPES = [
  { key: 'wedding', label: 'Wedding' },
  { key: 'corporate', label: 'Corporate Event' },
  { key: 'launch', label: 'Product Launch' },
  { key: 'babyShower', label: 'Baby Shower' },
  { key: 'familyDay', label: 'Family Day' },
  { key: 'birthday', label: 'Birthday Party' },
  { key: 'other', label: 'Other' },
];

const MONO = "'IBM Plex Mono', monospace";
const SANS = 'Manrope, sans-serif';
const DISPLAY = 'Archivo, Helvetica, sans-serif';
const DISPLAY_BLACK = "'Archivo Black', Archivo, sans-serif";
const ACCOUNT_KEY = 'eventoryAccount';
const ADMIN_EMAIL = 'astral.ochoa@hotmail.com';
// Fallback so pages that assume "there's always at least one vendor" don't
// crash on a fresh catalog with zero vendors published yet (e.g. the admin
// tool has to be usable before any vendor exists).
const EMPTY_SUPPLIER = {
  id: '',
  code: '',
  name: '',
  city: '',
  region: '',
  desc: '',
  bio: '',
  tags: [],
  minGroup: 0,
  lead: 0,
  radius: 0,
  rating: '',
  response: '',
  priceOnRequest: false,
  verified: false,
  email: '',
  phone: '',
  instagram: '',
  facebook: '',
  logoUrl: '',
  coverUrl: '',
  tiktok: '',
  mapLink: '',
  subcategory: '',
  contactPerson: '',
  country: '',
  startingPrice: null,
  promos: [],
  reviews: [],
  faqs: [],
  gallery: [],
  policies: [],
  menuItems: [],
  products: [],
};
const DEFAULT_FAQ_TEMPLATES = [
  { q: 'What types of events do you handle?', a: '' },
  { q: 'How far in advance should I book?', a: '' },
  { q: 'Can packages be customized?', a: '' },
  { q: 'Is a deposit required?', a: '' },
];
const SUGGESTED_ALBUMS = ['Weddings', 'Birthdays', 'Corporate Events', 'Baby Showers', 'Family Day', 'Graduations'];
const SUGGESTED_PACKAGES = ['Basic Package', 'Standard Package', 'Premium Package'];
const SUGGESTED_FAQS = [
  'What types of events do you cater to?',
  'How far in advance should I book?',
  'Can packages be customized?',
  'Is a deposit required to confirm a booking?',
  'Do you travel outside your base location?',
  'What happens if I need to reschedule?',
];
const SUGGESTED_POLICIES = [
  'Booking & Reservation Policy',
  'Payment Policy',
  'Deposit Policy',
  'Cancellation Policy',
  'Rescheduling Policy',
  'Guest Count & Final Numbers Policy',
  'Setup & Access Policy',
  'Health & Safety Policy',
];
const POST_AUTH_RETURN_KEY = 'eventoryPostAuthReturn';
const PROMO_ACCENT = '#FF5A36';
const ACCENT = '#E0512B';
const CTA_ACCENT = '#B8401F';
const ACCENT_ON = '#FFFFFF';
const ACCENT_ON_SOFT = 'rgba(255,255,255,0.72)';
const ACCENT_ON_MUTED = 'rgba(255,255,255,0.32)';
const PRICE_FILTERS = [
  { label: 'Any price', test: () => true },
  { label: 'Under TT$500', test: (v) => v !== null && v < 500 },
  { label: 'TT$500–TT$3,000', test: (v) => v !== null && v >= 500 && v <= 3000 },
  { label: 'TT$3,000+', test: (v) => v !== null && v > 3000 },
  { label: 'Price on request', test: (v) => v === null },
];
const ABOUT_FAQS = [
  {
    q: 'Is Eventory free to use?',
    a: 'Yes. Browsing vendors, comparing what they offer and sending requests is free for anyone planning an event. Listing a business is also free, and paid placement is optional.',
  },
  {
    q: 'Does Eventory process payments?',
    a: 'No. Eventory never processes payment between you and a vendor. You pay vendors directly, on their own terms.',
  },
  {
    q: 'How do I request a quote from a vendor?',
    a: "Add what you need to your Broadcast Request as you browse, then send it once. Each vendor gets a separate request with only the items relevant to them.",
  },
  {
    q: 'What if I only need one vendor?',
    a: 'Message them directly from their profile. No need to build a Broadcast Request for a single ask.',
  },
  {
    q: "Can't find what you're looking for?",
    a: "Submit a sourcing request and tell us what you need. We'll help you find options, even if it isn't listed yet.",
  },
  {
    q: 'How do I list my business on Eventory?',
    a: 'Head to the Join Eventory page and submit your details. We\'ll get back to you to build your profile.',
  },
  {
    q: 'What is Spotlight?',
    a: "Spotlight is Eventory's paid placement option for vendors. It puts your business in front of planners actively sourcing in your category, with top placement, targeted ads and email marketing.",
    linkTo: 'promo',
    linkLabel: 'See Spotlight',
  },
  {
    q: 'Where does Eventory operate?',
    a: 'We currently cover Trinidad & Tobago, including Port of Spain, San Fernando, Chaguanas, Arima and Tobago.',
  },
];

const avatarUrl = (seed) =>
  'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(seed) + '&backgroundColor=171717&textColor=ffffff&fontWeight=700';
const photoUrl = (seed, w, h) => 'https://picsum.photos/seed/' + encodeURIComponent(seed) + '/' + w + '/' + h;

const MOBILE_BREAKPOINT = 760;
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

const emptyCart = {
  items: [],
  spec: {},
  fulfil: 'Delivery',
  eventDate: '',
  guestsExpected: '',
  eventTime: '',
  venueAddress: '',
  accessNotes: '',
  sent: null,
};

// signedIn is intentionally not restored here — it now reflects a real
// Supabase auth session, synced separately once the app mounts.
const loadAccount = () => {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return { email: '', history: [], saved: [], promoOptIn: false, ...emptyCart };
    const parsed = JSON.parse(raw);
    return {
      email: parsed.email || '',
      history: parsed.history || [],
      saved: parsed.saved || [],
      promoOptIn: !!parsed.promoOptIn,
      items: parsed.items || [],
      spec: parsed.spec || {},
      fulfil: parsed.fulfil || 'Delivery',
      eventDate: parsed.eventDate || '',
      guestsExpected: parsed.guestsExpected || '',
      eventTime: parsed.eventTime || '',
      venueAddress: parsed.venueAddress || '',
      accessNotes: parsed.accessNotes || '',
    };
  } catch {
    return { email: '', history: [], saved: [], promoOptIn: false, ...emptyCart };
  }
};

const sharedProductFromUrl = () => {
  try {
    const pid = new URLSearchParams(window.location.search).get('product');
    if (!pid) return null;
    // Product ids are "<vendor uuid>-<index>" — split on the last hyphen since
    // the uuid itself contains hyphens. Existence against real vendors is
    // checked later, once the catalog has loaded from Supabase.
    const supId = pid.slice(0, pid.lastIndexOf('-'));
    return supId ? { pid, supId } : null;
  } catch {
    return null;
  }
};

const initialState = {
  screen: 'home',
  catCode: 'CAT.01',
  supId: null,
  items: [],
  sent: null,
  sending: false,
  sendError: null,
  noteByVendor: {},
  loc: 0,
  grp: 0,
  dirCat: 'ALL',
  dirCats: [],
  dirPlanLabel: '',
  dirCatMenuOpen: false,
  dirLoc: 0,
  dirPrice: 0,
  dirQuery: '',
  dirVisible: 6,
  planModalOpen: false,
  planStep: 1,
  planEventType: null,
  planOtherLabel: '',
  planCats: [],
  fulfil: 'Delivery',
  spec: {},
  openSpec: {},
  checkoutStep: 1,
  eventDate: '',
  guestsExpected: '',
  eventTime: '',
  venueAddress: '',
  accessNotes: '',
  email: '',
  signedIn: false,
  authSending: false,
  authSent: false,
  authError: null,
  history: [],
  saved: [],
  promoOptIn: false,
  copiedPid: null,
  contactSent: false,
  sourcingOpen: false,
  sourcingSent: false,
  supplierTab: 'services',
  svcQuery: '',
  svcGroup: 'All',
  svcVisible: 8,
  navMenuOpen: false,
  promoPlanOpen: false,
  promoPlanSent: false,
  reviewFormOpen: false,
  reviewAuthor: '',
  reviewStars: 0,
  reviewBody: '',
  reviewSending: false,
  reviewError: null,
  reviewSent: false,
};

export default function App() {
  const isMobile = useIsMobile();
  const [st, setSt] = useState(() => {
    const base = { ...initialState, ...loadAccount() };
    const shared = sharedProductFromUrl();
    if (shared) return { ...base, screen: 'supplier', supId: shared.supId, supplierTab: 'services' };
    if (new URLSearchParams(window.location.search).get('admin')) {
      return { ...base, screen: 'admin' };
    }
    const resumed = history.state;
    if (resumed && resumed.screen) {
      return {
        ...base,
        screen: resumed.screen,
        catCode: resumed.catCode ?? base.catCode,
        supId: resumed.supId ?? base.supId,
        supplierTab: resumed.supplierTab ?? base.supplierTab,
      };
    }
    return base;
  });
  const patch = (updater) =>
    setSt((prev) => ({ ...prev, ...(typeof updater === 'function' ? updater(prev) : updater) }));

  const [catalog, setCatalog] = useState({ ready: false, error: null, cats: [], suppliers: [] });
  const loadCatalog = () => {
    setCatalog((c) => ({ ...c, ready: false, error: null }));
    fetchCatalog()
      .then(({ cats, suppliers }) => setCatalog({ ready: true, error: null, cats, suppliers }))
      .catch((err) => setCatalog({ ready: false, error: err.message || 'Failed to load', cats: [], suppliers: [] }));
  };
  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const CATS = catalog.cats;
  const SUPPLIERS = catalog.suppliers;

  // Load the admin's vendor list (including drafts) whenever the signed-in
  // admin lands on the dashboard — RLS only allows this for ADMIN_EMAIL.
  useEffect(() => {
    if (st.screen !== 'admin' || (st.adminSubScreen || 'dashboard') !== 'dashboard') return;
    if (!st.signedIn || st.email !== ADMIN_EMAIL) return;
    patch({ adminVendorsLoading: true, adminVendorsError: null });
    adminListVendors()
      .then((rows) => patch({ adminVendorsLoading: false, adminVendors: rows }))
      .catch((err) => patch({ adminVendorsLoading: false, adminVendorsError: err.message || 'Could not load vendors.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.screen, st.adminSubScreen, st.signedIn, st.email]);

  // Real auth: restore any existing Supabase session on load, then stay in
  // sync as the user signs in (via magic link) or out. A magic link click
  // lands back here as a fresh page load, so on sign-in we also consume any
  // stashed "return to" screen so the user reappears where they left off
  // (e.g. back on the Send step) instead of on the home screen.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) patch({ signedIn: true, email: data.session.user.email || '' });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        let extra = {};
        try {
          const raw = localStorage.getItem(POST_AUTH_RETURN_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.screen) extra = { screen: parsed.screen, checkoutStep: parsed.checkoutStep || 1 };
          }
          localStorage.removeItem(POST_AUTH_RETURN_KEY);
        } catch {
          // ignore malformed/inaccessible storage
        }
        patch({ signedIn: true, email: session.user.email || '', authSent: false, authError: null, ...extra });
      } else {
        patch({ signedIn: false });
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        ACCOUNT_KEY,
        JSON.stringify({
          email: st.email,
          history: st.history,
          saved: st.saved,
          promoOptIn: st.promoOptIn,
          items: st.items,
          spec: st.spec,
          fulfil: st.fulfil,
          eventDate: st.eventDate,
          guestsExpected: st.guestsExpected,
          eventTime: st.eventTime,
          venueAddress: st.venueAddress,
          accessNotes: st.accessNotes,
        })
      );
    } catch {
      // ignore storage failures (private browsing, quota, etc.)
    }
  }, [
    st.email,
    st.history,
    st.saved,
    st.promoOptIn,
    st.items,
    st.spec,
    st.fulfil,
    st.eventDate,
    st.guestsExpected,
    st.eventTime,
    st.venueAddress,
    st.accessNotes,
  ]);

  useEffect(() => {
    if (st.sent) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [st.sent]);

  const pendingScrollAnchorRef = useRef(null);

  useEffect(() => {
    const anchor = pendingScrollAnchorRef.current;
    pendingScrollAnchorRef.current = null;
    const el = anchor && document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [st.screen]);

  const isPoppingRef = useRef(false);
  const isFirstScreenRef = useRef(true);

  useEffect(() => {
    history.replaceState({ screen: st.screen, catCode: st.catCode, supId: st.supId, supplierTab: st.supplierTab }, '');
    const onPopState = (e) => {
      if (!e.state) return;
      isPoppingRef.current = true;
      patch(e.state);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      return;
    }
    if (isFirstScreenRef.current) {
      isFirstScreenRef.current = false;
      return;
    }
    history.pushState({ screen: st.screen, catCode: st.catCode, supId: st.supId, supplierTab: st.supplierTab }, '');
    // Only push a new history entry when the screen itself changes, not on every
    // catCode/supId/supplierTab update (e.g. switching tabs shouldn't add a back-button stop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.screen]);

  if (catalog.error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: SANS, textAlign: 'center', padding: 24 }}>
        <div style={{ fontFamily: DISPLAY_BLACK, fontSize: 22, fontWeight: 800 }}>Eventory</div>
        <div style={{ fontSize: 15, color: '#5B5B5B', maxWidth: 360 }}>Could not load the catalog. {catalog.error}</div>
        <button
          onClick={loadCatalog}
          style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '11px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!catalog.ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 13, color: '#9A9A9A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Loading Eventory…
      </div>
    );
  }

  const allProducts = () => {
    const out = [];
    SUPPLIERS.forEach((s) =>
      s.products.forEach((p, i) =>
        out.push({
          id: s.id + '-' + (i + 1),
          supId: s.id,
          name: p[0],
          description: p[1],
          min: p[2],
          max: p[3],
          unit: p[4],
          minQty: p[5],
          group: p[7] || 'General',
          photoUrl: p[8] || '',
          inclusions: p[9] || [],
          priceOnRequest: !!s.priceOnRequest,
        })
      )
    );
    return out;
  };
  const product = (id) => allProducts().find((p) => p.id === id);
  const supplier = (id) => SUPPLIERS.find((s) => s.id === id);
  const catName = (code) => {
    const c = CATS.find((c) => c[0] === code);
    return c ? c[1] : '';
  };
  const priceLabel = (p) =>
    p.priceOnRequest ? 'Inquire for pricing' : money(p.min) + '–' + money(p.max) + (p.unit === 'flat' ? '' : ' ' + p.unit);
  const startPrice = (s) => (s.priceOnRequest ? null : Math.min(...s.products.map((p) => p[2])));

  const add = (pid) => {
    patch((s) => {
      const hit = s.items.find((i) => i.pid === pid);
      const items = hit
        ? s.items.map((i) => (i.pid === pid ? { ...i, qty: i.qty + 1 } : i))
        : s.items.concat([{ pid, qty: 1 }]);
      return { items, sent: null };
    });
  };
  const bump = (pid, d) => {
    patch((s) => ({ items: s.items.map((i) => (i.pid === pid ? { ...i, qty: Math.max(1, i.qty + d) } : i)) }));
  };
  const remove = (pid) => patch((s) => ({ items: s.items.filter((i) => i.pid !== pid) }));
  const removeSupplier = (supId) =>
    patch((s) => ({ items: s.items.filter((i) => { const p = product(i.pid); return p && p.supId !== supId; }) }));
  const setSpec = (pid, key, val) => {
    patch((s) => {
      const spec = { ...(s.spec || {}) };
      spec[pid] = { ...(spec[pid] || {}), [key]: val };
      return { spec };
    });
  };

  const toggleSave = (pid) => {
    patch((s) => {
      const saved = s.saved || [];
      return { saved: saved.indexOf(pid) >= 0 ? saved.filter((x) => x !== pid) : saved.concat([pid]) };
    });
  };
  const shareProduct = (pid) => {
    const p = product(pid);
    if (!p) return;
    const s = supplier(p.supId);
    const url = window.location.origin + window.location.pathname + '?product=' + encodeURIComponent(pid);
    const text = p.name + (s ? ' from ' + s.name : '') + ' on Eventory';
    if (navigator.share) {
      navigator.share({ title: p.name, text, url }).catch(() => {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          patch({ copiedPid: pid });
          setTimeout(() => patch((s2) => (s2.copiedPid === pid ? { copiedPid: null } : {})), 1800);
        })
        .catch(() => {});
    }
  };

  const groups = () => {
    const bySup = {};
    st.items.forEach((it) => {
      const p = product(it.pid);
      if (!p) return;
      (bySup[p.supId] = bySup[p.supId] || []).push({ ...it, p });
    });
    return Object.keys(bySup).map((sid) => ({ sup: supplier(sid), rows: bySup[sid] }));
  };

  // ---- derived view-model ----
  const grp = groups();
  const itemCount = st.items.reduce((n, i) => n + i.qty, 0);
  const checkoutTotalSteps = 2 + grp.length;
  const checkoutStep = Math.min(Math.max(st.checkoutStep || 1, 1), checkoutTotalSteps);
  const nav = (screen, extra) => () =>
    patch({ screen, sent: screen === 'eventory' ? st.sent : null, navMenuOpen: false, ...(extra || {}) });
  const openCat = (code) => () => patch({ screen: 'category', catCode: code, loc: 0, grp: 0 });
  const catTile = (c) => {
    const n = SUPPLIERS.filter((s) => s.code === c[0]).length;
    return {
      code: c[0],
      name: c[1],
      photo: CATEGORY_PHOTOS[c[0]] || photoUrl('category-' + c[0], 400, 300),
      supplierLabel: n ? n + (n === 1 ? ' vendor' : ' vendors') : 'Coming soon',
      open: openCat(c[0]),
    };
  };

  const cat = CATS.find((c) => c[0] === st.catCode) || CATS[0];
  const catSuppliers = SUPPLIERS.filter((s) => s.code === st.catCode);
  const grpMax = GROUPS[st.grp][1];
  const filtered = catSuppliers.filter(
    (s) =>
      (st.loc === 0 || s.region === LOCATIONS[st.loc]) &&
      (grpMax === 0 || (grpMax === 1000 ? s.minGroup >= 100 : s.minGroup <= grpMax))
  );

  const dirQueryLower = (st.dirQuery || '').trim().toLowerCase();
  const dirFiltered = SUPPLIERS.filter((s) => {
    if (st.dirCat !== 'ALL' && s.code !== st.dirCat) return false;
    if ((st.dirCats || []).length && !st.dirCats.includes(s.code)) return false;
    if (st.dirLoc !== 0 && s.region !== LOCATIONS[st.dirLoc]) return false;
    if (!PRICE_FILTERS[st.dirPrice || 0].test(startPrice(s))) return false;
    if (!dirQueryLower) return true;
    const inSupplier =
      s.name.toLowerCase().indexOf(dirQueryLower) >= 0 ||
      s.bio.toLowerCase().indexOf(dirQueryLower) >= 0 ||
      s.desc.toLowerCase().indexOf(dirQueryLower) >= 0 ||
      catName(s.code).toLowerCase().indexOf(dirQueryLower) >= 0 ||
      s.tags.some((t) => t.toLowerCase().indexOf(dirQueryLower) >= 0);
    const inProducts = allProducts().some(
      (p) => p.supId === s.id && (p.name.toLowerCase().indexOf(dirQueryLower) >= 0 || p.description.toLowerCase().indexOf(dirQueryLower) >= 0)
    );
    return inSupplier || inProducts;
  });

  const sup = supplier(st.supId) || SUPPLIERS[0] || EMPTY_SUPPLIER;
  const supProducts = allProducts().filter((p) => p.supId === sup.id);
  const has = (pid) => st.items.some((i) => i.pid === pid);

  const svcGroups = Array.from(new Set(supProducts.map((p) => p.group)));
  const svcGroupFilter = st.svcGroup || 'All';
  const svcQueryLower = (st.svcQuery || '').trim().toLowerCase();
  const svcFiltered = supProducts.filter(
    (p) =>
      (svcGroupFilter === 'All' || p.group === svcGroupFilter) &&
      (!svcQueryLower ||
        p.name.toLowerCase().indexOf(svcQueryLower) >= 0 ||
        p.description.toLowerCase().indexOf(svcQueryLower) >= 0)
  );
  const svcVisibleCount = st.svcVisible || 8;
  const svcVisible = svcFiltered.slice(0, svcVisibleCount);
  const hasPolicies = (sup.policies || []).length > 0;
  const hasMenu = (sup.menuItems || []).length > 0;

  const chip = (on) =>
    on ? { bg: '#171717', fg: '#FFFFFF', border: '#171717' } : { bg: '#FFFFFF', fg: '#171717', border: '#D7D7D2' };

  const V = {
    itemCount,
    counterBg: itemCount ? ACCENT : '#FFFFFF',
    counterFg: itemCount ? '#FFFFFF' : '#171717',
    isHome: st.screen === 'home',
    isCategory: st.screen === 'category',
    isSuppliers: st.screen === 'suppliers',
    isSupplier: st.screen === 'supplier',
    isEventory: st.screen === 'eventory',
    isJoin: st.screen === 'join',
    isAccount: st.screen === 'account',
    isAbout: st.screen === 'about',
    sourcingOpen: st.sourcingOpen,
    goHome: nav('home'),
    goSuppliers: nav('suppliers'),
    goEventory: nav('eventory', { checkoutStep: 1 }),
    goSourcing: () => patch({ sourcingOpen: true, sourcingSent: false }),
    closeSourcing: () => patch({ sourcingOpen: false, sourcingSent: false }),
    submitSourcing: () => patch({ sourcingSent: true }),
    sourcingSent: !!st.sourcingSent,
    goCategories: () => {
      patch({ navMenuOpen: false });
      if (st.screen === 'home') {
        document.getElementById('top-categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        pendingScrollAnchorRef.current = 'top-categories';
        patch({ screen: 'home' });
      }
    },
    goHowItWorks: () => {
      patch({ navMenuOpen: false });
      if (st.screen === 'home') {
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        pendingScrollAnchorRef.current = 'how-it-works';
        patch({ screen: 'home' });
      }
    },
    goGoFurther: () => {
      pendingScrollAnchorRef.current = 'go-further';
      patch({ screen: 'join', navMenuOpen: false });
    },
    goAbout: nav('about', { contactSent: false }),
    submitContact: () => patch({ contactSent: true }),
    contactSent: !!st.contactSent,
    openPromoPlan: () => patch({ promoPlanOpen: true, promoPlanSent: false }),
    closePromoPlan: () => patch({ promoPlanOpen: false, promoPlanSent: false }),
    submitPromoPlan: () => patch({ promoPlanSent: true }),
    promoPlanOpen: !!st.promoPlanOpen,
    promoPlanSent: !!st.promoPlanSent,
    goAccount: nav('account'),
    navMenuOpen: !!st.navMenuOpen,
    toggleNavMenu: () => patch((s) => ({ navMenuOpen: !s.navMenuOpen })),
    closeNavMenu: () => patch({ navMenuOpen: false }),
    startPlanning: () =>
      patch({
        planModalOpen: true,
        planStep: 1,
        planEventType: null,
        planOtherLabel: '',
        planEventDate: '',
        planLoc: 0,
        planCats: [],
        planBudget: 0,
        planContactName: '',
        planContactPhone: '',
        planContactEmail: '',
        planSubmitting: false,
        planSubmitError: null,
      }),
    planModalOpen: !!st.planModalOpen,
    closePlanModal: () => patch({ planModalOpen: false }),
    planStep: st.planStep || 1,
    planTotalSteps: 5,
    planStepBack: () => patch((s) => ({ planStep: Math.max(1, (s.planStep || 1) - 1) })),
    eventTypeTiles: EVENT_TYPES.map((t) => ({
      key: t.key,
      label: t.label,
      on: st.planEventType === t.key,
      pick: () => {
        if (t.key === 'other') {
          patch({ planEventType: 'other' });
          return;
        }
        patch({ planEventType: t.key, planStep: 2 });
      },
    })),
    planOtherLabel: st.planOtherLabel || '',
    setPlanOtherLabel: (e) => patch({ planOtherLabel: e.target.value }),
    confirmOtherEventType: () => patch({ planStep: 2 }),
    planEventLabel:
      st.planEventType === 'other'
        ? st.planOtherLabel.trim() || 'Your event'
        : (EVENT_TYPES.find((t) => t.key === st.planEventType) || {}).label || '',

    planEventDate: st.planEventDate || '',
    setPlanEventDate: (e) => patch({ planEventDate: e.target.value }),
    planLocationTiles: LOCATIONS.map((l, i) => ({
      label: l,
      on: (st.planLoc || 0) === i,
      pick: () => patch({ planLoc: i }),
    })),
    planWhenWhereNext: () => patch({ planStep: 3 }),

    planCategoryTiles: CATS.map((c) => ({
      code: c[0],
      name: c[1],
      on: (st.planCats || []).includes(c[0]),
      toggle: () =>
        patch((s) => ({
          planCats: (s.planCats || []).includes(c[0])
            ? s.planCats.filter((x) => x !== c[0])
            : s.planCats.concat([c[0]]),
        })),
    })),
    planServicesNext: () => patch({ planStep: 4 }),
    planServicesNextDisabled: !(st.planCats || []).length,

    planBudgetTiles: PRICE_FILTERS.map((f, i) => ({
      label: f.label,
      on: (st.planBudget || 0) === i,
      pick: () => patch({ planBudget: i }),
    })),
    planBudgetNext: () => patch({ planStep: 5 }),

    planContactName: st.planContactName || '',
    setPlanContactName: (e) => patch({ planContactName: e.target.value }),
    planContactPhone: st.planContactPhone || '',
    setPlanContactPhone: (e) => patch({ planContactPhone: e.target.value }),
    planContactEmail: st.planContactEmail || '',
    setPlanContactEmail: (e) => patch({ planContactEmail: e.target.value }),
    planSubmitting: !!st.planSubmitting,
    planSubmitError: st.planSubmitError || '',
    planSubmitDisabled:
      !(st.planContactName || '').trim() || !(st.planContactPhone || '').trim() || !!st.planSubmitting,
    finishPlanning: async () => {
      const name = (st.planContactName || '').trim();
      const phone = (st.planContactPhone || '').trim();
      if (!name || !phone || st.planSubmitting) return;
      const label =
        st.planEventType === 'other'
          ? st.planOtherLabel.trim() || 'Your event'
          : (EVENT_TYPES.find((t) => t.key === st.planEventType) || {}).label || '';
      patch({ planSubmitting: true, planSubmitError: null });
      try {
        await submitPlanningRequest({
          eventLabel: label,
          eventDate: st.planEventDate || '',
          location: LOCATIONS[st.planLoc || 0],
          categoryCodes: st.planCats || [],
          budgetLabel: PRICE_FILTERS[st.planBudget || 0].label,
          contactName: name,
          contactPhone: phone,
          contactEmail: (st.planContactEmail || '').trim(),
        });
        patch({
          planModalOpen: false,
          planSubmitting: false,
          screen: 'suppliers',
          dirCat: 'ALL',
          dirCats: st.planCats || [],
          dirPlanLabel: label,
          dirLoc: st.planLoc || 0,
          dirPrice: st.planBudget || 0,
          dirVisible: 6,
          navMenuOpen: false,
        });
      } catch (err) {
        patch({ planSubmitting: false, planSubmitError: err.message || 'Something went wrong. Please try again.' });
      }
    },
    dirPlanLabel: st.dirPlanLabel || '',
    clearDirPlan: () => patch({ dirCats: [], dirPlanLabel: '' }),
    backToCategory: () => patch({ screen: 'category', catCode: sup.code }),

    homeQuery: st.dirQuery || '',
    setHomeQuery: (e) => patch({ dirQuery: e.target.value }),
    runHomeSearch: () => patch({ screen: 'suppliers', dirCat: 'ALL', dirCats: [], dirPlanLabel: '', dirLoc: 0, dirVisible: 6, navMenuOpen: false }),
    homeSearchKeyDown: (e) => {
      if (e.key === 'Enter') patch({ screen: 'suppliers', dirCat: 'ALL', dirCats: [], dirPlanLabel: '', dirLoc: 0, dirVisible: 6, navMenuOpen: false });
    },

    topCategoryTiles: CATS.map((c) => ({ c, n: SUPPLIERS.filter((s) => s.code === c[0]).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 6)
      .map((x) => catTile(x.c)),

    topSuppliers: SUPPLIERS.slice()
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 6)
      .map((s) => ({
        key: s.id,
        logo: s.logoUrl || avatarUrl(s.name),
        name: s.name,
        location: s.city,
        categoryName: catName(s.code),
        rating: s.rating,
        open: () => patch({ screen: 'supplier', supId: s.id, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false }),
      })),

    featuredProducts: SUPPLIERS.slice()
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 6)
      .map((s) => {
        const p = allProducts().find((pr) => pr.supId === s.id);
        if (!p) return null;
        return {
          key: p.id,
          photo: photoUrl(p.id, 300, 220),
          name: p.name,
          supplierName: s.name,
          categoryName: catName(s.code),
          priceLabel: priceLabel(p),
          open: () => patch({ screen: 'supplier', supId: p.supId, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false }),
          btnLabel: has(p.id) ? 'Added' : '+ Add',
          btnBg: has(p.id) ? ACCENT : '#171717',
          btnFg: '#FFFFFF',
          add: () => add(p.id),
        };
      })
      .filter(Boolean),

    cat: { code: cat[0], name: cat[1], description: cat[2] },
    resultLabel: filtered.length + ' of ' + catSuppliers.length + ' vendors',
    locationFilters: LOCATIONS.map((l, i) => ({ label: l, ...chip(i === st.loc), pick: () => patch({ loc: i }) })),
    groupFilters: GROUPS.map((g, i) => ({ label: g[0], ...chip(i === st.grp), pick: () => patch({ grp: i }) })),
    supplierRows: filtered.map((s) => ({
      key: s.id,
      logo: s.logoUrl || avatarUrl(s.name),
      name: s.name,
      location: s.city,
      description: s.bio,
      tags: s.tags,
      open: () => patch({ screen: 'supplier', supId: s.id, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false }),
    })),

    dirCategoryFilters: [{ code: 'ALL', name: 'All categories' }, ...CATS.map((c) => ({ code: c[0], name: c[1] }))].map((c) => {
      const n = c.code === 'ALL' ? SUPPLIERS.length : SUPPLIERS.filter((s) => s.code === c.code).length;
      return {
        code: c.code,
        label: c.name,
        countLabel: c.code === 'ALL' ? n + (n === 1 ? ' vendor' : ' vendors') : n ? String(n) : 'None yet',
        on: st.dirCat === c.code,
        pick: () => patch({ dirCat: c.code, dirCatMenuOpen: false, dirVisible: 6, dirCats: [], dirPlanLabel: '' }),
      };
    }),
    dirCategoryLabel: (CATS.find((c) => c[0] === st.dirCat) || [null, 'All categories'])[1],
    dirCatMenuOpen: !!st.dirCatMenuOpen,
    toggleDirCatMenu: () => patch((s) => ({ dirCatMenuOpen: !s.dirCatMenuOpen })),
    closeDirCatMenu: () => patch({ dirCatMenuOpen: false }),
    dirLocationFilters: LOCATIONS.map((l, i) => ({ label: l, ...chip(i === st.dirLoc), pick: () => patch({ dirLoc: i, dirVisible: 6 }) })),
    dirPriceFilters: PRICE_FILTERS.map((f, i) => ({ label: f.label, ...chip(i === (st.dirPrice || 0)), pick: () => patch({ dirPrice: i, dirVisible: 6 }) })),
    dirQuery: st.dirQuery || '',
    setDirQuery: (e) => patch({ dirQuery: e.target.value, dirVisible: 6 }),
    dirResultLabel: dirFiltered.length + ' of ' + SUPPLIERS.length + ' vendors',
    dirSupplierRows: dirFiltered.slice(0, st.dirVisible || 6).map((s) => ({
      key: s.id,
      logo: s.logoUrl || avatarUrl(s.name),
      name: s.name,
      location: s.city,
      categoryName: catName(s.code),
      description: s.bio,
      tags: s.tags,
      open: () => patch({ screen: 'supplier', supId: s.id, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false }),
    })),
    dirShowSeeAll: dirFiltered.length > (st.dirVisible || 6),
    dirSeeAllLabel: 'See all ' + dirFiltered.length + ' vendors',
    seeAllDir: () => patch({ dirVisible: dirFiltered.length }),

    sup: {
      logo: sup.logoUrl || avatarUrl(sup.name),
      cover: sup.coverUrl || photoUrl(sup.id + '-cover', 960, 360),
      name: sup.name,
      code: sup.code,
      description: sup.bio,
      about: sup.desc,
      categoryName: catName(sup.code),
      verified: !!sup.verified,
      ratingLabel: sup.rating,
      startPriceLabel: sup.priceOnRequest ? 'Price on request' : 'From ' + money(startPrice(sup)),
      facts: [
        { label: 'Based in', value: sup.city },
        { label: 'Service radius', value: sup.radius ? sup.radius + ' km' : 'On site only' },
        { label: 'Min group', value: sup.minGroup + ' guests' },
        { label: 'Rating', value: sup.rating },
        { label: 'Response time', value: sup.response },
      ],
      phone: sup.phone,
      whatsappUrl: sup.phone
        ? 'https://wa.me/' +
          sup.phone.replace(/\D/g, '') +
          '?text=' +
          encodeURIComponent(`Hi ${sup.name}, I found you on Eventory and I'm interested in your services.`)
        : null,
      social: [
        sup.instagram ? { key: 'instagram', label: 'Instagram', value: sup.instagram } : null,
        sup.facebook ? { key: 'facebook', label: 'Facebook', value: sup.facebook } : null,
      ].filter(Boolean),
      promos: (sup.promos || []).map((p) => ({ key: p.title, ...p })),
      reviews: (sup.reviews || []).map((r) => ({
        key: r.author,
        author: r.author,
        stars: '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars),
        text: r.text,
      })),
      faqs: (sup.faqs || []).map((f) => ({ key: f.q, q: f.q, a: f.a })),
      gallery: Object.entries(
        (sup.gallery || []).reduce((acc, g) => {
          const key = g.eventType || 'General';
          (acc[key] = acc[key] || []).push(g.photoUrl);
          return acc;
        }, {})
      ).map(([eventType, photos]) => ({ key: eventType, eventType, photos })),
      policies: (sup.policies || []).map((p) => ({ key: p.title, label: p.title, text: p.body })),
      menuItems: sup.menuItems || [],
    },
    openFaqKey: st.openFaqKey || null,
    toggleFaq: (key) => patch((s) => ({ openFaqKey: s.openFaqKey === key ? null : key })),
    supplierTab: st.supplierTab || 'services',
    supplierTabs: [
      { key: 'about', label: 'About' },
      { key: 'services', label: 'Packages (' + supProducts.length + ')' },
      (sup.gallery || []).length > 0 && { key: 'gallery', label: 'Gallery' },
      hasMenu && { key: 'menu', label: 'Menu' },
      { key: 'reviews', label: 'Reviews (' + (sup.reviews || []).length + ')' },
      { key: 'faq', label: 'FAQ' },
      { key: 'promos', label: 'Promos' + ((sup.promos || []).length ? ' (' + sup.promos.length + ')' : '') },
      hasPolicies && { key: 'policies', label: 'Policies' },
    ]
      .filter(Boolean)
      .map((t) => ({
        ...t,
        active: (st.supplierTab || 'services') === t.key,
        go: () => patch({ supplierTab: t.key }),
      })),

    reviewFormOpen: !!st.reviewFormOpen,
    reviewSent: !!st.reviewSent,
    reviewSending: !!st.reviewSending,
    reviewError: st.reviewError || '',
    reviewAuthor: st.reviewAuthor || '',
    setReviewAuthor: (e) => patch({ reviewAuthor: e.target.value }),
    reviewStars: st.reviewStars || 0,
    setReviewStars: (n) => patch({ reviewStars: n }),
    reviewBody: st.reviewBody || '',
    setReviewBody: (e) => patch({ reviewBody: e.target.value }),
    openReviewForm: () => patch({ reviewFormOpen: true, reviewSent: false, reviewError: null }),
    cancelReviewForm: () =>
      patch({ reviewFormOpen: false, reviewError: null, reviewAuthor: '', reviewStars: 0, reviewBody: '' }),
    submitReview: async () => {
      if (st.reviewSending) return;
      if (!st.reviewAuthor || !st.reviewAuthor.trim()) {
        patch({ reviewError: 'Enter your name.' });
        return;
      }
      if (!st.reviewStars) {
        patch({ reviewError: 'Choose a star rating.' });
        return;
      }
      if (!st.reviewBody || !st.reviewBody.trim()) {
        patch({ reviewError: 'Share a few words about your experience.' });
        return;
      }
      patch({ reviewSending: true, reviewError: null });
      try {
        await submitVendorReview({
          vendorId: sup.id,
          author: st.reviewAuthor.trim(),
          stars: st.reviewStars,
          body: st.reviewBody.trim(),
        });
        patch({
          reviewSending: false,
          reviewSent: true,
          reviewFormOpen: false,
          reviewAuthor: '',
          reviewStars: 0,
          reviewBody: '',
        });
      } catch (err) {
        patch({ reviewSending: false, reviewError: err.message || 'Something went wrong submitting your review. Please try again.' });
      }
    },

    svcQuery: st.svcQuery || '',
    setSvcQuery: (e) => patch({ svcQuery: e.target.value, svcVisible: 8 }),
    svcHasGroups: svcGroups.length > 1,
    svcGroupFilters: ['All'].concat(svcGroups).map((g) => ({
      label: g,
      ...chip(svcGroupFilter === g),
      pick: () => patch({ svcGroup: g, svcVisible: 8 }),
    })),
    svcResultLabel:
      svcFiltered.length +
      (svcFiltered.length === 1 ? ' service' : ' services') +
      (svcFiltered.length !== supProducts.length ? ' of ' + supProducts.length : ''),
    svcShowMore: svcFiltered.length > svcVisible.length,
    svcRemainingLabel: 'Show ' + Math.min(8, svcFiltered.length - svcVisible.length) + ' more',
    loadMoreSvc: () => patch((s) => ({ svcVisible: (s.svcVisible || 8) + 8 })),
    supplierProducts: svcVisible.map((p) => ({
      key: p.id,
      photo: p.photoUrl || photoUrl(p.id, 300, 220),
      name: p.name,
      description: p.description,
      inclusions: p.inclusions || [],
      termsLabel: 'Min ' + p.minQty + ' ' + (p.unit === 'flat' ? 'booking' : 'units'),
      priceLabel: priceLabel(p),
      btnLabel: has(p.id) ? 'Added' : '+ Add',
      btnBg: has(p.id) ? ACCENT : '#171717',
      btnFg: '#FFFFFF',
      add: () => add(p.id),
      saved: (st.saved || []).indexOf(p.id) >= 0,
      saveLabel: (st.saved || []).indexOf(p.id) >= 0 ? '★ Saved' : '☆ Save',
      toggleSave: () => toggleSave(p.id),
      shareLabel: st.copiedPid === p.id ? 'Copied!' : 'Share',
      share: () => shareProduct(p.id),
    })),
    summaryLine:
      itemCount +
      (itemCount === 1 ? ' product · ' : ' products · ') +
      grp.length +
      (grp.length === 1 ? ' vendor' : ' vendors'),
    eventoryBrief: grp.map((g) => ({
      key: g.sup.id,
      supplierName: g.sup.name,
      itemLabel: g.rows.length + (g.rows.length === 1 ? ' item' : ' items'),
    })),

    eventoryHeading: st.sent ? 'Inquiries are out' : 'Your Eventory',
    eventorySub: st.sent
      ? 'Sent ' + st.sent.length + (st.sent.length === 1 ? ' inquiry' : ' separate inquiries')
      : itemCount + ' products across ' + grp.length + (grp.length === 1 ? ' vendor' : ' vendors'),
    isEmpty: st.items.length === 0,
    notSent: !st.sent,
    sent: !!st.sent,
    eventoryGroups: grp.map((g) => ({
      key: g.sup.id,
      supplierName: g.sup.name,
      location: g.sup.city,
      inquiryLabel: '1 inquiry · ' + g.rows.length + (g.rows.length === 1 ? ' line item' : ' line items'),
      removeAll: () => removeSupplier(g.sup.id),
      notePlaceholder:
        g.sup.code === 'CAT.01'
          ? 'Two guests need vegetarian plates. Can you hold the pepper on the side?'
          : 'Anything this vendor should know about your setup or timing.',
      note: (st.noteByVendor || {})[g.sup.id] || '',
      setNote: (e) =>
        patch((s) => ({ noteByVendor: { ...(s.noteByVendor || {}), [g.sup.id]: e.target.value } })),
      items: g.rows.map((r) => {
        const defs = FIELDS[g.sup.code] || FIELDS_DEFAULT;
        const spec = (st.spec || {})[r.pid] || {};
        const setCount = defs.filter((d) => spec[d.k]).length;
        return {
          key: r.pid,
          name: r.p.name,
          qty: r.qty,
          termsLabel: 'Min ' + r.p.minQty,
          priceLabel: priceLabel(r.p),
          inc: () => bump(r.pid, 1),
          dec: () => bump(r.pid, -1),
          remove: () => remove(r.pid),
          expanded: !!(st.openSpec || {})[r.pid],
          detailLabel: setCount ? setCount + ' of ' + defs.length + ' set' : 'Add details',
          detailBg: setCount ? ACCENT : '#171717',
          detailFg: '#FFFFFF',
          toggle: () =>
            patch((s) => ({ openSpec: { ...(s.openSpec || {}), [r.pid]: !(s.openSpec || {})[r.pid] } })),
          fields: defs.map((d) => ({
            key: d.k,
            label: d.label,
            isChoice: d.type === 'choice',
            isText: d.type !== 'choice',
            ph: d.ph || '',
            value: spec[d.k] || '',
            set: (e) => setSpec(r.pid, d.k, e.target.value),
            options: (d.options || []).map((o) => ({
              key: o,
              label: o,
              ...chip(spec[d.k] === o),
              pick: () => setSpec(r.pid, d.k, spec[d.k] === o ? '' : o),
            })),
          })),
        };
      }),
    })),
    sendStats: [
      { key: 'suppliers', label: 'Vendors', value: grp.length },
      { key: 'products', label: 'Products', value: itemCount },
      { key: 'inquiries', label: 'Inquiries to send', value: grp.length },
    ],

    checkoutStep,
    checkoutTotalSteps,
    checkoutStepLabel: 'Step ' + checkoutStep + ' of ' + checkoutTotalSteps,
    checkoutIsDetails: checkoutStep === 1,
    checkoutIsSend: checkoutStep === checkoutTotalSteps,
    nextCheckoutStep: () => patch((s) => ({ checkoutStep: Math.min((s.checkoutStep || 1) + 1, checkoutTotalSteps) })),
    prevCheckoutStep: () => patch((s) => ({ checkoutStep: Math.max((s.checkoutStep || 1) - 1, 1) })),

    fulfilmentOptions: ['Delivery', 'Pickup by us', 'On site at venue'].map((l) => ({
      key: l,
      label: l,
      ...chip(st.fulfil === l),
      pick: () => patch({ fulfil: l }),
    })),
    addressLabel: st.fulfil === 'Pickup by us' ? 'Pickup area' : 'Delivery or venue address',
    eventDate: st.eventDate || '',
    setEventDate: (e) => patch({ eventDate: e.target.value }),
    guestsExpected: st.guestsExpected || '',
    setGuestsExpected: (e) => patch({ guestsExpected: e.target.value }),
    eventTime: st.eventTime || '',
    setEventTime: (e) => patch({ eventTime: e.target.value }),
    venueAddress: st.venueAddress || '',
    setVenueAddress: (e) => patch({ venueAddress: e.target.value }),
    accessNotes: st.accessNotes || '',
    setAccessNotes: (e) => patch({ accessNotes: e.target.value }),

    sendOpacity: st.items.length && st.signedIn && !st.sending ? 1 : 0.4,
    sending: !!st.sending,
    sendError: st.sendError || '',
    signInDisabled: !(st.email && st.email.indexOf('@') > 0) || !!st.authSending,
    send: async () => {
      if (!st.signedIn || !st.items.length || st.sending) return;
      const grpNow = groups();
      const sentNames = grpNow.map((g) => g.sup.name);
      patch({ sending: true, sendError: null });
      try {
        await submitInquiry({
          buyer: {
            email: st.email,
            eventDate: st.eventDate,
            guestsExpected: st.guestsExpected,
            eventTime: st.eventTime,
            fulfilment: st.fulfil,
            venueAddress: st.venueAddress,
            accessNotes: st.accessNotes,
            promoOptIn: st.promoOptIn,
          },
          groups: grpNow.map((g) => ({
            vendorId: g.sup.id,
            note: (st.noteByVendor || {})[g.sup.id] || '',
            items: g.rows.map((r) => ({
              productId: null,
              name: r.p.name,
              qty: r.qty,
              specAnswers: (st.spec || {})[r.pid] || {},
            })),
          })),
        });
        patch((s) => ({
          sending: false,
          sent: sentNames,
          history: [
            {
              id: Date.now(),
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              suppliers: sentNames,
              itemCount: s.items.reduce((n, i) => n + i.qty, 0),
            },
            ...(s.history || []),
          ],
        }));
      } catch (err) {
        patch({ sending: false, sendError: err.message || 'Something went wrong sending your inquiries. Please try again.' });
      }
    },
    sentSummary: st.sent ? 'One inquiry per vendor, each scoped to their own items.' : '',
    sentList: (st.sent || []).map((n) => ({ key: n, name: n, status: 'Sent' })),
    reset: () => patch({ ...emptyCart, screen: 'home' }),

    email: st.email || '',
    setEmail: (e) => patch({ email: e.target.value, authSent: false, authError: null }),
    signedIn: !!st.signedIn,
    needsAccount: !st.signedIn,
    accountLabel: st.signedIn ? 'Signed in · ' + st.email : 'Sign in',

    isSignedIn: !!st.signedIn,
    accountNeedsSignIn: !st.signedIn,
    accountEmail: st.email || '',
    setAccountEmail: (e) => patch({ email: e.target.value, authSent: false, authError: null }),
    authSending: !!st.authSending,
    authSent: !!st.authSent,
    authError: st.authError || '',
    useDifferentEmail: () => patch({ authSent: false, authError: null }),
    signIn: async () => {
      if (!st.email || st.email.indexOf('@') < 1 || st.authSending) return;
      patch({ authSending: true, authError: null });
      try {
        localStorage.setItem(POST_AUTH_RETURN_KEY, JSON.stringify({ screen: st.screen, checkoutStep: st.checkoutStep || 1 }));
      } catch {
        // ignore storage failures — worst case the user lands back on home
      }
      try {
        await sendMagicLink(st.email);
        patch({ authSending: false, authSent: true });
      } catch (err) {
        patch({ authSending: false, authError: err.message || 'Something went wrong sending your sign-in link. Please try again.' });
      }
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      patch({ signedIn: false, authSent: false, authError: null });
    },
    promoOptIn: !!st.promoOptIn,
    togglePromoOptIn: () => patch((s) => ({ promoOptIn: !s.promoOptIn })),
    accountHistory: (st.history || []).map((h) => ({
      key: h.id,
      date: h.date,
      suppliersLabel: h.suppliers.join(', '),
      itemLabel:
        h.itemCount +
        (h.itemCount === 1 ? ' product · ' : ' products · ') +
        h.suppliers.length +
        (h.suppliers.length === 1 ? ' vendor' : ' vendors'),
    })),
    hasHistory: (st.history || []).length > 0,

    savedProducts: (st.saved || [])
      .map((pid) => {
        const p = product(pid);
        if (!p) return null;
        const s = supplier(p.supId);
        return {
          key: pid,
          photo: photoUrl(pid, 200, 150),
          name: p.name,
          supplierName: s ? s.name : '',
          priceLabel: priceLabel(p),
          openSupplier: () =>
            patch({ screen: 'supplier', supId: p.supId, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false }),
          remove: () => toggleSave(pid),
          share: () => shareProduct(pid),
          shareLabel: st.copiedPid === pid ? 'Copied!' : 'Share',
        };
      })
      .filter(Boolean),
    hasSaved: (st.saved || []).length > 0,

    isAdmin: st.screen === 'admin',
    adminIsAuthed: st.signedIn && st.email === ADMIN_EMAIL,
    adminSubScreen: st.adminSubScreen || 'dashboard',
    adminVendors: st.adminVendors || [],
    adminVendorsLoading: !!st.adminVendorsLoading,
    adminVendorsError: st.adminVendorsError || '',
    loadAdminVendors: async () => {
      patch({ adminVendorsLoading: true, adminVendorsError: null });
      try {
        const rows = await adminListVendors();
        patch({ adminVendorsLoading: false, adminVendors: rows });
      } catch (err) {
        patch({ adminVendorsLoading: false, adminVendorsError: err.message || 'Could not load vendors.' });
      }
    },
    togglePublish: async (vendorId, next) => {
      patch({ adminVendorsError: null });
      try {
        await adminSetPublished(vendorId, next);
        patch((s) => ({
          adminVendors: (s.adminVendors || []).map((v) => (v.id === vendorId ? { ...v, published: next } : v)),
        }));
      } catch (err) {
        patch({ adminVendorsError: err.message || 'Could not update that vendor.' });
      }
    },
    goAdminDashboard: () => patch({ adminSubScreen: 'dashboard' }),
    goAdminNewVendor: () =>
      patch({
        adminSubScreen: 'wizard',
        adminStep: 1,
        adminSaveError: null,
        adminName: '',
        adminCategoryCode: null,
        adminRegion: null,
        adminCity: '',
        adminWhatsapp: '',
        adminBio: '',
        adminDescription: '',
        adminCoverUrl: '',
        adminLogoUrl: '',
        adminGallery: [],
        adminGalleryEventType: '',
        adminGalleryPhotoUrl: '',
        adminPackages: [],
        adminPkgName: '',
        adminPkgPhotoUrl: '',
        adminPkgDescription: '',
        adminPkgInclusionsText: '',
        adminPkgPriceMin: '',
        adminPkgPriceMax: '',
        adminFaqs: DEFAULT_FAQ_TEMPLATES.map((f) => ({ ...f })),
        adminPaymentTerms: '',
        adminDepositTerms: '',
        adminReschedulePolicy: '',
        adminCancellationPolicy: '',
      }),

    adminStep: st.adminStep || 1,
    adminTotalSteps: 7,
    adminStepBack: () => patch((s) => ({ adminStep: Math.max(1, (s.adminStep || 1) - 1) })),

    adminName: st.adminName || '',
    setAdminName: (e) => patch({ adminName: e.target.value }),
    adminCategoryTiles: CATS.map((c) => ({
      code: c[0],
      name: c[1],
      on: st.adminCategoryCode === c[0],
      pick: () => patch({ adminCategoryCode: c[0] }),
    })),
    adminRegionTiles: LOCATIONS.filter((l) => l !== 'All areas').map((l) => ({
      label: l,
      on: st.adminRegion === l,
      pick: () => patch({ adminRegion: l }),
    })),
    adminCity: st.adminCity || '',
    setAdminCity: (e) => patch({ adminCity: e.target.value }),
    adminWhatsapp: st.adminWhatsapp || '',
    setAdminWhatsapp: (e) => patch({ adminWhatsapp: e.target.value }),
    adminBio: st.adminBio || '',
    setAdminBio: (e) => patch({ adminBio: e.target.value }),
    adminStep1NextDisabled: !(
      (st.adminName || '').trim() &&
      st.adminCategoryCode &&
      st.adminRegion &&
      (st.adminCity || '').trim()
    ),
    adminStep1Next: () => patch({ adminStep: 2 }),

    adminDescription: st.adminDescription || '',
    setAdminDescription: (e) => patch({ adminDescription: e.target.value }),
    adminCoverUrl: st.adminCoverUrl || '',
    setAdminCoverUrl: (e) => patch({ adminCoverUrl: e.target.value }),
    adminLogoUrl: st.adminLogoUrl || '',
    setAdminLogoUrl: (e) => patch({ adminLogoUrl: e.target.value }),
    adminStep2Next: () => patch({ adminStep: 3 }),

    adminGallery: st.adminGallery || [],
    adminGalleryEventType: st.adminGalleryEventType || '',
    setAdminGalleryEventType: (e) => patch({ adminGalleryEventType: e.target.value }),
    adminGalleryPhotoUrl: st.adminGalleryPhotoUrl || '',
    setAdminGalleryPhotoUrl: (e) => patch({ adminGalleryPhotoUrl: e.target.value }),
    adminAddGalleryPhotoDisabled: !((st.adminGalleryEventType || '').trim() && (st.adminGalleryPhotoUrl || '').trim()),
    adminAddGalleryPhoto: () => {
      const eventType = (st.adminGalleryEventType || '').trim();
      const photoUrl = (st.adminGalleryPhotoUrl || '').trim();
      if (!eventType || !photoUrl) return;
      patch((s) => ({
        adminGallery: (s.adminGallery || []).concat([{ eventType, photoUrl }]),
        adminGalleryPhotoUrl: '',
      }));
    },
    adminRemoveGalleryPhoto: (i) =>
      patch((s) => ({ adminGallery: (s.adminGallery || []).filter((_, idx) => idx !== i) })),
    adminStep3Next: () => patch({ adminStep: 4 }),

    adminPackages: st.adminPackages || [],
    adminPkgName: st.adminPkgName || '',
    setAdminPkgName: (e) => patch({ adminPkgName: e.target.value }),
    adminPkgPhotoUrl: st.adminPkgPhotoUrl || '',
    setAdminPkgPhotoUrl: (e) => patch({ adminPkgPhotoUrl: e.target.value }),
    adminPkgDescription: st.adminPkgDescription || '',
    setAdminPkgDescription: (e) => patch({ adminPkgDescription: e.target.value }),
    adminPkgInclusionsText: st.adminPkgInclusionsText || '',
    setAdminPkgInclusionsText: (e) => patch({ adminPkgInclusionsText: e.target.value }),
    adminPkgPriceMin: st.adminPkgPriceMin || '',
    setAdminPkgPriceMin: (e) => patch({ adminPkgPriceMin: e.target.value }),
    adminPkgPriceMax: st.adminPkgPriceMax || '',
    setAdminPkgPriceMax: (e) => patch({ adminPkgPriceMax: e.target.value }),
    adminAddPackageDisabled: !(
      (st.adminPkgName || '').trim() &&
      Number(st.adminPkgPriceMin) > 0 &&
      Number(st.adminPkgPriceMax) >= Number(st.adminPkgPriceMin)
    ),
    adminAddPackage: () => {
      const name = (st.adminPkgName || '').trim();
      const priceMin = Number(st.adminPkgPriceMin);
      const priceMax = Number(st.adminPkgPriceMax);
      if (!name || !(priceMin > 0) || !(priceMax >= priceMin)) return;
      patch((s) => ({
        adminPackages: (s.adminPackages || []).concat([
          {
            name,
            photoUrl: (s.adminPkgPhotoUrl || '').trim(),
            description: (s.adminPkgDescription || '').trim(),
            inclusions: (s.adminPkgInclusionsText || '')
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean),
            priceMin,
            priceMax,
            unit: 'event',
          },
        ]),
        adminPkgName: '',
        adminPkgPhotoUrl: '',
        adminPkgDescription: '',
        adminPkgInclusionsText: '',
        adminPkgPriceMin: '',
        adminPkgPriceMax: '',
      }));
    },
    adminRemovePackage: (i) => patch((s) => ({ adminPackages: (s.adminPackages || []).filter((_, idx) => idx !== i) })),
    adminStep4Next: () => patch({ adminStep: 5 }),

    adminFaqs: st.adminFaqs || [],
    setAdminFaqQ: (i, e) =>
      patch((s) => ({
        adminFaqs: (s.adminFaqs || []).map((f, idx) => (idx === i ? { ...f, q: e.target.value } : f)),
      })),
    setAdminFaqA: (i, e) =>
      patch((s) => ({
        adminFaqs: (s.adminFaqs || []).map((f, idx) => (idx === i ? { ...f, a: e.target.value } : f)),
      })),
    adminAddFaqRow: () => patch((s) => ({ adminFaqs: (s.adminFaqs || []).concat([{ q: '', a: '' }]) })),
    adminRemoveFaqRow: (i) => patch((s) => ({ adminFaqs: (s.adminFaqs || []).filter((_, idx) => idx !== i) })),
    adminStep5Next: () => patch({ adminStep: 6 }),

    adminPaymentTerms: st.adminPaymentTerms || '',
    setAdminPaymentTerms: (e) => patch({ adminPaymentTerms: e.target.value }),
    adminDepositTerms: st.adminDepositTerms || '',
    setAdminDepositTerms: (e) => patch({ adminDepositTerms: e.target.value }),
    adminReschedulePolicy: st.adminReschedulePolicy || '',
    setAdminReschedulePolicy: (e) => patch({ adminReschedulePolicy: e.target.value }),
    adminCancellationPolicy: st.adminCancellationPolicy || '',
    setAdminCancellationPolicy: (e) => patch({ adminCancellationPolicy: e.target.value }),
    adminStep6Next: () => patch({ adminStep: 7 }),

    adminSaving: !!st.adminSaving,
    adminSaveError: st.adminSaveError || '',
    adminSaveVendor: async (published) => {
      if (st.adminSaving) return;
      patch({ adminSaving: true, adminSaveError: null });
      try {
        await adminCreateVendor({
          categoryCode: st.adminCategoryCode,
          name: (st.adminName || '').trim(),
          city: (st.adminCity || '').trim(),
          region: st.adminRegion,
          bio: (st.adminBio || '').trim(),
          description: (st.adminDescription || '').trim(),
          phone: (st.adminWhatsapp || '').trim(),
          coverUrl: (st.adminCoverUrl || '').trim(),
          logoUrl: (st.adminLogoUrl || '').trim(),
          gallery: st.adminGallery || [],
          packages: st.adminPackages || [],
          faqs: (st.adminFaqs || []).filter((f) => f.q.trim() && f.a.trim()),
          paymentTerms: (st.adminPaymentTerms || '').trim(),
          depositTerms: (st.adminDepositTerms || '').trim(),
          reschedulePolicy: (st.adminReschedulePolicy || '').trim(),
          cancellationPolicy: (st.adminCancellationPolicy || '').trim(),
          published,
        });
        patch({ adminSaving: false, adminSubScreen: 'dashboard' });
        loadCatalog();
      } catch (err) {
        patch({ adminSaving: false, adminSaveError: err.message || 'Could not save this vendor.' });
      }
    },

    isVendorOnboarding: st.screen === 'vendor-onboarding',
    goVendorOnboarding: () =>
      patch({
        screen: 'vendor-onboarding',
        voStep: 1,
        voDone: false,
        voVendorId: null,
        voSector: null,
        voSubcategory: '',
        voBusinessName: '',
        voContactPerson: '',
        voCity: null,
        voStartingPrice: '',
        voEmail: '',
        voPhone: '',
        voPassword: '',
        voConfirmPassword: '',
        voAgreeTerms: false,
        voAgreePrivacy: false,
        voStep1Error: null,
        voCoverUrl: '',
        voLogoUrl: '',
        voAbout: '',
        voInstagram: '',
        voTiktok: '',
        voMapLink: '',
        voAlbums: [],
        voAlbumName: '',
        voPackages: [],
        voPkgName: '',
        voPkgPhotoUrl: '',
        voPkgDescription: '',
        voPkgInclusionsText: '',
        voPkgPriceMin: '',
        voPkgPriceMax: '',
        voMenu: [],
        voMenuDraft: '',
        voFaqs: [],
        voPolicies: [],
        voStep2Error: null,
        navMenuOpen: false,
      }),
    voStep: st.voStep || 1,
    voDone: !!st.voDone,

    voSectorTiles: CATS.map((c) => ({
      code: c[0],
      name: c[1],
      on: st.voSector === c[0],
      pick: () => patch({ voSector: c[0] }),
    })),
    voSubcategory: st.voSubcategory || '',
    setVoSubcategory: (e) => patch({ voSubcategory: e.target.value }),
    voBusinessName: st.voBusinessName || '',
    setVoBusinessName: (e) => patch({ voBusinessName: e.target.value }),
    voContactPerson: st.voContactPerson || '',
    setVoContactPerson: (e) => patch({ voContactPerson: e.target.value }),
    voCityTiles: LOCATIONS.filter((l) => l !== 'All areas').map((l) => ({
      label: l,
      on: st.voCity === l,
      pick: () => patch({ voCity: l }),
    })),
    voStartingPrice: st.voStartingPrice || '',
    setVoStartingPrice: (e) => patch({ voStartingPrice: e.target.value }),
    voEmail: st.voEmail || '',
    setVoEmail: (e) => patch({ voEmail: e.target.value }),
    voPhone: st.voPhone || '',
    setVoPhone: (e) => patch({ voPhone: e.target.value }),
    voPassword: st.voPassword || '',
    setVoPassword: (e) => patch({ voPassword: e.target.value }),
    voConfirmPassword: st.voConfirmPassword || '',
    setVoConfirmPassword: (e) => patch({ voConfirmPassword: e.target.value }),
    voAgreeTerms: !!st.voAgreeTerms,
    toggleVoAgreeTerms: () => patch((s) => ({ voAgreeTerms: !s.voAgreeTerms })),
    voAgreePrivacy: !!st.voAgreePrivacy,
    toggleVoAgreePrivacy: () => patch((s) => ({ voAgreePrivacy: !s.voAgreePrivacy })),
    voStep1Submitting: !!st.voStep1Submitting,
    voStep1Error: st.voStep1Error || '',
    voStep1Disabled: !(
      st.voSector &&
      (st.voBusinessName || '').trim() &&
      (st.voContactPerson || '').trim() &&
      st.voCity &&
      (st.voEmail || '').trim() &&
      (st.voPhone || '').trim() &&
      (st.voPassword || '').length >= 6 &&
      st.voPassword === st.voConfirmPassword &&
      st.voAgreeTerms &&
      st.voAgreePrivacy
    ),
    voStep1Next: async () => {
      const name = (st.voBusinessName || '').trim();
      const contactPerson = (st.voContactPerson || '').trim();
      const email = (st.voEmail || '').trim();
      const phone = (st.voPhone || '').trim();
      if (
        !st.voSector ||
        !name ||
        !contactPerson ||
        !st.voCity ||
        !email ||
        !phone ||
        (st.voPassword || '').length < 6 ||
        st.voPassword !== st.voConfirmPassword ||
        !st.voAgreeTerms ||
        !st.voAgreePrivacy ||
        st.voStep1Submitting
      ) {
        return;
      }
      patch({ voStep1Submitting: true, voStep1Error: null });
      try {
        const vendorId = await createVendorAccount({
          categoryCode: st.voSector,
          subcategory: (st.voSubcategory || '').trim(),
          name,
          contactPerson,
          country: 'Trinidad and Tobago',
          city: st.voCity,
          email,
          phone,
          password: st.voPassword,
          startingPrice: st.voStartingPrice ? Number(st.voStartingPrice) : null,
        });
        patch({
          voStep1Submitting: false,
          voVendorId: vendorId,
          voStep: 2,
          voMapLink: '',
        });
      } catch (err) {
        patch({ voStep1Submitting: false, voStep1Error: err.message || 'Could not create your account. Please try again.' });
      }
    },

    voCoverUrl: st.voCoverUrl || '',
    voUploadingCover: !!st.voUploadingCover,
    uploadVoCover: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ voUploadingCover: true, voStep2Error: null });
      try {
        const url = await uploadVendorMedia(file);
        patch({ voUploadingCover: false, voCoverUrl: url });
      } catch (err) {
        patch({ voUploadingCover: false, voStep2Error: err.message || 'Could not upload that photo.' });
      }
    },
    voLogoUrl: st.voLogoUrl || '',
    voUploadingLogo: !!st.voUploadingLogo,
    uploadVoLogo: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ voUploadingLogo: true, voStep2Error: null });
      try {
        const url = await uploadVendorMedia(file);
        patch({ voUploadingLogo: false, voLogoUrl: url });
      } catch (err) {
        patch({ voUploadingLogo: false, voStep2Error: err.message || 'Could not upload that photo.' });
      }
    },
    voAbout: st.voAbout || '',
    setVoAbout: (e) => patch({ voAbout: e.target.value }),
    voInstagram: st.voInstagram || '',
    setVoInstagram: (e) => patch({ voInstagram: e.target.value }),
    voTiktok: st.voTiktok || '',
    setVoTiktok: (e) => patch({ voTiktok: e.target.value }),
    voMapLink: st.voMapLink || '',
    setVoMapLink: (e) => patch({ voMapLink: e.target.value }),

    voAlbums: st.voAlbums || [],
    voAlbumName: st.voAlbumName || '',
    setVoAlbumName: (e) => patch({ voAlbumName: e.target.value }),
    suggestedAlbumChips: SUGGESTED_ALBUMS.map((name) => ({ name, pick: () => patch({ voAlbumName: name }) })),
    voUploadingAlbumPhoto: !!st.voUploadingAlbumPhoto,
    uploadVoAlbumPhoto: async (e) => {
      const file = e.target.files && e.target.files[0];
      const albumName = (st.voAlbumName || '').trim();
      if (!file || !albumName) return;
      patch({ voUploadingAlbumPhoto: true, voStep2Error: null });
      try {
        const url = await uploadVendorMedia(file);
        patch((s) => {
          const albums = s.voAlbums || [];
          const existing = albums.find((a) => a.name === albumName);
          return {
            voUploadingAlbumPhoto: false,
            voAlbums: existing
              ? albums.map((a) => (a.name === albumName ? { ...a, photos: a.photos.concat([url]) } : a))
              : albums.concat([{ name: albumName, photos: [url] }]),
          };
        });
      } catch (err) {
        patch({ voUploadingAlbumPhoto: false, voStep2Error: err.message || 'Could not upload that photo.' });
      }
    },
    removeVoAlbum: (name) => patch((s) => ({ voAlbums: (s.voAlbums || []).filter((a) => a.name !== name) })),

    voPackages: st.voPackages || [],
    voPkgName: st.voPkgName || '',
    setVoPkgName: (e) => patch({ voPkgName: e.target.value }),
    suggestedPackageChips: SUGGESTED_PACKAGES.map((name) => ({ name, pick: () => patch({ voPkgName: name }) })),
    voPkgPhotoUrl: st.voPkgPhotoUrl || '',
    voUploadingPkgPhoto: !!st.voUploadingPkgPhoto,
    uploadVoPkgPhoto: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ voUploadingPkgPhoto: true, voStep2Error: null });
      try {
        const url = await uploadVendorMedia(file);
        patch({ voUploadingPkgPhoto: false, voPkgPhotoUrl: url });
      } catch (err) {
        patch({ voUploadingPkgPhoto: false, voStep2Error: err.message || 'Could not upload that photo.' });
      }
    },
    voPkgDescription: st.voPkgDescription || '',
    setVoPkgDescription: (e) => patch({ voPkgDescription: e.target.value }),
    voPkgInclusionsText: st.voPkgInclusionsText || '',
    setVoPkgInclusionsText: (e) => patch({ voPkgInclusionsText: e.target.value }),
    voPkgPriceMin: st.voPkgPriceMin || '',
    setVoPkgPriceMin: (e) => patch({ voPkgPriceMin: e.target.value }),
    voPkgPriceMax: st.voPkgPriceMax || '',
    setVoPkgPriceMax: (e) => patch({ voPkgPriceMax: e.target.value }),
    voAddPackageDisabled: !(
      (st.voPkgName || '').trim() &&
      Number(st.voPkgPriceMin) > 0 &&
      Number(st.voPkgPriceMax) >= Number(st.voPkgPriceMin)
    ),
    voAddPackage: () => {
      const name = (st.voPkgName || '').trim();
      const priceMin = Number(st.voPkgPriceMin);
      const priceMax = Number(st.voPkgPriceMax);
      if (!name || !(priceMin > 0) || !(priceMax >= priceMin)) return;
      patch((s) => ({
        voPackages: (s.voPackages || []).concat([
          {
            name,
            photoUrl: (s.voPkgPhotoUrl || '').trim(),
            description: (s.voPkgDescription || '').trim(),
            inclusions: (s.voPkgInclusionsText || '')
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean),
            priceMin,
            priceMax,
            unit: 'event',
          },
        ]),
        voPkgName: '',
        voPkgPhotoUrl: '',
        voPkgDescription: '',
        voPkgInclusionsText: '',
        voPkgPriceMin: '',
        voPkgPriceMax: '',
      }));
    },
    removeVoPackage: (i) => patch((s) => ({ voPackages: (s.voPackages || []).filter((_, idx) => idx !== i) })),

    voMenu: st.voMenu || [],
    voMenuDraft: st.voMenuDraft || '',
    setVoMenuDraft: (e) => patch({ voMenuDraft: e.target.value }),
    voAddMenuItem: () => {
      const name = (st.voMenuDraft || '').trim();
      if (!name) return;
      patch((s) => ({ voMenu: (s.voMenu || []).concat([name]), voMenuDraft: '' }));
    },
    removeVoMenuItem: (i) => patch((s) => ({ voMenu: (s.voMenu || []).filter((_, idx) => idx !== i) })),

    voFaqs: st.voFaqs || [],
    suggestedFaqChips: SUGGESTED_FAQS.filter((q) => !(st.voFaqs || []).some((f) => f.q === q)).map((q) => ({
      q,
      pick: () => patch((s) => ({ voFaqs: (s.voFaqs || []).concat([{ q, a: '' }]) })),
    })),
    voAddFaqRow: () => patch((s) => ({ voFaqs: (s.voFaqs || []).concat([{ q: '', a: '' }]) })),
    setVoFaqQ: (i, e) =>
      patch((s) => ({ voFaqs: (s.voFaqs || []).map((f, idx) => (idx === i ? { ...f, q: e.target.value } : f)) })),
    setVoFaqA: (i, e) =>
      patch((s) => ({ voFaqs: (s.voFaqs || []).map((f, idx) => (idx === i ? { ...f, a: e.target.value } : f)) })),
    removeVoFaq: (i) => patch((s) => ({ voFaqs: (s.voFaqs || []).filter((_, idx) => idx !== i) })),

    voPolicies: st.voPolicies || [],
    suggestedPolicyChips: SUGGESTED_POLICIES.filter(
      (title) => !(st.voPolicies || []).some((p) => p.title === title)
    ).map((title) => ({
      title,
      pick: () => patch((s) => ({ voPolicies: (s.voPolicies || []).concat([{ title, body: '' }]) })),
    })),
    voAddPolicyRow: () => patch((s) => ({ voPolicies: (s.voPolicies || []).concat([{ title: '', body: '' }]) })),
    setVoPolicyTitle: (i, e) =>
      patch((s) => ({
        voPolicies: (s.voPolicies || []).map((p, idx) => (idx === i ? { ...p, title: e.target.value } : p)),
      })),
    setVoPolicyBody: (i, e) =>
      patch((s) => ({
        voPolicies: (s.voPolicies || []).map((p, idx) => (idx === i ? { ...p, body: e.target.value } : p)),
      })),
    removeVoPolicy: (i) => patch((s) => ({ voPolicies: (s.voPolicies || []).filter((_, idx) => idx !== i) })),

    voStep2Submitting: !!st.voStep2Submitting,
    voStep2Error: st.voStep2Error || '',
    voSubmitApplication: async () => {
      if (st.voStep2Submitting || !st.voVendorId) return;
      patch({ voStep2Submitting: true, voStep2Error: null });
      try {
        await submitVendorOnboarding(st.voVendorId, {
          bio: st.voAbout || '',
          description: st.voAbout || '',
          logoUrl: st.voLogoUrl || '',
          coverUrl: st.voCoverUrl || '',
          instagram: st.voInstagram || '',
          tiktok: st.voTiktok || '',
          mapLink: st.voMapLink || '',
          albums: st.voAlbums || [],
          packages: st.voPackages || [],
          menu: st.voMenu || [],
          faqs: (st.voFaqs || []).filter((f) => f.q.trim() && f.a.trim()),
          policies: (st.voPolicies || []).filter((p) => p.title.trim() && p.body.trim()),
        });
        patch({ voStep2Submitting: false, voDone: true });
      } catch (err) {
        patch({ voStep2Submitting: false, voStep2Error: err.message || 'Could not submit your application. Please try again.' });
      }
    },
  };

  return (
    <>
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: isMobile ? '0 16px 64px' : '0 28px 96px' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: '#FFFFFF',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            rowGap: 10,
            gap: 24,
            padding: '18px 0 16px',
            borderBottom: '1px solid #ECECEC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', columnGap: isMobile ? 14 : 32, flexWrap: 'wrap', rowGap: 8 }}>
            <button
              onClick={V.goHome}
              style={{
                border: 0,
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              Eventory
            </button>
            {isMobile ? (
              <button
                onClick={V.toggleNavMenu}
                aria-label="Menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  marginLeft: -8,
                  border: 0,
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 20,
                  color: '#171717',
                  lineHeight: 1,
                }}
              >
                {V.navMenuOpen ? '✕' : '☰'}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', columnGap: 22, flexWrap: 'wrap', rowGap: 6 }}>
                <button
                  onClick={V.goSuppliers}
                  style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#5B5B5B' }}
                >
                  Vendors
                </button>
                <button
                  onClick={V.goCategories}
                  style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#5B5B5B' }}
                >
                  Categories
                </button>
                <button
                  onClick={V.goHowItWorks}
                  style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#5B5B5B' }}
                >
                  How It Works
                </button>
              </div>
            )}
          </div>
          {isMobile && V.navMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                minWidth: 220,
                border: '1px solid #ECECEC',
                borderRadius: 16,
                background: '#FFFFFF',
                boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 22,
              }}
            >
              <button
                onClick={V.goSuppliers}
                style={{ border: 0, borderRadius: 10, background: 'transparent', padding: '12px 14px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#171717', textAlign: 'left' }}
              >
                Vendors
              </button>
              <button
                onClick={V.goCategories}
                style={{ border: 0, borderRadius: 10, background: 'transparent', padding: '12px 14px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#171717', textAlign: 'left' }}
              >
                Categories
              </button>
              <button
                onClick={V.goHowItWorks}
                style={{ border: 0, borderRadius: 10, background: 'transparent', padding: '12px 14px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#171717', textAlign: 'left' }}
              >
                How It Works
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={V.goAccount}
            aria-label={V.accountLabel}
            title={V.accountLabel}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              border: 0,
              borderRadius: 999,
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              color: V.isSignedIn ? '#6E6E6E' : '#171717',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button
            onClick={V.goEventory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '1px solid #171717',
              borderRadius: 999,
              background: V.counterBg,
              color: V.counterFg,
              padding: '9px 8px 9px 18px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Request
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 26,
                height: 26,
                padding: '0 8px',
                borderRadius: 999,
                background: '#171717',
                color: '#FFFFFF',
                fontFamily: MONO,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {V.itemCount}
            </span>
          </button>
          </div>
        </div>
        {isMobile && V.navMenuOpen && (
          <div
            onClick={V.closeNavMenu}
            style={{ position: 'fixed', inset: 0, zIndex: 19, background: 'transparent' }}
          />
        )}
      </div>

      {V.isHome && (
        <div>
          <div style={{ marginTop: isMobile ? 8 : 4, fontFamily: MONO, fontSize: isMobile ? 10.5 : 11.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7a7a7a' }}>
            Discovery and sourcing for events
          </div>

          <div
            style={{
              position: 'relative',
              isolation: 'isolate',
              marginTop: 18,
              borderRadius: 28,
              overflow: 'hidden',
              background: '#141414',
            }}
          >
            <img
              src={heroPhoto}
              alt="Friends cheering and dancing together under a festival tent"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)' }} />
            <div style={{ position: 'relative', mixBlendMode: 'lighten', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#FFFFFF', padding: isMobile ? '18px 16px 20px' : '26px 28px 30px' }}>
                <div
                  style={{
                    fontFamily: DISPLAY_BLACK,
                    fontSize: isMobile ? 'clamp(40px, 15vw, 90px)' : 'clamp(64px, 15.5vw, 300px)',
                    lineHeight: 0.82,
                    letterSpacing: '-0.045em',
                    textTransform: 'uppercase',
                    color: '#000000',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Eventory
                </div>
              </div>
              <div style={{ height: isMobile ? 190 : 300 }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingTop: 26 }}>
            <button
              onClick={V.startPlanning}
              style={{
                flex: isMobile ? '1 1 auto' : '0 0 auto',
                border: 0,
                borderRadius: 999,
                background: ACCENT,
                color: '#FFFFFF',
                padding: '15px 32px',
                cursor: 'pointer',
                fontFamily: DISPLAY,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Start Planning
            </button>
            <button
              onClick={V.goVendorOnboarding}
              style={{
                flex: isMobile ? '1 1 auto' : '0 0 auto',
                border: 0,
                borderRadius: 999,
                background: '#171717',
                color: '#FFFFFF',
                padding: '15px 32px',
                cursor: 'pointer',
                fontFamily: DISPLAY,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Join as a Vendor
            </button>
          </div>

          <div style={{ marginTop: 30, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#171717' }}>What are you looking for?</div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E4E4DF', borderRadius: 999, background: '#F7F7F5', padding: '6px 8px 6px 18px' }}>
              <span style={{ fontSize: 15, color: '#9A9A9A', flexShrink: 0 }}>🔍</span>
              <input
                type="search"
                value={V.homeQuery}
                onChange={V.setHomeQuery}
                onKeyDown={V.homeSearchKeyDown}
                placeholder="Caterers, photographers, venues..."
                style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', padding: '9px 0', fontFamily: SANS, fontSize: 14, color: '#171717' }}
              />
              <button
                onClick={V.runHomeSearch}
                style={{
                  flexShrink: 0,
                  border: 0,
                  borderRadius: 999,
                  background: '#171717',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Search
              </button>
            </div>
          </div>

          <div id="top-categories" style={{ padding: isMobile ? '48px 0 0' : '84px 0 0', scrollMarginTop: 100 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 800 }}>Browse by category</h2>
              <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B' }}>
                  Pick the category that fits your event to see who's available.
                </p>
                <button
                  onClick={V.runHomeSearch}
                  style={{
                    marginTop: 8,
                    border: 0,
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: MONO,
                    fontSize: 13,
                    fontWeight: 700,
                    color: CTA_ACCENT,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  View all categories →
                </button>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {V.topCategoryTiles.map((c) => (
                <button
                  key={c.code}
                  onClick={c.open}
                  style={{
                    position: 'relative',
                    isolation: 'isolate',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    textAlign: 'left',
                    border: 0,
                    borderRadius: 20,
                    padding: 18,
                    cursor: 'pointer',
                    minHeight: 148,
                    background: '#171717',
                  }}
                >
                  <img
                    src={c.photo}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)',
                    }}
                  />
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, color: '#FFFFFF' }}>{c.name}</div>
                    <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{c.supplierLabel}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div id="featured-vendors" style={{ padding: isMobile ? '48px 0 0' : '84px 0 0', scrollMarginTop: 100 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 800 }}>Featured Vendors</h2>
              <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B' }}>
                From birthday parties to corporate functions, here's who's ready to help.
              </p>
            </div>
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {V.topSuppliers.map((s) => (
                <button
                  key={s.key}
                  onClick={s.open}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'left',
                    gap: 10,
                    border: '1px solid #ECECEC',
                    borderRadius: 20,
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    padding: isMobile ? '16px 14px' : '20px 18px',
                  }}
                >
                  <img
                    src={s.logo}
                    alt={s.name + ' logo'}
                    style={{ width: 52, height: 52, borderRadius: 999, background: '#171717' }}
                  />
                  <div>
                    <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, letterSpacing: '-0.01em' }}>{s.name}</div>
                    <div style={{ marginTop: 2, fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{s.location}</div>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#F7F7F5',
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#4A4A4A',
                      }}
                    >
                      {s.categoryName}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>★ {s.rating}</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={V.runHomeSearch}
              style={{
                marginTop: 16,
                border: `1px solid ${CTA_ACCENT}55`,
                borderRadius: 999,
                background: 'transparent',
                padding: '11px 20px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: CTA_ACCENT,
              }}
            >
              Explore all →
            </button>
          </div>

          <div style={{ padding: isMobile ? '48px 0 0' : '84px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 800 }}>Featured Offerings</h2>
              <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B' }}>
                Explore products, packages, rentals and services from event vendors.
              </p>
            </div>
            <div
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              {V.featuredProducts.map((f) => (
                <div
                  key={f.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #ECECEC',
                    borderRadius: 20,
                    overflow: 'hidden',
                    background: '#FFFFFF',
                  }}
                >
                  <button
                    onClick={f.open}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'left',
                      border: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 0,
                      width: '100%',
                    }}
                  >
                    <img
                      src={f.photo}
                      alt={f.name}
                      style={{ width: '100%', height: isMobile ? 110 : 150, objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ padding: isMobile ? '12px 14px 0' : '16px 18px 0' }}>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: '#9A9A9A' }}>{f.supplierName}</div>
                      <div style={{ marginTop: 4, fontSize: isMobile ? 14 : 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{f.name}</div>
                      <div style={{ marginTop: 10 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            border: '1px solid #E4E4DF',
                            borderRadius: 999,
                            background: '#F7F7F5',
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#4A4A4A',
                          }}
                        >
                          {f.categoryName}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div
                    style={{
                      marginTop: 10,
                      padding: isMobile ? '0 14px 16px' : '0 18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: isMobile ? 12 : 14, fontWeight: 700 }}>{f.priceLabel}</span>
                    <button
                      onClick={f.add}
                      style={{
                        flexShrink: 0,
                        border: 0,
                        borderRadius: 999,
                        background: f.btnBg,
                        color: f.btnFg,
                        padding: '7px 14px',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {f.btnLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={V.runHomeSearch}
              style={{
                marginTop: 16,
                border: `1px solid ${CTA_ACCENT}55`,
                borderRadius: 999,
                background: 'transparent',
                padding: '11px 20px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: CTA_ACCENT,
              }}
            >
              See more offerings
            </button>
          </div>

          <div id="how-it-works" style={{ padding: isMobile ? '48px 0 0' : '84px 0 0', scrollMarginTop: 100 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 800 }}>How Eventory Works</h2>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  background: ACCENT,
                  color: ACCENT_ON,
                  padding: isMobile ? '20px 22px' : '28px 32px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 720 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Discover</div>
                  <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: ACCENT_ON_SOFT }}>
                    Choose your event and browse vendors and what they offer.
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 34, color: ACCENT_ON_MUTED }}>01</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  background: '#171717',
                  padding: isMobile ? '20px 22px' : '28px 32px',
                  color: '#FFFFFF',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 720 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Build your Broadcast Request</div>
                  <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: '#A8A8A8' }}>
                    Add what you need from multiple vendors as you browse. Only need one? Message them on
                    WhatsApp straight from their profile instead.
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 34, color: '#4A4A4A' }}>02</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  background: '#F2F2F0',
                  padding: isMobile ? '20px 22px' : '28px 32px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 720 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Connect</div>
                  <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: '#4A4A4A' }}>
                    Fill in your details once, then send to everyone on your list at the same time. Each vendor
                    messages you back directly with availability, pricing and details.
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 34, color: '#C2C2BC' }}>03</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  border: '1px solid #ECECEC',
                  padding: isMobile ? '20px 22px' : '28px 32px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 720 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Can't find what you need?</div>
                  <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: '#4A4A4A' }}>
                    Tell us what you're looking for and we'll help you find it.
                  </div>
                  <button
                    onClick={V.goSourcing}
                    style={{
                      marginTop: 16,
                      border: 0,
                      borderRadius: 999,
                      background: '#171717',
                      color: '#FFFFFF',
                      padding: '13px 22px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    Source
                  </button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, fontSize: 14, color: '#5B5B5B' }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                Note
              </span>
              Eventory does not process payments. You deal directly with each vendor.
            </div>
          </div>
        </div>
      )}

      {V.isCategory && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← All categories
          </button>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>{V.cat.name}</h1>
              <p style={{ margin: '12px 0 0', maxWidth: 560, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B' }}>{V.cat.description}</p>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{V.resultLabel}</div>
          </div>

          <div
            style={{
              marginTop: 26,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              borderTop: '1px solid #ECECEC',
              borderBottom: '1px solid #ECECEC',
              padding: '16px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                Location
              </span>
              {V.locationFilters.map((f) => (
                <button
                  key={f.label}
                  onClick={f.pick}
                  style={{
                    border: `1px solid ${f.border}`,
                    borderRadius: 999,
                    background: f.bg,
                    color: f.fg,
                    padding: '7px 14px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                Group size
              </span>
              {V.groupFilters.map((f) => (
                <button
                  key={f.label}
                  onClick={f.pick}
                  style={{
                    border: `1px solid ${f.border}`,
                    borderRadius: 999,
                    background: f.bg,
                    color: f.fg,
                    padding: '7px 14px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {V.supplierRows.map((s) => (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 28,
                  flexWrap: 'wrap',
                  border: '1px solid #ECECEC',
                  borderRadius: 22,
                  padding: '22px 24px',
                }}
              >
                <div style={{ flex: '1 1 380px', minWidth: 280, display: 'flex', gap: 16 }}>
                  <img
                    src={s.logo}
                    alt={s.name + ' logo'}
                    style={{ width: 52, height: 52, borderRadius: 999, flexShrink: 0, background: '#171717' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.name}</div>
                      <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{s.location}</div>
                    </div>
                    <p style={{ margin: '8px 0 0', maxWidth: 560, fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>{s.description}</p>
                    <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            border: '1px solid #E4E4DF',
                            borderRadius: 999,
                            background: '#F7F7F5',
                            padding: '5px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#4A4A4A',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    flex: isMobile ? '1 1 100%' : '0 0 220px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    alignItems: isMobile ? 'stretch' : 'flex-end',
                  }}
                >
                  <button
                    onClick={s.open}
                    style={{
                      border: 0,
                      borderRadius: 999,
                      background: '#171717',
                      color: '#FFFFFF',
                      padding: '12px 20px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    See Profile
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
              borderRadius: 22,
              background: '#F2F2F0',
              padding: '22px 26px',
            }}
          >
            <div style={{ fontSize: 15, color: '#4A4A4A' }}>Nothing here fits? Tell us what you need and we will go find it.</div>
            <button
              onClick={V.goSourcing}
              style={{
                border: '1px solid #171717',
                borderRadius: 999,
                background: 'transparent',
                padding: '11px 20px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Submit a sourcing request
            </button>
          </div>
        </div>
      )}

      {V.isSuppliers && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Home
          </button>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>Discover Vendors</h1>
              <p style={{ margin: '12px 0 0', maxWidth: 560, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B' }}>
                Browse every vendor on Eventory, or narrow down by category, location and price.
              </p>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{V.dirResultLabel}</div>
          </div>

          {V.dirPlanLabel && (
            <div style={{ marginTop: 14, display: 'flex' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid #171717',
                  borderRadius: 999,
                  background: '#171717',
                  color: '#FFFFFF',
                  padding: '7px 8px 7px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Showing vendors for {V.dirPlanLabel}
                <button
                  onClick={V.clearDirPlan}
                  aria-label="Clear planned event filter"
                  style={{
                    border: 0,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.15)',
                    color: '#FFFFFF',
                    width: 20,
                    height: 20,
                    lineHeight: '20px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              </span>
            </div>
          )}

          <div
            style={{
              marginTop: 26,
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 16 : 14,
              borderTop: '1px solid #ECECEC',
              borderBottom: '1px solid #ECECEC',
              padding: '16px 0',
            }}
          >
            <input
              type="search"
              value={V.dirQuery}
              onChange={V.setDirQuery}
              placeholder="Search vendors or products..."
              style={{
                border: '1px solid #E4E4DF',
                borderRadius: 999,
                background: '#F7F7F5',
                padding: '11px 16px',
                fontFamily: SANS,
                fontSize: 14,
                color: '#171717',
              }}
            />
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                Category
              </span>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={V.toggleDirCatMenu}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: `1px solid ${V.dirCatMenuOpen || st.dirCat !== 'ALL' ? '#171717' : '#D7D7D2'}`,
                    borderRadius: 999,
                    background: st.dirCat !== 'ALL' ? '#171717' : '#FFFFFF',
                    color: st.dirCat !== 'ALL' ? '#FFFFFF' : '#171717',
                    padding: isMobile ? '9px 14px' : '9px 16px',
                    cursor: 'pointer',
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 600,
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: isMobile ? 'space-between' : 'flex-start',
                  }}
                >
                  {V.dirCategoryLabel}
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{V.dirCatMenuOpen ? '▲' : '▼'}</span>
                </button>
                {V.dirCatMenuOpen && (
                  <>
                    <div
                      onClick={V.closeDirCatMenu}
                      style={{ position: 'fixed', inset: 0, zIndex: 19, background: 'transparent' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        width: isMobile ? '100%' : 320,
                        maxHeight: 360,
                        overflowY: 'auto',
                        border: '1px solid #ECECEC',
                        borderRadius: 16,
                        background: '#FFFFFF',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                        padding: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 22,
                      }}
                    >
                      {V.dirCategoryFilters.map((f) => (
                        <button
                          key={f.code}
                          onClick={f.pick}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            border: 0,
                            borderRadius: 10,
                            background: f.on ? '#F7F7F5' : 'transparent',
                            padding: '11px 14px',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: f.on ? 700 : 500,
                            color: '#171717',
                            textAlign: 'left',
                          }}
                        >
                          <span>{f.label}</span>
                          <span style={{ fontFamily: MONO, fontSize: 11, color: f.on ? '#171717' : '#9A9A9A' }}>{f.countLabel}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: isMobile ? 'nowrap' : 'wrap', gap: isMobile ? 16 : 20, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                  Location
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: isMobile ? 'nowrap' : 'wrap',
                    overflowX: isMobile ? 'auto' : 'visible',
                    WebkitOverflowScrolling: 'touch',
                    paddingBottom: isMobile ? 2 : 0,
                    minWidth: 0,
                  }}
                >
                  {V.dirLocationFilters.map((f) => (
                    <button
                      key={f.label}
                      onClick={f.pick}
                      style={{
                        border: `1px solid ${f.border}`,
                        borderRadius: 999,
                        background: f.bg,
                        color: f.fg,
                        padding: isMobile ? '6px 12px' : '7px 14px',
                        cursor: 'pointer',
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: 600,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                  Price
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: isMobile ? 'nowrap' : 'wrap',
                    overflowX: isMobile ? 'auto' : 'visible',
                    WebkitOverflowScrolling: 'touch',
                    paddingBottom: isMobile ? 2 : 0,
                    minWidth: 0,
                  }}
                >
                  {V.dirPriceFilters.map((f) => (
                    <button
                      key={f.label}
                      onClick={f.pick}
                      style={{
                        border: `1px solid ${f.border}`,
                        borderRadius: 999,
                        background: f.bg,
                        color: f.fg,
                        padding: isMobile ? '6px 12px' : '7px 14px',
                        cursor: 'pointer',
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: 600,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {V.dirSupplierRows.map((s) => (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 28,
                  flexWrap: 'wrap',
                  border: '1px solid #ECECEC',
                  borderRadius: 22,
                  padding: '22px 24px',
                }}
              >
                <div style={{ flex: '1 1 380px', minWidth: 280, display: 'flex', gap: 16 }}>
                  <img
                    src={s.logo}
                    alt={s.name + ' logo'}
                    style={{ width: 52, height: 52, borderRadius: 999, flexShrink: 0, background: '#171717' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.name}</div>
                      <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{s.location}</div>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span
                        style={{
                          border: '1px solid #E4E4DF',
                          borderRadius: 999,
                          background: '#F7F7F5',
                          padding: '4px 10px',
                          fontFamily: MONO,
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#4A4A4A',
                        }}
                      >
                        {s.categoryName}
                      </span>
                    </div>
                    <p style={{ margin: '10px 0 0', maxWidth: 560, fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>{s.description}</p>
                    <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            border: '1px solid #E4E4DF',
                            borderRadius: 999,
                            background: '#F7F7F5',
                            padding: '5px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#4A4A4A',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    flex: isMobile ? '1 1 100%' : '0 0 220px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    alignItems: isMobile ? 'stretch' : 'flex-end',
                  }}
                >
                  <button
                    onClick={s.open}
                    style={{
                      border: 0,
                      borderRadius: 999,
                      background: '#171717',
                      color: '#FFFFFF',
                      padding: '12px 20px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    See Profile
                  </button>
                </div>
              </div>
            ))}
            {V.dirSupplierRows.length === 0 && (
              <div style={{ padding: '28px 2px', fontSize: 14, color: '#9A9A9A' }}>No vendors match your search.</div>
            )}
          </div>

          {V.dirShowSeeAll && (
            <button
              onClick={V.seeAllDir}
              style={{
                marginTop: 16,
                border: '1px solid #D7D7D2',
                borderRadius: 999,
                background: 'transparent',
                padding: '11px 20px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: '#171717',
              }}
            >
              {V.dirSeeAllLabel}
            </button>
          )}

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
              borderRadius: 22,
              background: '#F2F2F0',
              padding: '22px 26px',
            }}
          >
            <div style={{ fontSize: 15, color: '#4A4A4A' }}>Nothing here fits? Tell us what you need and we will go find it.</div>
            <button
              onClick={V.goSourcing}
              style={{
                border: '1px solid #171717',
                borderRadius: 999,
                background: 'transparent',
                padding: '11px 20px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Submit a sourcing request
            </button>
          </div>
        </div>
      )}

      {V.isSupplier && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.backToCategory}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← {V.sup.categoryName}
          </button>
          <div style={{ marginTop: 22, borderRadius: 24, overflow: 'hidden', height: isMobile ? 140 : 220 }}>
            <img
              src={V.sup.cover}
              alt={V.sup.name + ' cover photo'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: 20, alignItems: 'start' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ border: '1px solid #ECECEC', borderRadius: 24, padding: isMobile ? 20 : 28 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <img
                    src={V.sup.logo}
                    alt={V.sup.name + ' logo'}
                    style={{ width: 64, height: 64, borderRadius: 999, marginTop: -50, border: '4px solid #FFFFFF', background: '#171717', flexShrink: 0 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? 26 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>{V.sup.name}</h1>
                    {V.sup.verified && (
                      <span
                        title="Verified vendor"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          border: '1px solid #171717',
                          borderRadius: 999,
                          background: '#171717',
                          color: '#FFFFFF',
                          padding: '4px 11px',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span
                    style={{
                      border: '1px solid #E4E4DF',
                      borderRadius: 999,
                      background: '#F7F7F5',
                      padding: '6px 14px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#171717',
                    }}
                  >
                    {V.sup.categoryName}
                  </span>
                  {V.sup.ratingLabel && (
                    <span
                      style={{
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#F7F7F5',
                        padding: '6px 14px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: '#171717',
                      }}
                    >
                      ★ {V.sup.ratingLabel}
                    </span>
                  )}
                  <span
                    style={{
                      border: '1px solid #E4E4DF',
                      borderRadius: 999,
                      background: '#F7F7F5',
                      padding: '6px 14px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#171717',
                    }}
                  >
                    {V.sup.startPriceLabel}
                  </span>
                </div>
                <p style={{ margin: '14px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.55, color: '#4A4A4A' }}>{V.sup.description}</p>
                {V.sup.whatsappUrl && (
                  <a
                    href={V.sup.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: 18,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      border: 0,
                      borderRadius: 999,
                      background: '#25D366',
                      color: '#FFFFFF',
                      padding: '13px 24px',
                      cursor: 'pointer',
                      fontFamily: DISPLAY,
                      fontSize: 15,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Message on WhatsApp →
                  </a>
                )}
                <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {V.sup.phone && (
                    <span
                      style={{
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#F7F7F5',
                        padding: '6px 14px',
                        fontFamily: MONO,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#171717',
                      }}
                    >
                      {V.sup.phone}
                    </span>
                  )}
                  {V.sup.social.map((s) => (
                    <span
                      key={s.key}
                      style={{
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#F7F7F5',
                        padding: '6px 14px',
                        fontFamily: MONO,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#171717',
                      }}
                    >
                      {s.label} · {s.value}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid #ECECEC', paddingBottom: 16 }}>
                {V.supplierTabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={t.go}
                    style={{
                      border: `1px solid ${t.active ? '#171717' : '#D7D7D2'}`,
                      borderRadius: 999,
                      background: t.active ? '#171717' : 'transparent',
                      color: t.active ? '#FFFFFF' : '#171717',
                      padding: '9px 16px',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {V.supplierTab === 'about' && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                    {V.sup.facts.map((f) => (
                      <div key={f.label} style={{ borderRadius: 16, background: '#F7F7F5', padding: '14px 16px' }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                          {f.label}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700 }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #ECECEC' }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      About {V.sup.name}
                    </div>
                    <p style={{ margin: '8px 0 0', maxWidth: 620, fontSize: 15, lineHeight: 1.6, color: '#4A4A4A' }}>{V.sup.about}</p>
                  </div>
                </div>
              )}

              {V.supplierTab === 'services' && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Packages</h2>
                    <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Adding does not send anything
                    </span>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <input
                      type="search"
                      value={V.svcQuery}
                      onChange={V.setSvcQuery}
                      placeholder="Search services"
                      style={{
                        flex: '1 1 220px',
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#F7F7F5',
                        padding: '11px 16px',
                        fontFamily: SANS,
                        fontSize: 14,
                        color: '#171717',
                      }}
                    />
                    <span style={{ fontFamily: MONO, fontSize: 11, color: '#9A9A9A', flexShrink: 0 }}>{V.svcResultLabel}</span>
                  </div>
                  {V.svcHasGroups && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.svcGroupFilters.map((f) => (
                        <button
                          key={f.label}
                          onClick={f.pick}
                          style={{
                            border: `1px solid ${f.border}`,
                            borderRadius: 999,
                            background: f.bg,
                            color: f.fg,
                            padding: '7px 14px',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {V.supplierProducts.map((p) => (
                      <div
                        key={p.key}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          border: '1px solid #ECECEC',
                          borderRadius: 20,
                          overflow: 'hidden',
                          background: '#FFFFFF',
                        }}
                      >
                        <img
                          src={p.photo}
                          alt={p.name}
                          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{p.name}</div>
                          <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>{p.description}</div>
                          {p.inclusions.length > 0 && (
                            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {p.inclusions.map((inc) => (
                                <li key={inc} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13.5, lineHeight: 1.5, color: '#4A4A4A' }}>
                                  <span style={{ flexShrink: 0, color: '#16A34A', fontWeight: 800 }}>✓</span>
                                  {inc}
                                </li>
                              ))}
                            </ul>
                          )}
                          <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 11, color: '#9A9A9A' }}>{p.termsLabel}</div>
                          <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 17, fontWeight: 700 }}>{p.priceLabel}</div>
                          <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              onClick={p.toggleSave}
                              aria-label={p.saveLabel}
                              style={{
                                border: '1px solid #D7D7D2',
                                borderRadius: 999,
                                background: p.saved ? '#171717' : 'transparent',
                                color: p.saved ? '#FFFFFF' : '#171717',
                                padding: '9px 14px',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {p.saveLabel}
                            </button>
                            <button
                              onClick={p.share}
                              style={{
                                border: '1px solid #D7D7D2',
                                borderRadius: 999,
                                background: 'transparent',
                                color: '#171717',
                                padding: '9px 14px',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {p.shareLabel}
                            </button>
                            <button
                              onClick={p.add}
                              style={{
                                marginLeft: 'auto',
                                border: '1px solid #171717',
                                borderRadius: 999,
                                background: p.btnBg,
                                color: p.btnFg,
                                padding: '11px 20px',
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 700,
                                minWidth: 92,
                              }}
                            >
                              {p.btnLabel}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {V.supplierProducts.length === 0 && (
                    <div style={{ padding: '28px 2px', fontSize: 14, color: '#9A9A9A' }}>No packages match your search.</div>
                  )}
                  {V.svcShowMore && (
                    <button
                      onClick={V.loadMoreSvc}
                      style={{
                        marginTop: 16,
                        border: '1px solid #D7D7D2',
                        borderRadius: 999,
                        background: 'transparent',
                        padding: '11px 20px',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#171717',
                      }}
                    >
                      {V.svcRemainingLabel}
                    </button>
                  )}
                </div>
              )}

              {V.supplierTab === 'gallery' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Gallery</h2>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {V.sup.gallery.map((g) => (
                      <div key={g.key}>
                        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                          {g.eventType}
                        </div>
                        <div
                          style={{
                            marginTop: 10,
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: 10,
                          }}
                        >
                          {g.photos.map((photo, i) => (
                            <img
                              key={photo + i}
                              src={photo}
                              alt={g.eventType + ' photo'}
                              style={{ width: '100%', height: 160, borderRadius: 14, objectFit: 'cover', display: 'block' }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {V.supplierTab === 'menu' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Menu</h2>
                  <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {V.sup.menuItems.map((name) => (
                      <span
                        key={name}
                        style={{
                          border: '1px solid #E4E4DF',
                          borderRadius: 999,
                          background: '#F7F7F5',
                          padding: '8px 16px',
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: '#171717',
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {V.supplierTab === 'reviews' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Reviews</h2>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {V.sup.reviews.map((r) => (
                      <div key={r.key} style={{ borderTop: '1px solid #ECECEC', padding: '18px 2px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{r.author}</div>
                          <div style={{ color: '#DDA915', fontSize: 14, letterSpacing: '2px' }}>{r.stars}</div>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>{r.text}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #ECECEC' }}>
                    {V.reviewSent ? (
                      <>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>Thanks for your review</div>
                        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                          We appreciate you taking the time to share your experience.
                        </p>
                      </>
                    ) : V.reviewFormOpen ? (
                      <>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>Write a review</div>
                        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                              Your name
                            </span>
                            <input
                              type="text"
                              placeholder="Your name"
                              value={V.reviewAuthor}
                              onChange={V.setReviewAuthor}
                              style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                            />
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                              Rating
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => V.setReviewStars(n)}
                                  style={{
                                    border: 0,
                                    background: 'transparent',
                                    padding: 0,
                                    cursor: 'pointer',
                                    fontSize: 26,
                                    lineHeight: 1,
                                    color: n <= V.reviewStars ? '#DDA915' : '#D8D8D2',
                                  }}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                              Your review
                            </span>
                            <textarea
                              placeholder="Share what it was like working with them."
                              value={V.reviewBody}
                              onChange={V.setReviewBody}
                              style={{
                                minHeight: 100,
                                border: '1px solid #E4E4DF',
                                borderRadius: 14,
                                background: '#F7F7F5',
                                padding: 14,
                                fontFamily: SANS,
                                fontSize: 15,
                                lineHeight: 1.5,
                                color: '#171717',
                                resize: 'vertical',
                              }}
                            />
                          </label>
                          {V.reviewError && <div style={{ fontSize: 13, color: '#B3261E' }}>{V.reviewError}</div>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button
                              onClick={V.cancelReviewForm}
                              style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '12px 4px', cursor: 'pointer', fontFamily: SANS, fontSize: 14, fontWeight: 600 }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={V.submitReview}
                              style={{
                                border: 0,
                                borderRadius: 999,
                                background: '#171717',
                                color: '#FFFFFF',
                                padding: '13px 24px',
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 700,
                                opacity: V.reviewSending ? 0.6 : 1,
                              }}
                            >
                              {V.reviewSending ? 'Submitting…' : 'Submit review'}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={V.openReviewForm}
                        style={{
                          border: '1px solid #171717',
                          borderRadius: 999,
                          background: 'transparent',
                          color: '#171717',
                          padding: '13px 24px',
                          cursor: 'pointer',
                          fontFamily: SANS,
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        Write a review
                      </button>
                    )}
                  </div>
                </div>
              )}

              {V.supplierTab === 'faq' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>FAQ</h2>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {V.sup.faqs.map((f) => {
                      const open = V.openFaqKey === f.key;
                      return (
                        <div key={f.key} style={{ borderTop: '1px solid #ECECEC' }}>
                          <button
                            onClick={() => V.toggleFaq(f.key)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 16,
                              border: 0,
                              background: 'transparent',
                              padding: '18px 2px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#171717',
                            }}
                          >
                            {f.q}
                            <span style={{ flexShrink: 0, fontSize: 18, color: '#9A9A9A' }}>{open ? '−' : '+'}</span>
                          </button>
                          {open && (
                            <p style={{ margin: '0 2px 18px', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>{f.a}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {V.supplierTab === 'policies' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Policies</h2>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {V.sup.policies.map((p) => (
                      <div key={p.key} style={{ borderTop: '1px solid #ECECEC', padding: '18px 2px' }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{p.label}</div>
                        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>{p.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {V.supplierTab === 'promos' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800, color: PROMO_ACCENT }}>Promotions</h2>
                  {V.sup.promos.length > 0 ? (
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {V.sup.promos.map((p) => (
                        <div
                          key={p.key}
                          style={{
                            border: `1px solid ${PROMO_ACCENT}`,
                            borderRadius: 18,
                            background: `${PROMO_ACCENT}0F`,
                            padding: '18px 20px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{p.title}</div>
                            <span
                              style={{
                                border: `1px solid ${PROMO_ACCENT}`,
                                borderRadius: 999,
                                background: PROMO_ACCENT,
                                padding: '5px 14px',
                                fontSize: 13,
                                fontWeight: 800,
                                color: '#FFFFFF',
                                flexShrink: 0,
                              }}
                            >
                              {p.discount}
                            </span>
                          </div>
                          <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>{p.description}</p>
                          <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 11, color: '#9A9A9A' }}>Ends {p.expires}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.55, color: '#9A9A9A' }}>
                      No active promotions right now. Check back later, or send an inquiry and ask directly.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div style={{ position: isMobile ? 'static' : 'sticky', top: 92, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div style={{ borderRadius: 24, background: '#171717', color: '#FFFFFF', padding: 26 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Your Eventory</div>
                <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 12, color: ACCENT }}>{V.summaryLine}</div>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {V.eventoryBrief.map((g) => (
                    <div key={g.key} style={{ borderTop: '1px solid #2B2B2B', paddingTop: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{g.supplierName}</div>
                      <div style={{ marginTop: 2, fontFamily: MONO, fontSize: 11, color: '#9C9C9C' }}>{g.itemLabel}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={V.goEventory}
                  style={{
                    marginTop: 22,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: ACCENT,
                    color: '#FFFFFF',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Review Eventory and send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {V.isEventory && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goSuppliers}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back to vendor listings
          </button>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>{V.eventoryHeading}</h1>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{V.eventorySub}</div>
          </div>

          {V.notSent && V.isEmpty && (
            <div style={{ marginTop: 26, border: '1px dashed #D7D7D2', borderRadius: 24, padding: '44px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Nothing in your Eventory yet</div>
              <div style={{ marginTop: 8, fontSize: 15, color: '#5B5B5B' }}>
                Add products from any category and they will collect here, grouped by vendor.
              </div>
              <button
                onClick={V.goHome}
                style={{
                  marginTop: 20,
                  border: 0,
                  borderRadius: 999,
                  background: '#171717',
                  color: '#FFFFFF',
                  padding: '13px 24px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Discover Vendors
              </button>
            </div>
          )}

          {V.notSent && !V.isEmpty && (
            <div style={{ marginTop: 26, maxWidth: 640 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                {V.checkoutStepLabel}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                {Array.from({ length: V.checkoutTotalSteps }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < V.checkoutStep ? '#171717' : '#ECECEC' }} />
                ))}
              </div>

              <div style={{ marginTop: 22, border: '1px solid #ECECEC', borderRadius: 24, padding: isMobile ? '18px 18px' : '24px 26px' }}>
                {V.checkoutIsDetails && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Event details</div>
                      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                        Sent with every inquiry
                      </div>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 14, color: '#5B5B5B' }}>
                      Vendors need these to quote you. Fill them once and they go out with each inquiry.
                    </div>
                    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                          Event date
                        </span>
                        <input
                          type="date"
                          value={V.eventDate}
                          onChange={V.setEventDate}
                          style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                          Guests expected
                        </span>
                        <input
                          type="number"
                          placeholder="120"
                          value={V.guestsExpected}
                          onChange={V.setGuestsExpected}
                          style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                          Start and end time
                        </span>
                        <input
                          type="text"
                          placeholder="4pm to 11pm"
                          value={V.eventTime}
                          onChange={V.setEventTime}
                          style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                        />
                      </label>
                    </div>
                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                        Fulfilment
                      </span>
                      {V.fulfilmentOptions.map((f) => (
                        <button
                          key={f.key}
                          onClick={f.pick}
                          style={{
                            border: `1px solid ${f.border}`,
                            borderRadius: 999,
                            background: f.bg,
                            color: f.fg,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <label style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                        {V.addressLabel}
                      </span>
                      <input
                        type="text"
                        placeholder="Venue name, street, town"
                        value={V.venueAddress}
                        onChange={V.setVenueAddress}
                        style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                      />
                    </label>
                    <label style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                        Access notes, optional
                      </span>
                      <textarea
                        placeholder="Load in through the back gate on Henry Street. No lift, one flight of stairs. Security needs names by the Friday before."
                        value={V.accessNotes}
                        onChange={V.setAccessNotes}
                        style={{
                          minHeight: 84,
                          border: '1px solid #E4E4DF',
                          borderRadius: 14,
                          background: '#F7F7F5',
                          padding: 14,
                          fontFamily: SANS,
                          fontSize: 15,
                          lineHeight: 1.5,
                          color: '#171717',
                          resize: 'vertical',
                        }}
                      />
                    </label>
                    <button
                      onClick={V.nextCheckoutStep}
                      style={{
                        marginTop: 22,
                        border: 0,
                        borderRadius: 999,
                        background: '#171717',
                        color: '#FFFFFF',
                        padding: '13px 24px',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      Continue →
                    </button>
                  </>
                )}

                {!V.checkoutIsDetails && !V.checkoutIsSend && V.eventoryGroups[V.checkoutStep - 2] && (() => {
                  const g = V.eventoryGroups[V.checkoutStep - 2];
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{g.supplierName}</div>
                          <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{g.location}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                            {g.inquiryLabel}
                          </div>
                          <button
                            onClick={g.removeAll}
                            style={{
                              border: 0,
                              background: 'transparent',
                              padding: 0,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#8A8A8A',
                              textDecoration: 'underline',
                              textUnderlineOffset: '3px',
                            }}
                          >
                            Remove vendor
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {g.items.map((it) => (
                          <div key={it.key} style={{ borderTop: '1px solid #ECECEC', padding: '14px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                              <div style={{ flex: '1 1 260px', minWidth: 220 }}>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>{it.name}</div>
                                <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 11, color: '#9A9A9A' }}>{it.termsLabel}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', columnGap: 16, flexWrap: 'wrap', rowGap: 10 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    border: '1px solid #E4E4DF',
                                    borderRadius: 999,
                                    padding: '5px 6px',
                                  }}
                                >
                                  <button
                                    onClick={it.dec}
                                    style={{ width: 26, height: 26, border: 0, borderRadius: 999, background: '#F2F2F0', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}
                                  >
                                    −
                                  </button>
                                  <span style={{ fontFamily: MONO, fontSize: 13, minWidth: 22, textAlign: 'center' }}>{it.qty}</span>
                                  <button
                                    onClick={it.inc}
                                    style={{ width: 26, height: 26, border: 0, borderRadius: 999, background: '#F2F2F0', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}
                                  >
                                    +
                                  </button>
                                </div>
                                <div style={{ fontFamily: MONO, fontSize: 14, minWidth: isMobile ? 0 : 148, textAlign: 'right' }}>{it.priceLabel}</div>
                                <button
                                  onClick={it.toggle}
                                  style={{
                                    border: '1px solid #171717',
                                    borderRadius: 999,
                                    background: it.detailBg,
                                    padding: '8px 14px',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: it.detailFg,
                                  }}
                                >
                                  {it.detailLabel}
                                </button>
                                <button
                                  onClick={it.remove}
                                  style={{
                                    border: 0,
                                    background: 'transparent',
                                    padding: 0,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#8A8A8A',
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '3px',
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            {it.expanded && (
                              <div style={{ marginTop: 12, borderRadius: 18, background: '#F7F7F5', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {it.fields.map((fd) => (
                                  <div key={fd.key}>
                                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                                      {fd.label}
                                    </div>
                                    {fd.isChoice && (
                                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {fd.options.map((o) => (
                                          <button
                                            key={o.key}
                                            onClick={o.pick}
                                            style={{
                                              border: `1px solid ${o.border}`,
                                              borderRadius: 999,
                                              background: o.bg,
                                              color: o.fg,
                                              padding: '7px 14px',
                                              cursor: 'pointer',
                                              fontSize: 13,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {o.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    {fd.isText && (
                                      <input
                                        type="text"
                                        value={fd.value}
                                        onChange={fd.set}
                                        placeholder={fd.ph}
                                        style={{
                                          marginTop: 8,
                                          width: '100%',
                                          border: '1px solid #E4E4DF',
                                          borderRadius: 14,
                                          background: '#FFFFFF',
                                          padding: '11px 14px',
                                          fontFamily: SANS,
                                          fontSize: 14,
                                          color: '#171717',
                                        }}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <label style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                          Note to {g.supplierName}, optional
                        </span>
                        <textarea
                          placeholder={g.notePlaceholder}
                          value={g.note}
                          onChange={g.setNote}
                          style={{
                            minHeight: 68,
                            border: '1px solid #E4E4DF',
                            borderRadius: 14,
                            background: '#F7F7F5',
                            padding: '13px 14px',
                            fontFamily: SANS,
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: '#171717',
                            resize: 'vertical',
                          }}
                        />
                        <span style={{ fontSize: 12, color: '#9A9A9A' }}>Only {g.supplierName} sees this note.</span>
                      </label>
                      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button
                          onClick={V.prevCheckoutStep}
                          style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '12px 4px', cursor: 'pointer', fontFamily: SANS, fontSize: 14, fontWeight: 600 }}
                        >
                          ← Back
                        </button>
                        <button
                          onClick={V.nextCheckoutStep}
                          style={{
                            border: 0,
                            borderRadius: 999,
                            background: '#171717',
                            color: '#FFFFFF',
                            padding: '13px 24px',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          Continue →
                        </button>
                      </div>
                    </>
                  );
                })()}

                {V.checkoutIsSend && (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Review &amp; send</div>
                    <div style={{ marginTop: 4, fontSize: 14, color: '#5B5B5B' }}>
                      One inquiry per vendor, each scoped to their own items and note.
                    </div>
                    <div style={{ marginTop: 20, borderRadius: 20, background: ACCENT, color: ACCENT_ON, padding: 22 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {V.sendStats.map((s) => (
                          <div
                            key={s.key}
                            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, borderTop: `1px solid ${ACCENT_ON_MUTED}`, padding: '11px 0' }}
                          >
                            <span style={{ fontSize: 14, fontWeight: 600, color: ACCENT_ON_SOFT }}>{s.label}</span>
                            <span style={{ fontFamily: MONO, fontSize: 17 }}>{s.value}</span>
                          </div>
                        ))}
                      </div>
                      {V.needsAccount && (
                        <div style={{ marginTop: 18, borderTop: `1px solid ${ACCENT_ON_MUTED}`, paddingTop: 16 }}>
                          {V.authSent ? (
                            <>
                              <div style={{ fontSize: 15, fontWeight: 700 }}>Check your email</div>
                              <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: ACCENT_ON_SOFT }}>
                                We sent a sign-in link to {V.email}. Click it to come back here and send your
                                inquiries — you can close this tab.
                              </p>
                              <button
                                onClick={V.useDifferentEmail}
                                style={{ marginTop: 10, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: ACCENT_ON_SOFT, textDecoration: 'underline', textUnderlineOffset: '3px' }}
                              >
                                Use a different email
                              </button>
                            </>
                          ) : (
                            <>
                              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_ON_SOFT }}>
                                Your email
                              </div>
                              <input
                                type="email"
                                value={V.email}
                                onChange={V.setEmail}
                                placeholder="you@organisation.tt"
                                style={{
                                  marginTop: 8,
                                  width: '100%',
                                  border: `1px solid ${ACCENT_ON_MUTED}`,
                                  borderRadius: 14,
                                  background: '#FFFFFF',
                                  padding: '12px 14px',
                                  fontFamily: SANS,
                                  fontSize: 15,
                                  color: '#171717',
                                }}
                              />
                              <button
                                onClick={V.togglePromoOptIn}
                                style={{
                                  marginTop: 12,
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                  border: 0,
                                  background: 'transparent',
                                  padding: 0,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 18,
                                    height: 18,
                                    marginTop: 1,
                                    border: `1px solid ${V.promoOptIn ? '#171717' : ACCENT_ON_SOFT}`,
                                    borderRadius: 5,
                                    background: V.promoOptIn ? '#171717' : 'transparent',
                                    color: '#FFFFFF',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    flexShrink: 0,
                                  }}
                                >
                                  {V.promoOptIn ? '✓' : ''}
                                </span>
                                <span style={{ fontSize: 13, lineHeight: 1.4, color: ACCENT_ON_SOFT }}>
                                  Send me promos and offers from vendors
                                </span>
                              </button>
                              <button
                                onClick={V.signIn}
                                disabled={V.signInDisabled}
                                style={{
                                  marginTop: 12,
                                  width: '100%',
                                  border: 0,
                                  borderRadius: 999,
                                  background: '#171717',
                                  color: '#FFFFFF',
                                  padding: '12px 20px',
                                  cursor: 'pointer',
                                  fontSize: 14,
                                  fontWeight: 700,
                                  opacity: V.signInDisabled ? 0.4 : 1,
                                }}
                              >
                                {V.authSending ? 'Sending link…' : 'Continue with email'}
                              </button>
                              {V.authError && (
                                <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, color: '#FDE2DA' }}>{V.authError}</div>
                              )}
                              <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, color: ACCENT_ON_SOFT }}>
                                No password, we email you a sign-in link. New here? The same link creates your
                                account. Signing in is required to send your inquiries and saves this Eventory to
                                your account.
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {V.signedIn && (
                        <div style={{ marginTop: 18, borderTop: `1px solid ${ACCENT_ON_MUTED}`, paddingTop: 14, fontSize: 13, color: ACCENT_ON_SOFT }}>
                          Saved to {V.email}. You can come back to this Eventory any time.
                        </div>
                      )}
                      <button
                        onClick={V.send}
                        disabled={V.isEmpty || !V.signedIn || V.sending}
                        style={{
                          marginTop: 20,
                          width: '100%',
                          border: 0,
                          borderRadius: 999,
                          background: '#171717',
                          color: '#FFFFFF',
                          padding: '16px 20px',
                          cursor: 'pointer',
                          fontSize: 15,
                          fontWeight: 700,
                          opacity: V.sendOpacity,
                        }}
                      >
                        {V.sending ? 'Sending…' : 'Send all inquiries'}
                      </button>
                      {V.sendError && (
                        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, color: '#B3261E' }}>{V.sendError}</div>
                      )}
                      <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5, color: ACCENT_ON_SOFT }}>
                        Each vendor receives one inquiry with your event details, their own line items and their own
                        note. No vendor sees the rest of your Eventory, and no payment is taken here.
                      </div>
                    </div>
                    <button
                      onClick={V.prevCheckoutStep}
                      style={{ marginTop: 16, border: 0, background: 'transparent', color: '#5B5B5B', padding: '12px 4px', cursor: 'pointer', fontFamily: SANS, fontSize: 14, fontWeight: 600 }}
                    >
                      ← Back
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {V.sent && (
            <div style={{ marginTop: 26, maxWidth: 560 }}>
              <div style={{ borderRadius: 24, background: '#171717', color: '#FFFFFF', padding: 26 }}>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Inquiries sent</div>
                <div style={{ marginTop: 6, fontSize: 14, color: '#A8A8A8' }}>{V.sentSummary}</div>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {V.sentList.map((s) => (
                    <div
                      key={s.key}
                      style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #2B2B2B', padding: '11px 0' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: ACCENT }}>{s.status}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.55, color: '#A8A8A8' }}>
                  Vendors reply by email or phone, usually within their listed response time. Quotes and payment
                  happen directly with them.
                </div>
                <button
                  onClick={V.reset}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    border: '1px solid #3B3B3B',
                    borderRadius: 999,
                    background: 'transparent',
                    color: '#FFFFFF',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Start a new Eventory
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {V.isJoin && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>

          <div style={{ marginTop: 22, maxWidth: 640 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 52, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>Join Eventory</h1>
            <p style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.5, color: '#4A4A4A' }}>
              Right now, somewhere a planner is searching your category. Get seen, and let them come to you.
            </p>
            <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.6, color: '#5B5B5B' }}>
              Set up your own profile in a couple of steps. Planners searching your category find you and message
              you directly. Free to list, free to receive messages.
            </p>
          </div>

          <div style={{ marginTop: isMobile ? 24 : 30, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={V.goVendorOnboarding}
              style={{
                border: 0,
                borderRadius: 999,
                background: ACCENT,
                color: '#FFFFFF',
                padding: '15px 32px',
                cursor: 'pointer',
                fontFamily: DISPLAY,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Get Listed →
            </button>
            <div style={{ fontSize: 13, color: '#5B5B5B' }}>We review every submission by hand.</div>
          </div>

          <div style={{ marginTop: isMobile ? 40 : 56 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 24 : 30, letterSpacing: '-0.02em', fontWeight: 800 }}>How it works</h2>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  background: ACCENT,
                  color: ACCENT_ON,
                  padding: isMobile ? '20px 22px' : '26px 30px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 480 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Create your account</div>
                  <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: ACCENT_ON_SOFT }}>
                    Two minutes. No design skills, no writing needed.
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 30, color: ACCENT_ON_MUTED }}>01</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  background: '#171717',
                  padding: isMobile ? '20px 22px' : '26px 30px',
                  color: '#FFFFFF',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 480 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Build your profile</div>
                  <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: '#A8A8A8' }}>
                    Add your packages, photos and details yourself, at your own pace.
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 30, color: '#4A4A4A' }}>02</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  background: '#F2F2F0',
                  padding: isMobile ? '20px 22px' : '26px 30px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 480 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Planners find you and message you directly</div>
                  <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>
                    They message you, you close the booking.
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 30, color: '#C2C2BC' }}>03</div>
              </div>
            </div>
          </div>


          <div style={{ marginTop: isMobile ? 40 : 56, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, alignItems: 'start' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #ECECEC',
                borderRadius: 24,
                padding: isMobile ? 22 : 34,
              }}
            >
              <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Listed</div>
              <ul style={{ margin: '14px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Set up your own profile in a couple of steps.</li>
                <li style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Listed in the directory, found by planners searching your category</li>
                <li style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Planners message you directly when they're interested</li>
                <li style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Free to list, free always</li>
              </ul>
              <button
                onClick={V.goVendorOnboarding}
                style={{
                  marginTop: 20,
                  border: 0,
                  borderRadius: 999,
                  background: '#171717',
                  color: '#FFFFFF',
                  padding: '14px 26px',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 700,
                  alignSelf: 'flex-start',
                }}
              >
                Get Listed →
              </button>
            </div>

            <div
              id="go-further"
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 24,
                overflow: 'hidden',
                border: `1.5px solid ${PROMO_ACCENT}`,
                boxShadow: isMobile ? 'none' : `0 24px 48px -28px ${PROMO_ACCENT}`,
                scrollMarginTop: 100,
              }}
            >
              <div style={{ background: PROMO_ACCENT, color: '#FFFFFF', padding: isMobile ? '20px 22px' : '26px 34px' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                  Paid placement
                </div>
                <div style={{ marginTop: 6, fontSize: isMobile ? 24 : 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Spotlight</div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700 }}>TTD $500</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>/month</span>
                </div>
              </div>

              <div style={{ background: `${PROMO_ACCENT}0D`, padding: isMobile ? 22 : 34 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ flexShrink: 0, marginTop: 2, width: 18, height: 18, borderRadius: 999, background: PROMO_ACCENT, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Everything in Listed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ flexShrink: 0, marginTop: 2, width: 18, height: 18, borderRadius: 999, background: PROMO_ACCENT, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Top of the list when planners search your category</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ flexShrink: 0, marginTop: 2, width: 18, height: 18, borderRadius: 999, background: PROMO_ACCENT, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Your profile shown first, with room for your work to stand out</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ flexShrink: 0, marginTop: 2, width: 18, height: 18, borderRadius: 999, background: PROMO_ACCENT, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Email features that put you in front of planners actively searching</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ flexShrink: 0, marginTop: 2, width: 18, height: 18, borderRadius: 999, background: PROMO_ACCENT, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>A push across our social channels</span>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                  Preview — top placement in your category
                </div>
                <div style={{ marginTop: 10, border: '1px solid #ECECEC', borderRadius: 20, background: '#FFFFFF', padding: isMobile ? 14 : 18 }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: '#9A9A9A' }}>Catering</div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        border: `1.5px solid ${PROMO_ACCENT}`,
                        borderRadius: 14,
                        padding: '12px 14px',
                        background: `${PROMO_ACCENT}0D`,
                      }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 999, background: '#171717', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>Your Business</span>
                          <span
                            style={{
                              fontFamily: MONO,
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              color: PROMO_ACCENT,
                              border: `1px solid ${PROMO_ACCENT}`,
                              borderRadius: 999,
                              padding: '2px 8px',
                            }}
                          >
                            Featured
                          </span>
                        </div>
                        <div style={{ marginTop: 2, fontSize: 12, color: '#6E6E6E' }}>
                          First thing planners see when they open Catering.
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: '12px 14px', background: '#F7F7F5' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 999, background: '#D7D7D2', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#9A9A9A' }}>Other business</div>
                        <div style={{ marginTop: 2, fontSize: 12, color: '#B5B5B0' }}>Standard listing</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: '12px 14px', background: '#F7F7F5' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 999, background: '#D7D7D2', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#9A9A9A' }}>Other business</div>
                        <div style={{ marginTop: 2, fontSize: 12, color: '#B5B5B0' }}>Standard listing</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={V.openPromoPlan}
                style={{
                  marginTop: 20,
                  width: '100%',
                  border: 0,
                  borderRadius: 999,
                  background: PROMO_ACCENT,
                  color: '#FFFFFF',
                  padding: '14px 26px',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                Tell me more →
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {V.isAbout && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Home
          </button>

          <div style={{ marginTop: 22, maxWidth: 680 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 52, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>About Eventory</h1>
          </div>

          <div
            style={{
              marginTop: isMobile ? 32 : 44,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 24,
              background: ACCENT,
              color: ACCENT_ON,
              padding: isMobile ? 22 : 34,
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: isMobile ? -20 : -10,
                top: isMobile ? -30 : -40,
                fontFamily: MONO,
                fontSize: isMobile ? 100 : 160,
                fontWeight: 700,
                color: ACCENT_ON_MUTED,
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              01
            </div>
            <div style={{ position: 'relative', maxWidth: 600 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_ON_SOFT }}>
                For planners
              </div>
              <h2 style={{ margin: '8px 0 0', fontSize: isMobile ? 24 : 32, letterSpacing: '-0.02em', fontWeight: 800, color: ACCENT_ON }}>
                Planning an Event?
              </h2>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: ACCENT_ON_SOFT }}>
                  You have an event to plan and vendors to find.
                </p>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: ACCENT_ON_SOFT }}>
                  Eventory puts caterers, venues, DJs, photographers, decorators, and more in one place across
                  Trinidad &amp; Tobago.
                </p>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: ACCENT_ON_SOFT }}>
                  Browse what you need, add vendors to your Broadcast Request, and send everything together when
                  you're ready. Each vendor receives their own request with only the details that apply to them,
                  and messages you back directly.
                </p>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: ACCENT_ON_SOFT }}>
                  Already know who you want? Message them straight from their profile.
                </p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: ACCENT_ON }}>
                  You find the people you need. They take it from there.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: isMobile ? 24 : 32,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 24,
              background: '#171717',
              padding: isMobile ? 22 : 34,
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: isMobile ? -20 : -10,
                top: isMobile ? -30 : -40,
                fontFamily: MONO,
                fontSize: isMobile ? 100 : 160,
                fontWeight: 700,
                color: '#262626',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              02
            </div>
            <div style={{ position: 'relative', maxWidth: 600 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: PROMO_ACCENT }}>
                For vendors
              </div>
              <h2 style={{ margin: '8px 0 0', fontSize: isMobile ? 24 : 32, letterSpacing: '-0.02em', fontWeight: 800, color: '#FFFFFF' }}>
                For Vendors
              </h2>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#D7D7D2' }}>
                  People are already looking for what you offer.
                </p>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#D7D7D2' }}>
                  Eventory helps them find your business when they're planning an event. They can browse your
                  profile, see what you offer, and add you to their Broadcast Request. Or message you directly if
                  they already know it's you they want.
                </p>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#D7D7D2' }}>
                  When they're ready, you receive their request directly, with the event details and what they're
                  interested in.
                </p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: '#FFFFFF' }}>
                  You reach out, discuss the details, and take it from there.
                </p>
              </div>
              <button
                onClick={V.goVendorOnboarding}
                style={{
                  marginTop: 22,
                  border: 0,
                  borderRadius: 999,
                  background: ACCENT,
                  color: '#FFFFFF',
                  padding: '14px 28px',
                  cursor: 'pointer',
                  fontFamily: DISPLAY,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Join Eventory →
              </button>
            </div>
          </div>

          <div style={{ marginTop: isMobile ? 40 : 56 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 24 : 30, letterSpacing: '-0.02em', fontWeight: 800 }}>Frequently asked questions</h2>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {ABOUT_FAQS.map((f) => (
                <div key={f.q} style={{ borderTop: '1px solid #ECECEC', padding: '18px 2px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{f.q}</div>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>{f.a}</p>
                  {f.linkTo === 'promo' && (
                    <button
                      onClick={V.goGoFurther}
                      style={{
                        marginTop: 10,
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: MONO,
                        fontSize: 13,
                        fontWeight: 700,
                        color: PROMO_ACCENT,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                      }}
                    >
                      {f.linkLabel} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: isMobile ? 40 : 56, maxWidth: 560, border: '1px solid #ECECEC', borderRadius: 24, padding: isMobile ? 18 : 26 }}>
            {V.contactSent ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Thanks, message sent</div>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                  We'll get back to you within one business day.
                </p>
                <button
                  onClick={V.goHome}
                  style={{
                    marginTop: 20,
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '13px 24px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Back to home
                </button>
              </>
            ) : (
              <>
                <h2 style={{ margin: 0, fontSize: isMobile ? 24 : 30, letterSpacing: '-0.02em', fontWeight: 800 }}>Contact us</h2>
                <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                  Questions, feedback, or something not covered above? Send us a message.
                </p>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Name
                    </span>
                    <input
                      type="text"
                      placeholder="Your name"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Email
                    </span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Message
                    </span>
                    <textarea
                      placeholder="How can we help?"
                      style={{
                        minHeight: 120,
                        border: '1px solid #E4E4DF',
                        borderRadius: 14,
                        background: '#F7F7F5',
                        padding: 14,
                        fontFamily: SANS,
                        fontSize: 15,
                        lineHeight: 1.5,
                        color: '#171717',
                        resize: 'vertical',
                      }}
                    />
                  </label>
                </div>
                <button
                  onClick={V.submitContact}
                  style={{
                    marginTop: 20,
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Send message
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {V.isAccount && (
        <div style={{ padding: '34px 0 0', maxWidth: 560 }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>
          <h1 style={{ margin: '18px 0 0', fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>Your account</h1>

          <div style={{ marginTop: 26 }}>
            <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-0.02em', fontWeight: 800 }}>Saved products</h2>
            {!V.hasSaved && (
              <div style={{ marginTop: 12, border: '1px dashed #D7D7D2', borderRadius: 24, padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#5B5B5B' }}>Nothing saved yet. Tap Save on any product to keep it here.</div>
              </div>
            )}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {V.savedProducts.map((p) => (
                <div
                  key={p.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                    border: '1px solid #ECECEC',
                    borderRadius: 20,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 220 }}>
                    <img src={p.photo} alt={p.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
                      <button
                        onClick={p.openSupplier}
                        style={{
                          border: 0,
                          background: 'transparent',
                          padding: 0,
                          cursor: 'pointer',
                          fontFamily: MONO,
                          fontSize: 12,
                          color: '#6E6E6E',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px',
                        }}
                      >
                        {p.supplierName}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: MONO, fontSize: 13 }}>{p.priceLabel}</div>
                    <button
                      onClick={p.share}
                      style={{
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: 'transparent',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#171717',
                      }}
                    >
                      {p.shareLabel}
                    </button>
                    <button
                      onClick={p.remove}
                      style={{
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#8A8A8A',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {V.accountNeedsSignIn && (
            <div style={{ marginTop: 26, border: '1px solid #ECECEC', borderRadius: 24, padding: 26 }}>
              {V.authSent ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Check your email</div>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                    We sent a sign-in link to {V.accountEmail}. Click it to come back here signed in — you can close
                    this tab.
                  </p>
                  <button
                    onClick={V.useDifferentEmail}
                    style={{ marginTop: 12, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#5B5B5B', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    Use a different email
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Sign in</div>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                    No password, we email you a link. New here? The same link creates your account and saves your
                    Eventories so you can find them again.
                  </p>
                  <label style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Your email
                    </span>
                    <input
                      type="email"
                      value={V.accountEmail}
                      onChange={V.setAccountEmail}
                      placeholder="you@organisation.tt"
                      style={{
                        border: '1px solid #E4E4DF',
                        borderRadius: 14,
                        background: '#F7F7F5',
                        padding: '12px 14px',
                        fontFamily: SANS,
                        fontSize: 15,
                        color: '#171717',
                      }}
                    />
                  </label>
                  <button
                    onClick={V.togglePromoOptIn}
                    style={{
                      marginTop: 16,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      border: 0,
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 18,
                        height: 18,
                        marginTop: 1,
                        border: `1px solid ${V.promoOptIn ? '#171717' : '#C8C8C2'}`,
                        borderRadius: 5,
                        background: V.promoOptIn ? '#171717' : 'transparent',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {V.promoOptIn ? '✓' : ''}
                    </span>
                    <span style={{ fontSize: 13, lineHeight: 1.4, color: '#5B5B5B' }}>
                      Send me promos and offers from vendors
                    </span>
                  </button>
                  <button
                    onClick={V.signIn}
                    disabled={V.signInDisabled}
                    style={{
                      marginTop: 18,
                      border: 0,
                      borderRadius: 999,
                      background: '#171717',
                      color: '#FFFFFF',
                      padding: '14px 24px',
                      cursor: 'pointer',
                      fontSize: 15,
                      fontWeight: 700,
                      opacity: V.signInDisabled ? 0.4 : 1,
                    }}
                  >
                    {V.authSending ? 'Sending link…' : 'Continue with email'}
                  </button>
                  {V.authError && (
                    <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, color: '#B3261E' }}>{V.authError}</div>
                  )}
                </>
              )}
            </div>
          )}

          {V.isSignedIn && (
            <>
              <div style={{ marginTop: 26, borderRadius: 24, background: '#171717', color: '#FFFFFF', padding: 26 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9C9C9C' }}>
                  Signed in as
                </div>
                <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{V.accountEmail}</div>
                <button
                  onClick={V.togglePromoOptIn}
                  style={{
                    marginTop: 18,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    border: 0,
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18,
                      height: 18,
                      marginTop: 1,
                      border: `1px solid ${V.promoOptIn ? ACCENT : '#3B3B3B'}`,
                      borderRadius: 5,
                      background: V.promoOptIn ? ACCENT : 'transparent',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {V.promoOptIn ? '✓' : ''}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.4, color: '#A8A8A8' }}>
                    Send me promos and offers from vendors
                  </span>
                </button>
                <button
                  onClick={V.signOut}
                  style={{
                    marginTop: 18,
                    border: '1px solid #3B3B3B',
                    borderRadius: 999,
                    background: 'transparent',
                    color: '#FFFFFF',
                    padding: '11px 18px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Sign out
                </button>
              </div>

              <div style={{ marginTop: 24 }}>
                <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-0.02em', fontWeight: 800 }}>Past Eventories</h2>
                {!V.hasHistory && (
                  <div style={{ marginTop: 12, border: '1px dashed #D7D7D2', borderRadius: 24, padding: '32px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 15, color: '#5B5B5B' }}>Nothing sent yet. Eventories you send while signed in will show up here.</div>
                  </div>
                )}
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {V.accountHistory.map((h) => (
                    <div key={h.key} style={{ border: '1px solid #ECECEC', borderRadius: 20, padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{h.date}</div>
                        <div style={{ fontFamily: MONO, fontSize: 11, color: '#9A9A9A' }}>{h.itemLabel}</div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: '#5B5B5B' }}>{h.suppliersLabel}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {V.sourcingOpen && (
        <div
          onClick={V.closeSourcing}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(23,23,23,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 12 : 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: 28,
              padding: isMobile ? 20 : 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 28, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 800 }}>
                {V.sourcingSent ? 'Request sent' : 'Tell us what you could not find'}
              </h2>
              <button
                onClick={V.closeSourcing}
                aria-label="Close"
                style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#6E6E6E', padding: 4, lineHeight: 1, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {V.sourcingSent ? (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>
                  Got it. We'll look for options that match what you described and follow up by email within one
                  business day.
                </p>
                <button
                  onClick={V.closeSourcing}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>
                  Describe what you're looking for in your own words. We'll find options and send them back to you.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginTop: 18 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Name
                    </span>
                    <input
                      type="text"
                      placeholder="Your name"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Number
                    </span>
                    <input
                      type="tel"
                      placeholder="868 000 0000"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Email
                    </span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                </div>

                <textarea
                  placeholder="e.g. A 20x30 tent with sidewalls for 120 people on the church grounds in Arima, first Saturday in November"
                  style={{
                    marginTop: 18,
                    width: '100%',
                    minHeight: 140,
                    border: '1px solid #E4E4DF',
                    borderRadius: 16,
                    background: '#F7F7F5',
                    padding: 16,
                    fontFamily: SANS,
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: '#171717',
                    resize: 'vertical',
                  }}
                />

                <button
                  onClick={V.submitSourcing}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Submit request
                </button>
                <div style={{ marginTop: 12, fontSize: 12, color: '#5B5B5B', textAlign: 'center' }}>
                  We follow up by email within one business day.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {V.isAdmin && (
        <div style={{ padding: '34px 0 0', maxWidth: 760 }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>
          <h1 style={{ margin: '18px 0 0', fontSize: isMobile ? 28 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>
            Admin
          </h1>

          {!V.adminIsAuthed ? (
            <div style={{ marginTop: 24, maxWidth: 420, border: '1px solid #ECECEC', borderRadius: 24, padding: 26 }}>
              {V.signedIn ? (
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                  Signed in as {V.email}, but this account doesn't have admin access.
                </p>
              ) : V.authSent ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Check your email</div>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                    We sent a sign-in link to {V.email}. Click it to come back here signed in.
                  </p>
                  <button
                    onClick={V.useDifferentEmail}
                    style={{ marginTop: 10, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#5B5B5B', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    Use a different email
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Admin sign-in</div>
                  <label style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Email
                    </span>
                    <input
                      type="email"
                      value={V.email}
                      onChange={V.setEmail}
                      placeholder="you@organisation.tt"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <button
                    onClick={V.signIn}
                    disabled={V.signInDisabled}
                    style={{ marginTop: 14, border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: V.signInDisabled ? 0.4 : 1 }}
                  >
                    {V.authSending ? 'Sending link…' : 'Continue with email'}
                  </button>
                  {V.authError && <div style={{ marginTop: 10, fontSize: 13, color: '#B3261E' }}>{V.authError}</div>}
                </>
              )}
            </div>
          ) : V.adminSubScreen === 'dashboard' ? (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 14, color: '#5B5B5B' }}>{V.adminVendors.length} vendors (drafts included)</div>
                <button
                  onClick={V.goAdminNewVendor}
                  style={{ border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '11px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                >
                  + Add vendor
                </button>
              </div>
              {V.adminVendorsError && (
                <div style={{ marginTop: 14, fontSize: 13, color: '#B3261E' }}>{V.adminVendorsError}</div>
              )}
              {V.adminVendorsLoading ? (
                <div style={{ marginTop: 20, fontSize: 14, color: '#9A9A9A' }}>Loading…</div>
              ) : (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {V.adminVendors.map((v) => (
                    <div
                      key={v.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                        borderTop: '1px solid #ECECEC',
                        padding: '16px 2px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{v.name}</div>
                        <div style={{ marginTop: 2, fontFamily: MONO, fontSize: 12, color: '#9A9A9A' }}>{v.city}</div>
                      </div>
                      <button
                        onClick={() => V.togglePublish(v.id, !v.published)}
                        style={{
                          border: '1px solid #D7D7D2',
                          borderRadius: 999,
                          background: v.published ? '#171717' : 'transparent',
                          color: v.published ? '#FFFFFF' : '#171717',
                          padding: '9px 16px',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {v.published ? 'Published' : 'Draft — publish'}
                      </button>
                    </div>
                  ))}
                  {V.adminVendors.length === 0 && (
                    <div style={{ padding: '20px 2px', fontSize: 14, color: '#9A9A9A' }}>No vendors yet.</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 24 }}>
              <button
                onClick={V.goAdminDashboard}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
              >
                ← Dashboard
              </button>
              <div style={{ marginTop: 14, display: 'flex', gap: 4 }}>
                {Array.from({ length: V.adminTotalSteps }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < V.adminStep ? '#171717' : '#ECECEC' }} />
                ))}
              </div>
              <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                Step {V.adminStep} of {V.adminTotalSteps}
              </div>

              {V.adminStep === 1 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Business basics</h2>
                  <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Business name</span>
                      <input type="text" value={V.adminName} onChange={V.setAdminName} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }} />
                    </label>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Category</div>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {V.adminCategoryTiles.map((c) => (
                          <button key={c.code} onClick={c.pick} style={{ border: c.on ? '2px solid #171717' : '1px solid #E4E4DF', borderRadius: 999, background: c.on ? '#171717' : '#FFFFFF', color: c.on ? '#FFFFFF' : '#171717', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Region</div>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {V.adminRegionTiles.map((l) => (
                          <button key={l.label} onClick={l.pick} style={{ border: l.on ? '2px solid #171717' : '1px solid #E4E4DF', borderRadius: 999, background: l.on ? '#171717' : '#FFFFFF', color: l.on ? '#FFFFFF' : '#171717', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>City</span>
                      <input type="text" value={V.adminCity} onChange={V.setAdminCity} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>WhatsApp number</span>
                      <input type="tel" value={V.adminWhatsapp} onChange={V.setAdminWhatsapp} placeholder="e.g. 868 123 4567" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Short description</span>
                      <textarea value={V.adminBio} onChange={V.setAdminBio} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15, resize: 'vertical' }} />
                    </label>
                  </div>
                  <button
                    onClick={V.adminStep1Next}
                    disabled={V.adminStep1NextDisabled}
                    style={{ marginTop: 22, border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: V.adminStep1NextDisabled ? 0.4 : 1 }}
                  >
                    Continue →
                  </button>
                </>
              )}

              {V.adminStep === 2 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Full profile</h2>
                  <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Full description</span>
                      <textarea value={V.adminDescription} onChange={V.setAdminDescription} rows={5} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15, resize: 'vertical' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Cover photo URL</span>
                      <input type="text" value={V.adminCoverUrl} onChange={V.setAdminCoverUrl} placeholder="https://…" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Logo URL</span>
                      <input type="text" value={V.adminLogoUrl} onChange={V.setAdminLogoUrl} placeholder="https://…" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }} />
                    </label>
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#9A9A9A' }}>
                      Starting price isn't set here — it's calculated automatically from the cheapest package you add in the next steps.
                    </div>
                  </div>
                  <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button onClick={V.adminStep2Next} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Continue →</button>
                  </div>
                </>
              )}

              {V.adminStep === 3 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Gallery</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: '#5B5B5B' }}>Add photos grouped by event type (e.g. Weddings, Birthdays).</p>
                  <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input type="text" value={V.adminGalleryEventType} onChange={V.setAdminGalleryEventType} placeholder="Event type, e.g. Weddings" style={{ flex: '1 1 180px', border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    <input type="text" value={V.adminGalleryPhotoUrl} onChange={V.setAdminGalleryPhotoUrl} placeholder="Photo URL" style={{ flex: '1 1 220px', border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    <button onClick={V.adminAddGalleryPhoto} disabled={V.adminAddGalleryPhotoDisabled} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '11px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: V.adminAddGalleryPhotoDisabled ? 0.4 : 1 }}>
                      Add photo
                    </button>
                  </div>
                  {V.adminGallery.length > 0 && (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {V.adminGallery.map((g, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #ECECEC', padding: '10px 2px' }}>
                          <div style={{ fontSize: 13, color: '#4A4A4A' }}>
                            <strong>{g.eventType}</strong> — {g.photoUrl}
                          </div>
                          <button onClick={() => V.adminRemoveGalleryPhoto(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button onClick={V.adminStep3Next} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Continue →</button>
                  </div>
                </>
              )}

              {V.adminStep === 4 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Packages</h2>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input type="text" value={V.adminPkgName} onChange={V.setAdminPkgName} placeholder="Package name" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    <input type="text" value={V.adminPkgPhotoUrl} onChange={V.setAdminPkgPhotoUrl} placeholder="Photo URL (optional)" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    <textarea value={V.adminPkgDescription} onChange={V.setAdminPkgDescription} placeholder="Description" rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    <input type="text" value={V.adminPkgInclusionsText} onChange={V.setAdminPkgInclusionsText} placeholder="Inclusions, comma separated" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input type="number" value={V.adminPkgPriceMin} onChange={V.setAdminPkgPriceMin} placeholder="Price min (TT$)" style={{ flex: 1, border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      <input type="number" value={V.adminPkgPriceMax} onChange={V.setAdminPkgPriceMax} placeholder="Price max (TT$)" style={{ flex: 1, border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    </div>
                    <button onClick={V.adminAddPackage} disabled={V.adminAddPackageDisabled} style={{ alignSelf: 'flex-start', border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '11px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: V.adminAddPackageDisabled ? 0.4 : 1 }}>
                      Add package
                    </button>
                  </div>
                  {V.adminPackages.length > 0 && (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {V.adminPackages.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #ECECEC', padding: '10px 2px' }}>
                          <div style={{ fontSize: 13, color: '#4A4A4A' }}>
                            <strong>{p.name}</strong> — TT${p.priceMin}–TT${p.priceMax}
                          </div>
                          <button onClick={() => V.adminRemovePackage(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button onClick={V.adminStep4Next} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Continue →</button>
                  </div>
                </>
              )}

              {V.adminStep === 5 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>FAQ</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: '#5B5B5B' }}>Edit the defaults, remove ones that don't apply, or add your own.</p>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {V.adminFaqs.map((f, i) => (
                      <div key={i} style={{ border: '1px solid #ECECEC', borderRadius: 16, padding: 14 }}>
                        <input type="text" value={f.q} onChange={(e) => V.setAdminFaqQ(i, e)} placeholder="Question" style={{ width: '100%', border: 0, borderBottom: '1px solid #E4E4DF', background: 'transparent', padding: '6px 2px', fontFamily: SANS, fontSize: 14, fontWeight: 700 }} />
                        <textarea value={f.a} onChange={(e) => V.setAdminFaqA(i, e)} placeholder="Answer" rows={2} style={{ marginTop: 8, width: '100%', border: 0, background: 'transparent', padding: '2px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                        <button onClick={() => V.adminRemoveFaqRow(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={V.adminAddFaqRow} style={{ marginTop: 12, border: '1px solid #D7D7D2', borderRadius: 999, background: 'transparent', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    + Add question
                  </button>
                  <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button onClick={V.adminStep5Next} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Continue →</button>
                  </div>
                </>
              )}

              {V.adminStep === 6 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Policies</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: '#5B5B5B' }}>All optional — leave blank to hide a section on the live profile.</p>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Payment</span>
                      <textarea value={V.adminPaymentTerms} onChange={V.setAdminPaymentTerms} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Deposit</span>
                      <textarea value={V.adminDepositTerms} onChange={V.setAdminDepositTerms} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Rescheduling</span>
                      <textarea value={V.adminReschedulePolicy} onChange={V.setAdminReschedulePolicy} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Cancellation &amp; refunds</span>
                      <textarea value={V.adminCancellationPolicy} onChange={V.setAdminCancellationPolicy} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    </label>
                  </div>
                  <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button onClick={V.adminStep6Next} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Continue to review →</button>
                  </div>
                </>
              )}

              {V.adminStep === 7 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Review &amp; publish</h2>
                  <div style={{ marginTop: 16, borderRadius: 20, background: '#F7F7F5', padding: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                    <div><strong>{V.adminName || '(no name)'}</strong> · {catName(st.adminCategoryCode)} · {st.adminRegion}, {V.adminCity}</div>
                    <div style={{ color: '#5B5B5B' }}>{V.adminGallery.length} gallery photos · {V.adminPackages.length} packages · {(st.adminFaqs || []).filter((f) => f.q.trim() && f.a.trim()).length} FAQ entries</div>
                  </div>
                  {V.adminSaveError && <div style={{ marginTop: 12, fontSize: 13, color: '#B3261E' }}>{V.adminSaveError}</div>}
                  <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button
                      onClick={() => V.adminSaveVendor(false)}
                      disabled={V.adminSaving}
                      style={{ border: '1px solid #171717', borderRadius: 999, background: 'transparent', color: '#171717', padding: '13px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: V.adminSaving ? 0.5 : 1 }}
                    >
                      Save as draft
                    </button>
                    <button
                      onClick={() => V.adminSaveVendor(true)}
                      disabled={V.adminSaving}
                      style={{ border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '13px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: V.adminSaving ? 0.5 : 1 }}
                    >
                      {V.adminSaving ? 'Publishing…' : 'Publish'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {V.isVendorOnboarding && (
        <div style={{ padding: '34px 0 0', maxWidth: 720 }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>
          <h1 style={{ margin: '18px 0 0', fontSize: isMobile ? 28 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>
            Vendor onboarding
          </h1>

          {V.voDone ? (
            <div style={{ marginTop: 24, maxWidth: 460, border: '1px solid #ECECEC', borderRadius: 24, padding: 28 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Application submitted</div>
              <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                Thanks — we review every application by hand before it goes live. You'll be able to sign back in
                with your email and password once it's approved.
              </p>
              <button
                onClick={V.goHome}
                style={{ marginTop: 18, border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
              >
                Back to home
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginTop: 22, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                Step {V.voStep} of 2 · {V.voStep === 1 ? 'Contact & Business Info' : 'Profile, Packages & More'}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#171717' }} />
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: V.voStep === 2 ? '#171717' : '#ECECEC' }} />
              </div>

              {V.voStep === 1 && (
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Sector *</div>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.voSectorTiles.map((c) => (
                        <button
                          key={c.code}
                          onClick={c.pick}
                          style={{ border: c.on ? '2px solid #171717' : '1px solid #E4E4DF', borderRadius: 999, background: c.on ? '#171717' : '#FFFFFF', color: c.on ? '#FFFFFF' : '#171717', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Main category (optional)</span>
                    <input type="text" value={V.voSubcategory} onChange={V.setVoSubcategory} placeholder="e.g. Buffet Catering, Wedding Venues" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Business name *</span>
                    <input type="text" value={V.voBusinessName} onChange={V.setVoBusinessName} placeholder="Your business name" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Contact person *</span>
                    <input type="text" value={V.voContactPerson} onChange={V.setVoContactPerson} placeholder="Your full name" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Country</span>
                    <input type="text" value="Trinidad and Tobago" disabled style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#ECECEC', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#6E6E6E' }} />
                  </label>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>City *</div>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.voCityTiles.map((l) => (
                        <button
                          key={l.label}
                          onClick={l.pick}
                          style={{ border: l.on ? '2px solid #171717' : '1px solid #E4E4DF', borderRadius: 999, background: l.on ? '#171717' : '#FFFFFF', color: l.on ? '#FFFFFF' : '#171717', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Starting price (TT$, optional)</span>
                    <input type="number" value={V.voStartingPrice} onChange={V.setVoStartingPrice} placeholder="e.g. 500" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                    <span style={{ fontSize: 12, color: '#9A9A9A' }}>Rough figure for now — this updates automatically once you add real packages.</span>
                  </label>

                  <div style={{ marginTop: 8, paddingTop: 18, borderTop: '1px solid #ECECEC' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Account</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#5B5B5B' }}>Login details for your dashboard.</div>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Email address *</span>
                    <input type="email" value={V.voEmail} onChange={V.setVoEmail} placeholder="your@email.com" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Phone number *</span>
                    <input type="tel" value={V.voPhone} onChange={V.setVoPhone} placeholder="868 123 4567" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Password * (min. 6 characters)</span>
                    <input type="password" value={V.voPassword} onChange={V.setVoPassword} placeholder="Create a strong password" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Confirm password *</span>
                    <input type="password" value={V.voConfirmPassword} onChange={V.setVoConfirmPassword} placeholder="Re-enter your password" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={V.toggleVoAgreeTerms} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, marginTop: 1, border: `1px solid ${V.voAgreeTerms ? '#171717' : '#C8C8C2'}`, borderRadius: 5, background: V.voAgreeTerms ? '#171717' : 'transparent', color: '#FFFFFF', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                        {V.voAgreeTerms ? '✓' : ''}
                      </span>
                      <span style={{ fontSize: 13, lineHeight: 1.4, color: '#5B5B5B' }}>I agree to the Terms of Service</span>
                    </button>
                    <button onClick={V.toggleVoAgreePrivacy} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, marginTop: 1, border: `1px solid ${V.voAgreePrivacy ? '#171717' : '#C8C8C2'}`, borderRadius: 5, background: V.voAgreePrivacy ? '#171717' : 'transparent', color: '#FFFFFF', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                        {V.voAgreePrivacy ? '✓' : ''}
                      </span>
                      <span style={{ fontSize: 13, lineHeight: 1.4, color: '#5B5B5B' }}>I agree to the Privacy Policy</span>
                    </button>
                  </div>

                  {V.voStep1Error && <div style={{ fontSize: 13, color: '#B3261E' }}>{V.voStep1Error}</div>}
                  <button
                    onClick={V.voStep1Next}
                    disabled={V.voStep1Disabled || V.voStep1Submitting}
                    style={{ alignSelf: 'flex-start', border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '14px 26px', cursor: 'pointer', fontSize: 15, fontWeight: 700, opacity: V.voStep1Disabled || V.voStep1Submitting ? 0.5 : 1 }}
                  >
                    {V.voStep1Submitting ? 'Creating account…' : 'Continue →'}
                  </button>
                </div>
              )}

              {V.voStep === 2 && (
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 26 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Cover &amp; logo</div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Cover photo</span>
                        {V.voCoverUrl ? (
                          <img src={V.voCoverUrl} alt="Cover" style={{ width: 180, height: 100, borderRadius: 12, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 180, height: 100, borderRadius: 12, background: '#F7F7F5', border: '1px dashed #D7D7D2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9A9A9A' }}>
                            {V.voUploadingCover ? 'Uploading…' : 'Add photo'}
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={V.uploadVoCover} style={{ fontSize: 12 }} />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>Logo</span>
                        {V.voLogoUrl ? (
                          <img src={V.voLogoUrl} alt="Logo" style={{ width: 100, height: 100, borderRadius: 999, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 100, height: 100, borderRadius: 999, background: '#F7F7F5', border: '1px dashed #D7D7D2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9A9A9A', textAlign: 'center' }}>
                            {V.voUploadingLogo ? 'Uploading…' : 'Add logo'}
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={V.uploadVoLogo} style={{ fontSize: 12 }} />
                      </label>
                    </div>
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>About us *</div>
                    <span style={{ fontSize: 13, color: '#5B5B5B' }}>
                      Share your story, strengths, and what makes your services unique.
                    </span>
                    <textarea value={V.voAbout} onChange={V.setVoAbout} rows={4} placeholder="Tell planners about your experience and what clients can expect." style={{ marginTop: 4, border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, resize: 'vertical' }} />
                  </label>

                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Contact details</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#5B5B5B' }}>How clients can reach you on your profile.</div>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ fontSize: 13, color: '#4A4A4A' }}>Phone: {V.voPhone} · Email: {V.voEmail}</div>
                      <input type="text" value={V.voInstagram} onChange={V.setVoInstagram} placeholder="Instagram handle" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      <input type="text" value={V.voTiktok} onChange={V.setVoTiktok} placeholder="TikTok handle" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      <input type="text" value={V.voMapLink} onChange={V.setVoMapLink} placeholder="Map link (Google Maps URL)" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Service albums</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#5B5B5B' }}>Showcase your work, grouped by event type.</div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.suggestedAlbumChips.map((c) => (
                        <button key={c.name} onClick={c.pick} style={{ border: '1px solid #D7D7D2', borderRadius: 999, background: 'transparent', padding: '7px 14px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#4A4A4A' }}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input type="text" value={V.voAlbumName} onChange={V.setVoAlbumName} placeholder="Album name" style={{ flex: '1 1 160px', border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      <input type="file" accept="image/*" disabled={!V.voAlbumName.trim()} onChange={V.uploadVoAlbumPhoto} style={{ fontSize: 12 }} />
                      {V.voUploadingAlbumPhoto && <span style={{ fontSize: 12, color: '#9A9A9A' }}>Uploading…</span>}
                    </div>
                    {V.voAlbums.length > 0 && (
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {V.voAlbums.map((a) => (
                          <div key={a.name} style={{ border: '1px solid #ECECEC', borderRadius: 14, padding: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: 13.5 }}>{a.name}</strong>
                              <button onClick={() => V.removeVoAlbum(a.name)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {a.photos.map((p, i) => (
                                <img key={i} src={p} alt={a.name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Packages</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#5B5B5B' }}>Pricing and service bundles.</div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.suggestedPackageChips.map((c) => (
                        <button key={c.name} onClick={c.pick} style={{ border: '1px solid #D7D7D2', borderRadius: 999, background: 'transparent', padding: '7px 14px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#4A4A4A' }}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input type="text" value={V.voPkgName} onChange={V.setVoPkgName} placeholder="Package name" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="file" accept="image/*" onChange={V.uploadVoPkgPhoto} style={{ fontSize: 12 }} />
                        {V.voUploadingPkgPhoto && <span style={{ fontSize: 12, color: '#9A9A9A' }}>Uploading…</span>}
                        {V.voPkgPhotoUrl && <img src={V.voPkgPhotoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                      </div>
                      <textarea value={V.voPkgDescription} onChange={V.setVoPkgDescription} placeholder="Description" rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                      <input type="text" value={V.voPkgInclusionsText} onChange={V.setVoPkgInclusionsText} placeholder="Inclusions, comma separated" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input type="number" value={V.voPkgPriceMin} onChange={V.setVoPkgPriceMin} placeholder="Price min (TT$)" style={{ flex: 1, border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                        <input type="number" value={V.voPkgPriceMax} onChange={V.setVoPkgPriceMax} placeholder="Price max (TT$)" style={{ flex: 1, border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      </div>
                      <button onClick={V.voAddPackage} disabled={V.voAddPackageDisabled} style={{ alignSelf: 'flex-start', border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '11px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: V.voAddPackageDisabled ? 0.4 : 1 }}>
                        Add package
                      </button>
                    </div>
                    {V.voPackages.length > 0 && (
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {V.voPackages.map((p, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #ECECEC', padding: '10px 2px' }}>
                            <div style={{ fontSize: 13, color: '#4A4A4A' }}><strong>{p.name}</strong> — TT${p.priceMin}–TT${p.priceMax}</div>
                            <button onClick={() => V.removeVoPackage(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Menu (optional)</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#5B5B5B' }}>For food-service vendors — list your dishes or items.</div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                      <input type="text" value={V.voMenuDraft} onChange={V.setVoMenuDraft} placeholder="e.g. Grilled Chicken Platter" style={{ flex: 1, border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      <button onClick={V.voAddMenuItem} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '11px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Add item</button>
                    </div>
                    {V.voMenu.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {V.voMenu.map((name, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #E4E4DF', borderRadius: 999, background: '#F7F7F5', padding: '7px 8px 7px 14px', fontSize: 13, fontWeight: 600 }}>
                            {name}
                            <button onClick={() => V.removeVoMenuItem(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#B3261E', fontWeight: 800 }}>✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Frequently asked questions</div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.suggestedFaqChips.map((c) => (
                        <button key={c.q} onClick={c.pick} style={{ border: '1px solid #D7D7D2', borderRadius: 999, background: 'transparent', padding: '7px 14px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#4A4A4A' }}>
                          {c.q}
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {V.voFaqs.map((f, i) => (
                        <div key={i} style={{ border: '1px solid #ECECEC', borderRadius: 16, padding: 14 }}>
                          <input type="text" value={f.q} onChange={(e) => V.setVoFaqQ(i, e)} placeholder="Question" style={{ width: '100%', border: 0, borderBottom: '1px solid #E4E4DF', background: 'transparent', padding: '6px 2px', fontFamily: SANS, fontSize: 14, fontWeight: 700 }} />
                          <textarea value={f.a} onChange={(e) => V.setVoFaqA(i, e)} placeholder="Answer" rows={2} style={{ marginTop: 8, width: '100%', border: 0, background: 'transparent', padding: '2px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                          <button onClick={() => V.removeVoFaq(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={V.voAddFaqRow} style={{ marginTop: 12, border: '1px solid #D7D7D2', borderRadius: 999, background: 'transparent', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>+ Add question</button>
                  </div>

                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Terms &amp; policies</div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.suggestedPolicyChips.map((c) => (
                        <button key={c.title} onClick={c.pick} style={{ border: '1px solid #D7D7D2', borderRadius: 999, background: 'transparent', padding: '7px 14px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#4A4A4A' }}>
                          {c.title}
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {V.voPolicies.map((p, i) => (
                        <div key={i} style={{ border: '1px solid #ECECEC', borderRadius: 16, padding: 14 }}>
                          <input type="text" value={p.title} onChange={(e) => V.setVoPolicyTitle(i, e)} placeholder="Policy title" style={{ width: '100%', border: 0, borderBottom: '1px solid #E4E4DF', background: 'transparent', padding: '6px 2px', fontFamily: SANS, fontSize: 14, fontWeight: 700 }} />
                          <textarea value={p.body} onChange={(e) => V.setVoPolicyBody(i, e)} placeholder="Details" rows={2} style={{ marginTop: 8, width: '100%', border: 0, background: 'transparent', padding: '2px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                          <button onClick={() => V.removeVoPolicy(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={V.voAddPolicyRow} style={{ marginTop: 12, border: '1px solid #D7D7D2', borderRadius: 999, background: 'transparent', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>+ Add policy</button>
                  </div>

                  {V.voStep2Error && <div style={{ fontSize: 13, color: '#B3261E' }}>{V.voStep2Error}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => patch({ voStep: 1 })} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '14px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Previous</button>
                    <button
                      onClick={V.voSubmitApplication}
                      disabled={V.voStep2Submitting}
                      style={{ border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '14px 26px', cursor: 'pointer', fontSize: 15, fontWeight: 700, opacity: V.voStep2Submitting ? 0.5 : 1 }}
                    >
                      {V.voStep2Submitting ? 'Submitting…' : 'Submit application'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {V.planModalOpen && (
        <div
          onClick={V.closePlanModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(23,23,23,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 12 : 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: 28,
              padding: isMobile ? 20 : 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                {V.planStep > 1 && (
                  <button
                    onClick={V.planStepBack}
                    style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
                  >
                    ← Back
                  </button>
                )}
                <div style={{ marginTop: V.planStep > 1 ? 10 : 0, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                  Step {V.planStep} of {V.planTotalSteps}
                </div>
                <h2 style={{ margin: '6px 0 0', fontSize: isMobile ? 22 : 28, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 800 }}>
                  {V.planStep === 1 && 'What are you planning?'}
                  {V.planStep === 2 && 'When & where?'}
                  {V.planStep === 3 && 'Which vendors are you looking for?'}
                  {V.planStep === 4 && "What's your budget?"}
                  {V.planStep === 5 && 'How can vendors reach you?'}
                </h2>
              </div>
              <button
                onClick={V.closePlanModal}
                aria-label="Close"
                style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#6E6E6E', padding: 4, lineHeight: 1, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {V.planStep === 1 && (
              <>
                <div
                  style={{
                    marginTop: 22,
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: 12,
                  }}
                >
                  {V.eventTypeTiles.map((t) => (
                    <button
                      key={t.key}
                      onClick={t.pick}
                      style={{
                        border: t.on ? '2px solid #171717' : '1px solid #E4E4DF',
                        borderRadius: 16,
                        background: t.on ? '#171717' : '#FFFFFF',
                        color: t.on ? '#FFFFFF' : '#171717',
                        padding: '18px 16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {st.planEventType === 'other' && (
                  <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={V.planOtherLabel}
                      onChange={V.setPlanOtherLabel}
                      placeholder="Tell us what you're planning"
                      style={{
                        flex: 1,
                        minWidth: 220,
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#F7F7F5',
                        padding: '11px 16px',
                        fontFamily: SANS,
                        fontSize: 14,
                        color: '#171717',
                      }}
                    />
                    <button
                      onClick={V.confirmOtherEventType}
                      disabled={!V.planOtherLabel.trim()}
                      style={{
                        border: 0,
                        borderRadius: 999,
                        background: '#171717',
                        color: '#FFFFFF',
                        padding: '11px 22px',
                        cursor: V.planOtherLabel.trim() ? 'pointer' : 'not-allowed',
                        opacity: V.planOtherLabel.trim() ? 1 : 0.4,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      Continue
                    </button>
                  </div>
                )}
              </>
            )}

            {V.planStep === 2 && (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                  Roughly when is your {V.planEventLabel.toLowerCase()}, and where in Trinidad &amp; Tobago?
                </p>
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                    Event date (optional)
                  </div>
                  <input
                    type="date"
                    value={V.planEventDate}
                    onChange={V.setPlanEventDate}
                    style={{
                      marginTop: 8,
                      width: '100%',
                      border: '1px solid #E4E4DF',
                      borderRadius: 14,
                      background: '#F7F7F5',
                      padding: '11px 14px',
                      fontFamily: SANS,
                      fontSize: 14,
                      color: '#171717',
                    }}
                  />
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                    Location
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {V.planLocationTiles.map((l) => (
                      <button
                        key={l.label}
                        onClick={l.pick}
                        style={{
                          border: l.on ? '2px solid #171717' : '1px solid #E4E4DF',
                          borderRadius: 999,
                          background: l.on ? '#171717' : '#FFFFFF',
                          color: l.on ? '#FFFFFF' : '#171717',
                          padding: '9px 16px',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={V.planWhenWhereNext}
                  style={{
                    marginTop: 22,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Continue →
                </button>
              </>
            )}

            {V.planStep === 3 && (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                  Tell us what you need for your {V.planEventLabel.toLowerCase()} — tick everything that applies.
                </p>
                <div
                  style={{
                    marginTop: 18,
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: 8,
                  }}
                >
                  {V.planCategoryTiles.map((c) => (
                    <button
                      key={c.code}
                      onClick={c.toggle}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        border: c.on ? '2px solid #171717' : '1px solid #E4E4DF',
                        borderRadius: 11,
                        background: c.on ? '#F5F6E9' : '#FFFFFF',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          border: c.on ? '2px solid #16A34A' : '2px solid #171717',
                          background: c.on ? '#16A34A' : 'transparent',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                        }}
                      >
                        {c.on ? '✓' : ''}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={V.planServicesNext}
                  disabled={V.planServicesNextDisabled}
                  style={{
                    marginTop: 22,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: V.planServicesNextDisabled ? 'not-allowed' : 'pointer',
                    opacity: V.planServicesNextDisabled ? 0.4 : 1,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Continue →
                </button>
              </>
            )}

            {V.planStep === 4 && (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                  Roughly what are you looking to spend? This helps us show you a realistic shortlist.
                </p>
                <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {V.planBudgetTiles.map((b) => (
                    <button
                      key={b.label}
                      onClick={b.pick}
                      style={{
                        border: b.on ? '2px solid #171717' : '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: b.on ? '#171717' : '#FFFFFF',
                        color: b.on ? '#FFFFFF' : '#171717',
                        padding: '9px 16px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={V.planBudgetNext}
                  style={{
                    marginTop: 22,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Continue →
                </button>
              </>
            )}

            {V.planStep === 5 && (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                  Last step — this is how we and matching vendors can follow up with you.
                </p>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Your name
                    </div>
                    <input
                      type="text"
                      value={V.planContactName}
                      onChange={V.setPlanContactName}
                      placeholder="Full name"
                      style={{
                        marginTop: 8,
                        width: '100%',
                        border: '1px solid #E4E4DF',
                        borderRadius: 14,
                        background: '#F7F7F5',
                        padding: '11px 14px',
                        fontFamily: SANS,
                        fontSize: 14,
                        color: '#171717',
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Phone number
                    </div>
                    <input
                      type="tel"
                      value={V.planContactPhone}
                      onChange={V.setPlanContactPhone}
                      placeholder="e.g. 868 123 4567"
                      style={{
                        marginTop: 8,
                        width: '100%',
                        border: '1px solid #E4E4DF',
                        borderRadius: 14,
                        background: '#F7F7F5',
                        padding: '11px 14px',
                        fontFamily: SANS,
                        fontSize: 14,
                        color: '#171717',
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Email (optional)
                    </div>
                    <input
                      type="email"
                      value={V.planContactEmail}
                      onChange={V.setPlanContactEmail}
                      placeholder="you@organisation.tt"
                      style={{
                        marginTop: 8,
                        width: '100%',
                        border: '1px solid #E4E4DF',
                        borderRadius: 14,
                        background: '#F7F7F5',
                        padding: '11px 14px',
                        fontFamily: SANS,
                        fontSize: 14,
                        color: '#171717',
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={V.finishPlanning}
                  disabled={V.planSubmitDisabled}
                  style={{
                    marginTop: 22,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: ACCENT,
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: V.planSubmitDisabled ? 'not-allowed' : 'pointer',
                    opacity: V.planSubmitDisabled ? 0.5 : 1,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {V.planSubmitting ? 'Finding matches…' : 'See my matches →'}
                </button>
                {V.planSubmitError && (
                  <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, color: '#B3261E' }}>{V.planSubmitError}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {V.promoPlanOpen && (
        <div
          onClick={V.closePromoPlan}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(23,23,23,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 12 : 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: 28,
              padding: isMobile ? 20 : 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 800 }}>
                {V.promoPlanSent ? "You're on the list" : 'Get Spotlight'}
              </h2>
              <button
                onClick={V.closePromoPlan}
                aria-label="Close"
                style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#6E6E6E', padding: 4, lineHeight: 1, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {V.promoPlanSent ? (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>
                  Thanks — we'll reach out within one business day to set up billing and get your placement live.
                </p>
                <button
                  onClick={V.closePromoPlan}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>
                  TTD $500/month. Tell us about your business and we'll set up billing and your featured placement.
                </p>

                <label style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                    Business name
                  </span>
                  <input
                    type="text"
                    placeholder="Cocoa Pod Catering"
                    style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                  />
                </label>
                <label style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                    Email
                  </span>
                  <input
                    type="email"
                    placeholder="bookings@yourbusiness.tt"
                    style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                  />
                </label>
                <label style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                    WhatsApp or phone
                  </span>
                  <input
                    type="tel"
                    placeholder="868 000 0000"
                    style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                  />
                </label>

                <div style={{ marginTop: 18, borderRadius: 18, background: '#F7F7F5', padding: 16, fontSize: 13, lineHeight: 1.55, color: '#5B5B5B' }}>
                  This is a paid subscription, billed monthly. Cancel anytime — your placement ends at the close of
                  the current billing period.
                </div>

                <button
                  onClick={V.submitPromoPlan}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: PROMO_ACCENT,
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Request Spotlight
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>

    <footer style={{ marginTop: isMobile ? 56 : 80, background: '#171717', color: '#FFFFFF' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: isMobile ? '40px 16px 28px' : '56px 28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr 1fr', gap: isMobile ? 32 : 40 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>Eventory</div>
            <p style={{ margin: '10px 0 0', maxWidth: 320, fontSize: 14, lineHeight: 1.55, color: '#A8A8A8' }}>
              Discovery and sourcing for events in Trinidad &amp; Tobago. Browse vendors, compare what they offer,
              and message them directly.
            </p>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                aria-label="Instagram"
                title="Instagram"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  border: '1px solid #2B2B2B',
                  borderRadius: 999,
                  background: 'transparent',
                  color: '#D7D7D2',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </button>
              <button
                aria-label="Facebook"
                title="Facebook"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  border: '1px solid #2B2B2B',
                  borderRadius: 999,
                  background: 'transparent',
                  color: '#D7D7D2',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </button>
              <button
                aria-label="X"
                title="X"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  border: '1px solid #2B2B2B',
                  borderRadius: 999,
                  background: 'transparent',
                  color: '#D7D7D2',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4l16 16M20 4L4 20" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6E6E6E' }}>
              Explore
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={V.goSuppliers}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                Discover Vendors
              </button>
              <button
                onClick={V.goAbout}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                About
              </button>
              <button
                onClick={V.goEventory}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                Your Eventory
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6E6E6E' }}>
              Vendors
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={V.goVendorOnboarding}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                Join Eventory
              </button>
              <button
                onClick={V.goGoFurther}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                Spotlight
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: isMobile ? 32 : 44,
            paddingTop: 20,
            borderTop: '1px solid #2B2B2B',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>
            © {new Date().getFullYear()} Eventory. All rights reserved.
          </div>
          <div style={{ fontSize: 12, color: '#6E6E6E' }}>
            Eventory never processes payment. You deal directly with each vendor.
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
