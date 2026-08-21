import { useState, useEffect } from 'react';
import {
  CATS,
  EVENTS,
  SUPPLIERS,
  LOCATIONS,
  GROUPS,
  FIELDS,
  FIELDS_DEFAULT,
  money,
} from './data';
import heroPhoto from './assets/hero-photo.jpg';

const MONO = "'IBM Plex Mono', monospace";
const SANS = 'Manrope, sans-serif';
const DISPLAY = 'Archivo, Helvetica, sans-serif';
const DISPLAY_BLACK = "'Archivo Black', Archivo, sans-serif";
const ACCOUNT_KEY = 'eventoryAccount';
const PROMO_ACCENT = '#FF5A36';

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

const loadAccount = () => {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return { email: '', signedIn: false, history: [], saved: [], promoOptIn: false };
    const parsed = JSON.parse(raw);
    return {
      email: parsed.email || '',
      signedIn: !!parsed.signedIn,
      history: parsed.history || [],
      saved: parsed.saved || [],
      promoOptIn: !!parsed.promoOptIn,
    };
  } catch {
    return { email: '', signedIn: false, history: [], saved: [], promoOptIn: false };
  }
};

const sharedProductFromUrl = () => {
  try {
    const pid = new URLSearchParams(window.location.search).get('product');
    if (!pid) return null;
    const supId = pid.split('-')[0];
    return SUPPLIERS.some((s) => s.id === supId) ? { pid, supId } : null;
  } catch {
    return null;
  }
};

const initialState = {
  screen: 'home',
  eventIdx: 0,
  catCode: 'CAT.01',
  supId: 's1',
  items: [],
  sent: null,
  loc: 0,
  grp: 0,
  dirCat: 'ALL',
  dirCatMenuOpen: false,
  dirLoc: 0,
  dirVisible: 6,
  fulfil: 'Delivery',
  spec: {},
  openSpec: {},
  eventDate: '',
  guestsExpected: '',
  eventTime: '',
  venueAddress: '',
  accessNotes: '',
  email: '',
  signedIn: false,
  history: [],
  saved: [],
  promoOptIn: false,
  copiedPid: null,
  joinCats: [],
  joinCatsMenuOpen: false,
  joinSubmitted: false,
  sourcingOpen: false,
  sourcingSent: false,
  supplierTab: 'services',
  svcQuery: '',
  svcGroup: 'All',
  svcVisible: 8,
  navMenuOpen: false,
  promoPlanOpen: false,
  promoPlanSent: false,
};

