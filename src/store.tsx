import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEALS, DEFAULT_FILTERS, type CollKey, type Deal, type Filters, type Region } from './data';

import { track, trackDeal } from './analytics';

export type Screen = 'home' | 'browse' | 'deal' | 'things' | 'directory' | 'saved' | 'submit' | 'privacy' | 'how-it-works';
const SCREENS: Screen[] = ['home', 'browse', 'deal', 'things', 'directory', 'saved', 'submit', 'privacy', 'how-it-works'];

interface Route { screen: Screen; dealId: string }

interface Store {
  screen: Screen;
  dealId: string;
  prev: Screen;
  isMobile: boolean;
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: (patch?: Partial<Filters>) => void;
  saved: string[];
  toggleSave: (id: string) => void;
  homeRegion: Exclude<Region, 'Online'>;
  setHomeRegion: (r: Exclude<Region, 'Online'>) => void;
  coll: CollKey;
  go: (screen: Screen, opts?: { dealId?: string; coll?: CollKey; focusSearch?: boolean }) => void;
  openDeal: (id: string) => void;
  browse: (patch?: Partial<Filters>, focusSearch?: boolean) => void;
  goBack: () => void;
  setColl: (k: CollKey) => void;
  claim: (d: Deal) => void;
  pass: Deal | null;
  closePass: () => void;
  toast: string;
  showToast: (msg: string) => void;
  focusSearch: boolean;
  consumeFocusSearch: () => void;
  showDemo: boolean;
}

const Ctx = createContext<Store | null>(null);

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
};

const SAVED_KEY = 'ett-saved';

/**
 * Reads the page from a clean path (/deal/<id>, /browse). Old links that used
 * a hash (/#/deal/<id>) still work and are rewritten to the clean form.
 */
function parsePath(): Route | null {
  const legacy = (window.location.hash || '').replace(/^#\/?/, '');
  const h = (legacy || window.location.pathname).replace(/^\/+|\/+$/g, '');
  if (!h) return null;
  const [s, id] = h.split('/');
  if (s === 'deal') return DEALS.some((d) => d.id === id) ? { screen: 'deal', dealId: id } : null;
  if ((SCREENS as string[]).includes(s)) return { screen: s as Screen, dealId: '' };
  return null;
}

const pathFor = (r: Route) => (r.screen === 'deal' ? `/deal/${r.dealId}` : r.screen === 'home' ? '/' : `/${r.screen}`);

function readSaved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = parsePath() ?? { screen: 'home' as Screen, dealId: '' };
  // Replace an old /#/… address or an unknown path with the clean one.
  if (typeof window !== 'undefined') {
    const clean = pathFor({ screen: initial.screen, dealId: initial.dealId });
    if (window.location.hash || window.location.pathname !== clean) window.history.replaceState(null, '', clean + window.location.search);
  }
  const [route, setRoute] = useState<Route>({ screen: initial.screen, dealId: initial.dealId || DEALS[0].id });
  const [prev, setPrev] = useState<Screen>('home');
  const [width, setWidth] = useState(() => window.innerWidth);
  const [filters, setFiltersState] = useState<Filters>(DEFAULT_FILTERS);
  const [saved, setSaved] = useState<string[]>(readSaved);
  const [homeRegion, setHomeRegion] = useState<Exclude<Region, 'Online'>>('POS & West');
  const [coll, setColl] = useState<CollKey>('all');
  const [passId, setPassId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [focusSearch, setFocusSearch] = useState(false);
  const toastTimer = useRef<number>();

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    const onPop = () => {
      const r = parsePath() ?? { screen: 'home' as Screen, dealId: '' };
      setRoute((cur) => {
        if (cur.screen !== r.screen) setPrev(cur.screen);
        return { screen: r.screen, dealId: r.dealId || cur.dealId };
      });
      setPassId(null);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  // Keep saved deals in sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === SAVED_KEY && setSaved(readSaved());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const showToast = useCallback((msg: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const go: Store['go'] = useCallback((screen, opts = {}) => {
    setRoute((cur) => {
      const next = { screen, dealId: opts.dealId ?? cur.dealId };
      if (cur.screen !== screen) setPrev(cur.screen);
      const path = pathFor(next);
      if (window.location.pathname !== path) window.history.pushState(null, '', path);
      return next;
    });
    if (opts.coll) setColl(opts.coll);
    if (opts.focusSearch) setFocusSearch(true);
    setPassId(null);
    window.scrollTo(0, 0);
  }, []);

  const browse: Store['browse'] = useCallback((patch = {}, focus = false) => {
    setFiltersState({ ...DEFAULT_FILTERS, ...patch });
    go('browse', { focusSearch: focus });
  }, [go]);

  // Searches (once typing pauses) and store pages, for analytics.
  useEffect(() => {
    const q = filters.q.trim();
    if (q.length < 2) return;
    const t = window.setTimeout(() => track('search', { search_term: q.toLowerCase() }), 1200);
    return () => window.clearTimeout(t);
  }, [filters.q]);
  useEffect(() => {
    if (filters.biz && filters.biz !== 'any') track('view_business', { business: filters.biz });
  }, [filters.biz]);

  const toggleSave = useCallback((id: string) => {
    setSaved((cur) => {
      const has = cur.includes(id);
      const next = has ? cur.filter((x) => x !== id) : [...cur, id];
      const d = DEALS.find((x) => x.id === id);
      if (d && !has) trackDeal('save_deal', d);
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      showToast(has ? 'Removed from Saved' : 'Saved. It’s waiting in your Saved tab.');
      return next;
    });
  }, [showToast]);

  const claim = useCallback((d: Deal) => {
    trackDeal('deal_click', d, { button: d.action, destination: d.destShort ?? '' });
    if (d.url) window.open(d.url, '_blank', 'noopener,noreferrer');
    else if (d.action === 'Show In Store') setPassId(d.id);
    else showToast(`Demo: this would open ${d.destShort} for ${d.biz}`);
  }, [showToast]);

  const isMobile = width < 760;

  const value = useMemo<Store>(() => ({
    screen: route.screen,
    dealId: route.dealId,
    prev,
    isMobile,
    filters,
    setFilters: (patch) => setFiltersState((f) => ({ ...f, ...patch })),
    resetFilters: (patch = {}) => setFiltersState((f) => ({ ...DEFAULT_FILTERS, q: f.q, cat: f.cat, sort: f.sort, ...patch })),
    saved,
    toggleSave,
    homeRegion,
    setHomeRegion,
    coll,
    go,
    openDeal: (id) => go('deal', { dealId: id }),
    browse,
    goBack: () => go(prev && prev !== 'deal' ? prev : 'home'),
    setColl,
    claim,
    pass: passId ? DEALS.find((d) => d.id === passId) ?? null : null,
    closePass: () => setPassId(null),
    toast,
    showToast,
    focusSearch,
    consumeFocusSearch: () => setFocusSearch(false),
    showDemo: true,
  }), [route, prev, isMobile, filters, saved, toggleSave, homeRegion, coll, go, browse, claim, passId, toast, showToast, focusSearch]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