export default function App() {
  const isMobile = useIsMobile();
  const [st, setSt] = useState(() => {
    const base = { ...initialState, ...loadAccount() };
    const shared = sharedProductFromUrl();
    return shared ? { ...base, screen: 'supplier', supId: shared.supId, supplierTab: 'services' } : base;
  });
  const patch = (updater) =>
    setSt((prev) => ({ ...prev, ...(typeof updater === 'function' ? updater(prev) : updater) }));

  useEffect(() => {
    try {
      localStorage.setItem(
        ACCOUNT_KEY,
        JSON.stringify({
          email: st.email,
          signedIn: st.signedIn,
          history: st.history,
          saved: st.saved,
          promoOptIn: st.promoOptIn,
        })
      );
    } catch {
      // ignore storage failures (private browsing, quota, etc.)
    }
  }, [st.email, st.signedIn, st.history, st.saved, st.promoOptIn]);

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
          lead: p[6],
          group: p[7] || 'General',
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
  const evt = EVENTS[st.eventIdx];
  const inSet = (code) => evt[1].indexOf(code) >= 0;
  const nav = (screen, extra) => () =>
    patch({ screen, sent: screen === 'eventory' ? st.sent : null, navMenuOpen: false, ...(extra || {}) });
  const openCat = (code) => () => patch({ screen: 'category', catCode: code, loc: 0, grp: 0 });
  const catTile = (c) => {
    const on = inSet(c[0]);
    const n = SUPPLIERS.filter((s) => s.code === c[0]).length;
    return {
      code: c[0],
      name: c[1],
      mark: on ? '✓' : '',
      supplierLabel: n ? n + (n === 1 ? ' supplier' : ' suppliers') : 'Coming soon',
      bg: on ? '#DDF247' : '#F7F7F5',
      border: on ? '#DDF247' : '#ECECEC',
      boxBg: on ? '#171717' : 'transparent',
      boxBorder: on ? '#171717' : '#C8C8C2',
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

  const dirFiltered = SUPPLIERS.filter(
    (s) => (st.dirCat === 'ALL' || s.code === st.dirCat) && (st.dirLoc === 0 || s.region === LOCATIONS[st.dirLoc])
  );

  const sup = supplier(st.supId) || SUPPLIERS[0];
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

  const chip = (on) =>
    on ? { bg: '#171717', fg: '#FFFFFF', border: '#171717' } : { bg: '#FFFFFF', fg: '#171717', border: '#D7D7D2' };

  const V = {
    itemCount,
    counterBg: itemCount ? '#DDF247' : '#FFFFFF',
    isHome: st.screen === 'home',
    isCategory: st.screen === 'category',
    isSuppliers: st.screen === 'suppliers',
    isSupplier: st.screen === 'supplier',
    isEventory: st.screen === 'eventory',
    isJoin: st.screen === 'join',
    isAccount: st.screen === 'account',
    sourcingOpen: st.sourcingOpen,
    goHome: nav('home'),
    goSuppliers: nav('suppliers'),
    goEventory: nav('eventory'),
    goSourcing: () => patch({ sourcingOpen: true, sourcingSent: false }),
    closeSourcing: () => patch({ sourcingOpen: false, sourcingSent: false }),
    submitSourcing: () => patch({ sourcingSent: true }),
    sourcingSent: !!st.sourcingSent,
    goJoin: nav('join', { joinSubmitted: false }),
    submitJoin: () => patch({ joinSubmitted: true }),
    joinSubmitted: !!st.joinSubmitted,
    openPromoPlan: () => patch({ promoPlanOpen: true, promoPlanSent: false }),
    closePromoPlan: () => patch({ promoPlanOpen: false, promoPlanSent: false }),
    submitPromoPlan: () => patch({ promoPlanSent: true }),
    promoPlanOpen: !!st.promoPlanOpen,
    promoPlanSent: !!st.promoPlanSent,
    goAccount: nav('account'),
    navMenuOpen: !!st.navMenuOpen,
    toggleNavMenu: () => patch((s) => ({ navMenuOpen: !s.navMenuOpen })),
    closeNavMenu: () => patch({ navMenuOpen: false }),
    startPlanning: () => {
      document.getElementById('top-categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    scrollToJoinForm: () => {
      document.getElementById('join-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    backToCategory: () => patch({ screen: 'category', catCode: sup.code }),

    topCategoryTiles: CATS.map((c) => ({ c, n: SUPPLIERS.filter((s) => s.code === c[0]).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 6)
      .map((x) => catTile(x.c)),

    featuredProducts: ['s1-1', 's3-1', 's6-12', 's7-1', 's10-1', 's5-1']
      .map((pid) => {
        const p = product(pid);
        if (!p) return null;
        const s = supplier(p.supId);
        return {
          key: pid,
          photo: photoUrl(pid, 300, 220),
          name: p.name,
          supplierName: s.name,
          categoryName: catName(s.code),
          priceLabel: priceLabel(p),
          open: () => patch({ screen: 'supplier', supId: p.supId, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8 }),
        };
      })
      .filter(Boolean),

    cat: { code: cat[0], name: cat[1], description: cat[2] },
    resultLabel: filtered.length + ' of ' + catSuppliers.length + ' suppliers',
    locationFilters: LOCATIONS.map((l, i) => ({ label: l, ...chip(i === st.loc), pick: () => patch({ loc: i }) })),
    groupFilters: GROUPS.map((g, i) => ({ label: g[0], ...chip(i === st.grp), pick: () => patch({ grp: i }) })),
    supplierRows: filtered.map((s) => ({
      key: s.id,
      logo: avatarUrl(s.name),
      name: s.name,
      location: s.city,
      description: s.bio,
      tags: s.tags,
      open: () => patch({ screen: 'supplier', supId: s.id, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8 }),
    })),

    dirCategoryFilters: [{ code: 'ALL', name: 'All categories' }, ...CATS.map((c) => ({ code: c[0], name: c[1] }))].map((c) => {
      const n = c.code === 'ALL' ? SUPPLIERS.length : SUPPLIERS.filter((s) => s.code === c.code).length;
      return {
        code: c.code,
        label: c.name,
        countLabel: c.code === 'ALL' ? n + (n === 1 ? ' supplier' : ' suppliers') : n ? String(n) : 'None yet',
        on: st.dirCat === c.code,
        pick: () => patch({ dirCat: c.code, dirCatMenuOpen: false, dirVisible: 6 }),
      };
    }),
    dirCategoryLabel: (CATS.find((c) => c[0] === st.dirCat) || [null, 'All categories'])[1],
    dirCatMenuOpen: !!st.dirCatMenuOpen,
    toggleDirCatMenu: () => patch((s) => ({ dirCatMenuOpen: !s.dirCatMenuOpen })),
    closeDirCatMenu: () => patch({ dirCatMenuOpen: false }),
    dirLocationFilters: LOCATIONS.map((l, i) => ({ label: l, ...chip(i === st.dirLoc), pick: () => patch({ dirLoc: i, dirVisible: 6 }) })),
    dirResultLabel: dirFiltered.length + ' of ' + SUPPLIERS.length + ' suppliers',
    dirSupplierRows: dirFiltered.slice(0, st.dirVisible || 6).map((s) => ({
      key: s.id,
      logo: avatarUrl(s.name),
      name: s.name,
      location: s.city,
      categoryCode: s.code,
      categoryName: catName(s.code),
      description: s.bio,
      tags: s.tags,
      open: () => patch({ screen: 'supplier', supId: s.id, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8 }),
    })),
    dirShowSeeAll: dirFiltered.length > (st.dirVisible || 6),
    dirSeeAllLabel: 'See all ' + dirFiltered.length + ' suppliers',
    seeAllDir: () => patch({ dirVisible: dirFiltered.length }),

    sup: {
      logo: avatarUrl(sup.name),
      cover: photoUrl(sup.id + '-cover', 960, 360),
      name: sup.name,
      code: sup.code,
      description: sup.bio,
      about: sup.desc,
      categoryName: catName(sup.code),
      facts: [
        { label: 'Based in', value: sup.city },
        { label: 'Service radius', value: sup.radius ? sup.radius + ' km' : 'On site only' },
        { label: 'Min group', value: sup.minGroup + ' guests' },
        { label: 'Lead time', value: sup.lead + ' days' },
        { label: 'Rating', value: sup.rating },
        { label: 'Response time', value: sup.response },
      ],
      phone: sup.phone,
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
    },
    supplierTab: st.supplierTab || 'services',
    supplierTabs: [
      { key: 'about', label: 'About' },
      { key: 'services', label: 'Services (' + supProducts.length + ')' },
      { key: 'reviews', label: 'Reviews (' + (sup.reviews || []).length + ')' },
      { key: 'faq', label: 'FAQ' },
      { key: 'promos', label: 'Promos' + ((sup.promos || []).length ? ' (' + sup.promos.length + ')' : '') },
    ].map((t) => ({
      ...t,
      active: (st.supplierTab || 'services') === t.key,
      go: () => patch({ supplierTab: t.key }),
    })),
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
      photo: photoUrl(p.id, 300, 220),
      name: p.name,
      description: p.description,
      termsLabel: 'Min ' + p.minQty + ' ' + (p.unit === 'flat' ? 'booking' : 'units') + ' · ' + p.lead + ' day lead',
      priceLabel: priceLabel(p),
      btnLabel: has(p.id) ? 'Added' : '+ Add',
      btnBg: has(p.id) ? '#DDF247' : '#171717',
      btnFg: has(p.id) ? '#171717' : '#FFFFFF',
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
      (grp.length === 1 ? ' supplier' : ' suppliers'),
    eventoryBrief: grp.map((g) => ({
      key: g.sup.id,
      supplierName: g.sup.name,
      itemLabel: g.rows.length + (g.rows.length === 1 ? ' item' : ' items'),
    })),

    eventoryHeading: st.sent ? 'Inquiries are out' : 'Your Eventory',
    eventorySub: st.sent
      ? 'Sent ' + st.sent.length + (st.sent.length === 1 ? ' inquiry' : ' separate inquiries')
      : itemCount + ' products across ' + grp.length + (grp.length === 1 ? ' supplier' : ' suppliers'),
    isEmpty: st.items.length === 0,
    notSent: !st.sent,
    sent: !!st.sent,
    eventoryGroups: grp.map((g) => ({
      key: g.sup.id,
      supplierName: g.sup.name,
      code: g.sup.code,
      location: g.sup.city,
      inquiryLabel: '1 inquiry · ' + g.rows.length + (g.rows.length === 1 ? ' line item' : ' line items'),
      notePlaceholder:
        g.sup.code === 'CAT.01'
          ? 'Two guests need vegetarian plates. Can you hold the pepper on the side?'
          : 'Anything this supplier should know about your setup or timing.',
      items: g.rows.map((r) => {
        const defs = FIELDS[g.sup.code] || FIELDS_DEFAULT;
        const spec = (st.spec || {})[r.pid] || {};
        const setCount = defs.filter((d) => spec[d.k]).length;
        return {
          key: r.pid,
          name: r.p.name,
          qty: r.qty,
          termsLabel: g.sup.code + ' · min ' + r.p.minQty + ' · ' + r.p.lead + ' day lead',
          priceLabel: priceLabel(r.p),
          inc: () => bump(r.pid, 1),
          dec: () => bump(r.pid, -1),
          remove: () => remove(r.pid),
          expanded: !!(st.openSpec || {})[r.pid],
          detailLabel: setCount ? setCount + ' of ' + defs.length + ' set' : 'Add details',
          detailBg: setCount ? '#DDF247' : '#171717',
          detailFg: setCount ? '#171717' : '#FFFFFF',
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
      { key: 'suppliers', label: 'Suppliers', value: grp.length },
      { key: 'products', label: 'Products', value: itemCount },
      { key: 'inquiries', label: 'Inquiries to send', value: grp.length },
    ],
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

    sendOpacity: st.items.length && st.signedIn ? 1 : 0.4,
    signInDisabled: !(st.email && st.email.indexOf('@') > 0),
    send: () => {
      if (!st.signedIn || !st.items.length) return;
      const sentNames = groups().map((g) => g.sup.name);
      patch((s) => ({
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
    },
    sentSummary: st.sent ? 'One inquiry per supplier, each scoped to their own items.' : '',
    sentList: (st.sent || []).map((n) => ({ key: n, name: n, status: 'Sent' })),
    reset: () =>
      patch({
        items: [],
        sent: null,
        screen: 'home',
        eventDate: '',
        guestsExpected: '',
        eventTime: '',
        venueAddress: '',
        accessNotes: '',
      }),

    joinCategories: CATS.concat([['OTHER', 'Something else']]).map((c) => ({
      key: c[0],
      code: c[0] === 'OTHER' ? '' : c[0],
      name: c[1],
      ...chip((st.joinCats || []).indexOf(c[0]) >= 0),
      pick: () =>
        patch((s) => {
          const cur = s.joinCats || [];
          return { joinCats: cur.indexOf(c[0]) >= 0 ? cur.filter((x) => x !== c[0]) : cur.concat([c[0]]) };
        }),
    })),
    joinOther: (st.joinCats || []).indexOf('OTHER') >= 0,
    joinCatsMenuOpen: !!st.joinCatsMenuOpen,
    toggleJoinCatsMenu: () => patch((s) => ({ joinCatsMenuOpen: !s.joinCatsMenuOpen })),
    closeJoinCatsMenu: () => patch({ joinCatsMenuOpen: false }),
    joinCatsSummary: (st.joinCats || []).length
      ? (st.joinCats || []).length + (st.joinCats.length === 1 ? ' category selected' : ' categories selected')
      : 'Select categories',
    joinCatsSelected: CATS.concat([['OTHER', 'Something else']])
      .filter((c) => (st.joinCats || []).indexOf(c[0]) >= 0)
      .map((c) => c[1]),

    email: st.email || '',
    setEmail: (e) => patch({ email: e.target.value }),
    signedIn: !!st.signedIn,
    needsAccount: !st.signedIn,
    accountLabel: st.signedIn ? 'Signed in · ' + st.email : 'Sign in',

    isSignedIn: !!st.signedIn,
    accountNeedsSignIn: !st.signedIn,
    accountEmail: st.email || '',
    setAccountEmail: (e) => patch({ email: e.target.value }),
    signIn: () => patch({ signedIn: !!(st.email && st.email.indexOf('@') > 0) }),
    signOut: () => patch({ signedIn: false }),
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
        (h.suppliers.length === 1 ? ' supplier' : ' suppliers'),
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
            patch({ screen: 'supplier', supId: p.supId, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8 }),
          remove: () => toggleSave(pid),
          share: () => shareProduct(pid),
          shareLabel: st.copiedPid === pid ? 'Copied!' : 'Share',
        };
      })
      .filter(Boolean),
    hasSaved: (st.saved || []).length > 0,
  };

  return (
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
                  Find Suppliers
                </button>
                <button
                  onClick={V.goJoin}
                  style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#5B5B5B' }}
                >
                  Get Promoted
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
                Find Suppliers
              </button>
              <button
                onClick={V.goJoin}
                style={{ border: 0, borderRadius: 10, background: 'transparent', padding: '12px 14px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#171717', textAlign: 'left' }}
              >
                Get Promoted
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={V.goAccount}
            style={{
              border: 0,
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              fontFamily: MONO,
              fontSize: 11,
              color: V.isSignedIn ? '#6E6E6E' : '#171717',
              fontWeight: V.isSignedIn ? 400 : 700,
              textDecoration: V.isSignedIn ? 'none' : 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            {V.accountLabel}
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
              alt="Guests laughing and celebrating at an outdoor event"
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

          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 26 }}>
            <button
              onClick={V.startPlanning}
              style={{
                border: 0,
                borderRadius: 999,
                background: '#DDF247',
                color: '#171717',
                padding: '15px 32px',
                cursor: 'pointer',
                fontFamily: DISPLAY,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Plan Your Event
            </button>
          </div>

          <div id="top-categories" style={{ padding: isMobile ? '48px 0 0' : '84px 0 0', scrollMarginTop: 100 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 800 }}>Top categories</h2>
              <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B' }}>
                The categories with the most suppliers on Eventory right now.
              </p>
            </div>
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {V.topCategoryTiles.map((c) => (
                <button
                  key={c.code}
                  onClick={c.open}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 34,
                    textAlign: 'left',
                    border: `1px solid ${c.border}`,
                    borderRadius: 20,
                    background: c.bg,
                    padding: 18,
                    cursor: 'pointer',
                    minHeight: 148,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{c.code}</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 18,
                        height: 18,
                        border: `1px solid ${c.boxBorder}`,
                        borderRadius: 5,
                        background: c.boxBg,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {c.mark}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{c.name}</div>
                    <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 11, color: '#6E6E6E' }}>{c.supplierLabel}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: isMobile ? '48px 0 0' : '84px 0 0' }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 800 }}>Featured products</h2>
            <div
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              {V.featuredProducts.map((f) => (
                <button
                  key={f.key}
                  onClick={f.open}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'left',
                    border: '1px solid #ECECEC',
                    borderRadius: 20,
                    overflow: 'hidden',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <img
                    src={f.photo}
                    alt={f.name}
                    style={{ width: '100%', height: isMobile ? 110 : 150, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: isMobile ? '12px 14px 16px' : '16px 18px 20px' }}>
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
                    <div style={{ marginTop: 10, fontFamily: MONO, fontSize: isMobile ? 12 : 14, fontWeight: 700 }}>{f.priceLabel}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: isMobile ? '48px 0 0' : '84px 0 0' }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 800 }}>How Eventory works</h2>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  background: '#DDF247',
                  padding: isMobile ? '20px 22px' : '28px 32px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 720 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Discover</div>
                  <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: '#3B4200' }}>
                    Choose your event type and see what you need, then browse suppliers with real price ranges,
                    minimums and lead times.
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 34, color: '#A9BB3A' }}>01</div>
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
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Inquire</div>
                  <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: '#A8A8A8' }}>
                    Add what you need to your Eventory as you browse. When you're ready, send each supplier a
                    separate inquiry with only the items relevant to them.
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
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Source</div>
                  <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: '#4A4A4A' }}>
                    Can't find what you need? Tell us what you're looking for and we'll find options for you. You
                    only pay if you approve what we source.
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
                <div style={{ fontFamily: MONO, fontSize: 34, color: '#C2C2BC' }}>03</div>
              </div>
            </div>
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, fontSize: 14, color: '#5B5B5B' }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                Note
              </span>
              Eventory never processes payment between you and a supplier. You pay suppliers directly, on their terms.
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
              <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{V.cat.code}</div>
              <h1 style={{ margin: '8px 0 0', fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>{V.cat.name}</h1>
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
              <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>Find Suppliers</h1>
              <p style={{ margin: '12px 0 0', maxWidth: 560, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B' }}>
                Browse every supplier on Eventory, or narrow down by category and location.
              </p>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{V.dirResultLabel}</div>
          </div>

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
                        {s.categoryCode} · {s.categoryName}
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
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? 26 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>{V.sup.name}</h1>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{V.sup.code}</span>
                  </div>
                </div>
                <p style={{ margin: '14px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.55, color: '#4A4A4A' }}>{V.sup.description}</p>
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
                    <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Services</h2>
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
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {V.supplierProducts.map((p) => (
                      <div
                        key={p.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 24,
                          flexWrap: 'wrap',
                          borderTop: '1px solid #ECECEC',
                          padding: '20px 2px',
                        }}
                      >
                        <div style={{ flex: '1 1 340px', minWidth: 260, display: 'flex', gap: 16 }}>
                          <img
                            src={p.photo}
                            alt={p.name}
                            style={{ width: 88, height: 66, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{p.name}</div>
                            <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>{p.description}</div>
                            <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 11, color: '#9A9A9A' }}>{p.termsLabel}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <button
                            onClick={p.toggleSave}
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
                          <div style={{ fontFamily: MONO, fontSize: 15, textAlign: 'right', minWidth: isMobile ? 0 : 150 }}>{p.priceLabel}</div>
                          <button
                            onClick={p.add}
                            style={{
                              border: '1px solid #171717',
                              borderRadius: 999,
                              background: p.btnBg,
                              color: p.btnFg,
                              padding: '11px 20px',
                              cursor: 'pointer',
                              fontSize: 14,
                              fontWeight: 700,
                              minWidth: 108,
                            }}
                          >
                            {p.btnLabel}
                          </button>
                        </div>
                      </div>
                    ))}
                    {V.supplierProducts.length === 0 && (
                      <div style={{ padding: '28px 2px', fontSize: 14, color: '#9A9A9A' }}>No services match your search.</div>
                    )}
                  </div>
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
                </div>
              )}

              {V.supplierTab === 'faq' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>FAQ</h2>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {V.sup.faqs.map((f) => (
                      <div key={f.key} style={{ borderTop: '1px solid #ECECEC', padding: '18px 2px' }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{f.q}</div>
                        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>{f.a}</p>
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
                <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 12, color: '#DDF247' }}>{V.summaryLine}</div>
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
                    background: '#DDF247',
                    color: '#171717',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Review Eventory and send
                </button>
              </div>
              <div style={{ border: '1px solid #ECECEC', borderRadius: 24, padding: '20px 22px', fontSize: 13, lineHeight: 1.55, color: '#5B5B5B' }}>
                Eventory does not process payment. {V.sup.name} will quote you directly and invoice you on their own terms.
              </div>
            </div>
          </div>
        </div>
      )}

      {V.isEventory && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Keep browsing
          </button>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>{V.eventoryHeading}</h1>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{V.eventorySub}</div>
          </div>

          {V.notSent && V.isEmpty && (
            <div style={{ marginTop: 26, border: '1px dashed #D7D7D2', borderRadius: 24, padding: '44px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Nothing in your Eventory yet</div>
              <div style={{ marginTop: 8, fontSize: 15, color: '#5B5B5B' }}>
                Add products from any category and they will collect here, grouped by supplier.
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
                Find Suppliers
              </button>
            </div>
          )}

          {V.notSent && !V.isEmpty && (
            <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                <div style={{ border: '1px solid #ECECEC', borderRadius: 24, padding: isMobile ? '18px 18px' : '24px 26px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Event details</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Sent with every inquiry
                    </div>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 14, color: '#5B5B5B' }}>
                    Suppliers need these to quote you. Fill them once and they go out with each inquiry.
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
                </div>

                {V.eventoryGroups.map((g) => (
                  <div key={g.key} style={{ border: '1px solid #ECECEC', borderRadius: 24, padding: '24px 26px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{g.supplierName}</div>
                        <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>
                          {g.code} · {g.location}
                        </div>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                        {g.inquiryLabel}
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
                  </div>
                ))}
              </div>

              <div style={{ position: isMobile ? 'static' : 'sticky', top: 92, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                <div style={{ borderRadius: 24, background: '#DDF247', padding: 26 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>About to send</div>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {V.sendStats.map((s) => (
                      <div
                        key={s.key}
                        style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #C6D93C', padding: '11px 0' }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#3B4200' }}>{s.label}</span>
                        <span style={{ fontFamily: MONO, fontSize: 17 }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                  {V.needsAccount && (
                    <div style={{ marginTop: 18, borderTop: '1px solid #C6D93C', paddingTop: 16 }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7A1F' }}>
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
                          border: '1px solid #C6D93C',
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
                            border: `1px solid ${V.promoOptIn ? '#171717' : '#7A8A1F'}`,
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
                        <span style={{ fontSize: 13, lineHeight: 1.4, color: '#3B4200' }}>
                          Send me promos and offers from suppliers
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
                        Sign in to send inquiries
                      </button>
                      <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, color: '#3B4200' }}>
                        No password, we email you a sign-in link. Signing in is required to send your inquiries and
                        saves this Eventory to your account.
                      </div>
                    </div>
                  )}
                  {V.signedIn && (
                    <div style={{ marginTop: 18, borderTop: '1px solid #C6D93C', paddingTop: 14, fontSize: 13, color: '#3B4200' }}>
                      Saved to {V.email}. You can come back to this Eventory any time.
                    </div>
                  )}
                  <button
                    onClick={V.send}
                    disabled={V.isEmpty || !V.signedIn}
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
                    Send all inquiries
                  </button>
                  <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5, color: '#3B4200' }}>
                    Each supplier receives one inquiry with your event details, their own line items and their own
                    note. No supplier sees the rest of your Eventory, and no payment is taken here.
                  </div>
                </div>
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
                      <span style={{ fontFamily: MONO, fontSize: 11, color: '#DDF247' }}>{s.status}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.55, color: '#A8A8A8' }}>
                  Suppliers reply by email or phone, usually within their listed response time. Quotes and payment
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
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 20, alignItems: 'start' }}>
            <div style={{ minWidth: 0, order: isMobile ? 2 : 0 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 52, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>Join Eventory</h1>
              <p style={{ margin: '16px 0 0', maxWidth: 600, fontSize: 17, lineHeight: 1.5, color: '#4A4A4A' }}>
                Get discovered by buyers looking for the suppliers, products, and services they need for their
                events.
              </p>

              <div id="join-form" style={{ marginTop: 28, border: '1px solid #ECECEC', borderRadius: 24, padding: isMobile ? 18 : 26, scrollMarginTop: 100 }}>
                {V.joinSubmitted ? (
                  <>
                    <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Thanks — you're in the queue</div>
                    <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                      We check the listing and publish it within two business days. We'll email you once it's live.
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
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Business name
                    </span>
                    <input
                      type="text"
                      placeholder="Cocoa Pod Catering"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Contact person
                    </span>
                    <input
                      type="text"
                      placeholder="Full name"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Email
                    </span>
                    <input
                      type="email"
                      placeholder="bookings@yourbusiness.tt"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      WhatsApp or phone
                    </span>
                    <input
                      type="tel"
                      placeholder="868 000 0000"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                </div>

                <div style={{ marginTop: 22, fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                  Categories you serve
                </div>
                <div style={{ marginTop: 10, position: 'relative' }}>
                  <button
                    onClick={V.toggleJoinCatsMenu}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      width: '100%',
                      border: '1px solid #E4E4DF',
                      borderRadius: 14,
                      background: '#F7F7F5',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      fontFamily: SANS,
                      fontSize: 15,
                      color: '#171717',
                    }}
                  >
                    {V.joinCatsSummary}
                    <span style={{ fontSize: 12, color: '#6E6E6E' }}>{V.joinCatsMenuOpen ? '▲' : '▼'}</span>
                  </button>
                  {V.joinCatsMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        maxHeight: 280,
                        overflowY: 'auto',
                        border: '1px solid #ECECEC',
                        borderRadius: 16,
                        background: '#FFFFFF',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                        padding: 12,
                        zIndex: 21,
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {V.joinCategories.map((c) => (
                          <button
                            key={c.key}
                            onClick={c.pick}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              border: `1px solid ${c.border}`,
                              borderRadius: 999,
                              background: c.bg,
                              color: c.fg,
                              padding: '8px 14px',
                              cursor: 'pointer',
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.65 }}>{c.code}</span>
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {V.joinCatsMenuOpen && (
                    <div onClick={V.closeJoinCatsMenu} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
                  )}
                </div>
                {V.joinCatsSelected.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {V.joinCatsSelected.map((name) => (
                      <span
                        key={name}
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
                        {name}
                      </span>
                    ))}
                  </div>
                )}
                {V.joinOther && (
                  <label style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Tell us what you do
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Mobile bathroom trailers, fireworks, drone coverage"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                )}

                <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Based in
                    </span>
                    <input
                      type="text"
                      placeholder="Chaguanas"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Travel radius
                    </span>
                    <input
                      type="text"
                      placeholder="60 km"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                      Lead time needed
                    </span>
                    <input
                      type="text"
                      placeholder="10 days"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                </div>

                <label style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A' }}>
                    What you offer and roughly what it costs
                  </span>
                  <textarea
                    placeholder="One line per item, with a price range and unit. Example: Hot lunch buffet, TT$110 to 165 per guest, minimum 60 guests."
                    style={{
                      minHeight: 132,
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
                <div style={{ marginTop: 8, fontSize: 13, color: '#5B5B5B' }}>Ranges are fine. Buyers use them to shortlist, then you send the real quote.</div>

                <button
                  onClick={V.submitJoin}
                  style={{
                    marginTop: 22,
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
                  Submit for review
                </button>
                <div style={{ marginTop: 12, fontSize: 13, color: '#5B5B5B' }}>We check the listing and publish it within two business days.</div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: isMobile ? 'static' : 'sticky', top: 92, minWidth: 0, order: isMobile ? 1 : 0, marginBottom: isMobile ? 22 : 0 }}>
              <div style={{ borderRadius: 24, background: '#DDF247', padding: 26 }}>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Get Listed</div>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#3B4200' }}>
                  Tell us about your business. We'll build your profile and get you in front of buyers looking for
                  what you offer.
                </p>
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: '#3B4200' }}>
                  Free to list. Free to receive inquiries.
                </div>
                <button
                  onClick={V.scrollToJoinForm}
                  style={{
                    marginTop: 18,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Join Eventory
                </button>
              </div>
              <div style={{ borderRadius: 24, border: `1px solid ${PROMO_ACCENT}`, background: `${PROMO_ACCENT}0D`, padding: 26 }}>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Get Promoted</div>
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: '#171717' }}>Want more visibility?</div>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>
                  For TTD $500/month, get your business and offers in front of more buyers through:
                </p>
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <li style={{ fontSize: 13, lineHeight: 1.5, color: '#4A4A4A' }}>Targeted email marketing</li>
                  <li style={{ fontSize: 13, lineHeight: 1.5, color: '#4A4A4A' }}>Featured placement on the Promotions page</li>
                  <li style={{ fontSize: 13, lineHeight: 1.5, color: '#4A4A4A' }}>Featured placement in relevant event categories</li>
                  <li style={{ fontSize: 13, lineHeight: 1.5, color: '#4A4A4A' }}>Social media promotion</li>
                </ul>
                <button
                  onClick={V.openPromoPlan}
                  style={{
                    marginTop: 18,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: PROMO_ACCENT,
                    color: '#FFFFFF',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Get Started
                </button>
              </div>
            </div>
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
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Sign in</div>
              <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                No password, we email you a sign-in link. Signing in saves your Eventories so you can find them again.
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
                  Send me promos and offers from suppliers
                </span>
              </button>
              <button
                onClick={V.signIn}
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
                }}
              >
                Sign in
              </button>
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
                      border: `1px solid ${V.promoOptIn ? '#DDF247' : '#3B3B3B'}`,
                      borderRadius: 5,
                      background: V.promoOptIn ? '#DDF247' : 'transparent',
                      color: '#171717',
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {V.promoOptIn ? '✓' : ''}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.4, color: '#A8A8A8' }}>
                    Send me promos and offers from suppliers
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
                  business day. You only pay if you approve one of the options we bring back.
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
                  You only pay if you approve one, quoted with the options.
                </p>

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
                  No upfront charge. We follow up by email within one business day.
                </div>
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
                {V.promoPlanSent ? "You're on the list" : 'Get the Promotion Plan'}
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
                  Request promotion plan
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
