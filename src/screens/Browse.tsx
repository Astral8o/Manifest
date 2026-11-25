import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Scroller } from '../components/Scroller';
import { SearchIcon } from '../components/Chrome';
import { DealCard } from '../components/DealCard';
import {
  ACTIVE_CATS, BUSINESSES, CATS, CREAM, DEALS, DEFAULT_FILTERS, FILTER_KEYS, INK, KINDS, PAPER, REGIONS, SIZES, TOMATO,
  filterDeals, type CatKey, type FilterKey, type Filters,
} from '../data';
import { useStore } from '../store';

/** Every filter group and its options. Options matching no deals are hidden; groups left with one option are hidden too. */
const GROUPS: { label: string; key: FilterKey; opts: [string, string][] }[] = [
  { label: 'Price', key: 'price', opts: [['free', 'Free'], ['u50', 'Under TT$50'], ['u100', 'Under TT$100'], ['u200', 'Under TT$200'], ['u500', 'Under TT$500'], ['o200', 'TT$200+']] },
  { label: 'Type', key: 'kind', opts: Object.entries(KINDS) },
  { label: 'Size', key: 'size', opts: Object.entries(SIZES) },
  { label: 'Get it by', key: 'format', opts: [['online', 'Delivery'], ['store', 'Pickup / in store']] },
  { label: 'Business', key: 'biz', opts: BUSINESSES.map((b) => [b.name, b.name]) },
  { label: 'Where', key: 'region', opts: REGIONS.map((r) => [r, r]) },
  { label: 'Discount', key: 'disc', opts: [['20', '20%+'], ['30', '30%+'], ['50', '50%+']] },
  { label: 'Added', key: 'added', opts: [['today', 'Today'], ['week', 'This week']] },
  { label: 'Ends', key: 'ends', opts: [['3', 'Within 3 days'], ['7', 'This week']] },
];
const ANY: Record<FilterKey, string> = { price: 'any', kind: 'any', size: 'any', format: 'any', biz: 'any', region: 'all', disc: 'any', added: 'any', ends: 'any' };

const SORTS: [Filters['sort'], string][] = [['popular', 'Popular'], ['price', 'Lowest price'], ['priceDesc', 'Highest price'], ['new', 'Newest'], ['saving', 'Biggest saving'], ['ending', 'Ending soonest']];

export function Browse() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { filters: f, setFilters, resetFilters, browse, isMobile, focusSearch, consumeFocusSearch } = useStore();
  const searchRef = useRef<HTMLInputElement>(null);
  const results = filterDeals(DEALS, f);
  const n = results.length;
  const nLabel = `${n} ${n === 1 ? 'deal' : 'deals'}`;

  // Live counts per option, computed with that group's own filter removed.
  const groups = GROUPS.map((g) => {
    const base = filterDeals(DEALS, f, g.key);
    const opts = g.opts
      .map(([v, l]) => ({ v, l, n: filterDeals(base, { ...DEFAULT_FILTERS, sort: f.sort, [g.key]: v } as Filters).length }))
      .filter((o) => o.n > 0 || f[g.key] === o.v);
    return { ...g, base: base.length, opts };
  }).filter((g) => f[g.key] !== ANY[g.key] || g.opts.some((o) => o.n < g.base));

  const active = FILTER_KEYS.filter((k) => f[k] !== DEFAULT_FILTERS[k]);
  const activeChips = active.map((k) => {
    const g = GROUPS.find((x) => x.key === k)!;
    const label = g.opts.find(([v]) => v === f[k])?.[1] ?? String(f[k]);
    return { k, label };
  });
  const title = f.biz !== 'any' ? f.biz : f.q ? `“${f.q}”` : f.kind !== 'any' ? KINDS[f.kind] : f.size !== 'any' ? SIZES[f.size] : f.cat !== 'all' ? CATS[f.cat].label : 'All deals';

  useEffect(() => {
    if (focusSearch && searchRef.current) { searchRef.current.focus(); consumeFocusSearch(); }
  }, [focusSearch, consumeFocusSearch]);
  useEffect(() => { if (!isMobile && sheetOpen) setSheetOpen(false); }, [isMobile, sheetOpen]);
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const showPanel = !isMobile || sheetOpen;
  const panelStyle: CSSProperties = !isMobile
    ? { position: 'sticky', top: 146, display: 'flex', flexDirection: 'column', gap: 18, border: `2px solid ${INK}`, borderRadius: 20, padding: 16, background: PAPER, maxHeight: 'calc(100vh - 162px)', overflowY: 'auto' }
    : { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, background: CREAM, borderTop: `2px solid ${INK}`, borderRadius: '24px 24px 0 0', padding: '16px 20px 0', maxHeight: '84vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18, animation: 'ettSheet .22s ease-out' };

  const catOpts: ['all' | CatKey, string][] = ACTIVE_CATS.length > 1 ? [['all', 'All'], ...ACTIVE_CATS.map((k) => [k, CATS[k].label] as ['all' | CatKey, string])] : [];

  return (
    <>
      <section style={{ background: f.cat !== 'all' ? CATS[f.cat].color : 'var(--sun)', borderBottom: `2px solid ${INK}` }}>
        <div className="wrap" style={{ paddingTop: 18, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="display" style={{ fontSize: 'clamp(36px,6vw,64px)', lineHeight: 0.9, overflowWrap: 'anywhere' }}>{title}</h1>
            <span style={{ fontWeight: 800, fontSize: 15 }} aria-live="polite">{nLabel}</span>
          </div>
          <form role="search" onSubmit={(e) => { e.preventDefault(); searchRef.current?.blur(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: CREAM, border: `2px solid ${INK}`, borderRadius: 999, padding: '4px 6px 4px 16px', boxShadow: `3px 3px 0 ${INK}`, maxWidth: 640 }}>
            <SearchIcon />
            <input ref={searchRef} type="search" value={f.q} onChange={(e) => setFilters({ q: e.target.value })} placeholder="Search deals, stores or products" aria-label="Search deals" style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 16, minHeight: 42, outline: 'none' }} />
            {f.q && <button type="button" className="pill btn-dark" onClick={() => setFilters({ q: '' })} style={{ padding: '0 14px', minHeight: 38, fontWeight: 700, border: 'none' }}>Clear</button>}
          </form>
          {catOpts.length > 0 && (
            <Scroller small className="scroll-x" role="group" label="Category" style={{ gap: 8 }}>
              {catOpts.map(([k, l]) => <button key={k} type="button" className="qchip" aria-pressed={f.cat === k} onClick={() => setFilters({ cat: k })}>{l}</button>)}
            </Scroller>
          )}
        </div>
      </section>

      {/* Sticky toolbar: filters button (phones), sort, and the filters in use */}
      <div className="quick-rail">
        <Scroller small className="rail" style={{ alignItems: 'center' }}>
          {isMobile && (
            <button type="button" className="qchip" aria-expanded={sheetOpen} onClick={() => setSheetOpen(true)} style={{ background: INK, color: CREAM }}>
              Filters{active.length ? ` · ${active.length}` : ''}
            </button>
          )}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-2)' }}>Sort</span>
            <select value={f.sort} onChange={(e) => setFilters({ sort: e.target.value as Filters['sort'] })} className="qchip" style={{ appearance: 'auto', paddingRight: 8 }}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {activeChips.map((c) => (
            <button key={c.k} type="button" className="qchip" aria-label={`Remove filter ${c.label}`} onClick={() => setFilters({ [c.k]: ANY[c.k] } as Partial<Filters>)} style={{ background: 'var(--lime)' }}>
              {c.label} ✕
            </button>
          ))}
          {active.length > 1 && <button type="button" className="see-all" onClick={() => resetFilters()} style={{ minHeight: 40 }}>Clear all</button>}
        </Scroller>
      </div>

      <div className="wrap" style={{ paddingTop: 18, paddingBottom: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : '240px minmax(0,1fr)', gap: 24, alignItems: 'start' }}>
          {showPanel && (
            <aside style={panelStyle} aria-label="Filters" role={isMobile ? 'dialog' : undefined} aria-modal={isMobile ? true : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="display" style={{ fontSize: 24 }}>Filters</span>
                {active.length > 0 && <button type="button" onClick={() => resetFilters()} style={{ border: 'none', background: 'none', fontWeight: 700, fontSize: 14, textDecoration: 'underline', cursor: 'pointer', minHeight: 44 }}>Reset</button>}
              </div>
              {groups.map((g) => (
                <div key={g.key} role="group" aria-label={g.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{g.label}</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {g.opts.map((o) => {
                      const on = f[g.key] === o.v;
                      return (
                        <button key={o.v} type="button" className="qchip" aria-pressed={on} onClick={() => setFilters({ [g.key]: on ? ANY[g.key] : o.v } as Partial<Filters>)} style={{ minHeight: 38, fontSize: 13, padding: '0 12px' }}>
                          {o.l} <span className="n">{o.n}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {isMobile && (
                <div style={{ position: 'sticky', bottom: 0, background: CREAM, padding: '12px 0 16px', borderTop: `2px solid ${INK}`, marginTop: 'auto' }}>
                  <button type="button" className="pill" onClick={() => setSheetOpen(false)} style={{ width: '100%', minHeight: 52, background: TOMATO, color: INK, fontWeight: 800, fontSize: 16 }}>Show {nLabel}</button>
                </div>
              )}
            </aside>
          )}
          <div style={{ minWidth: 0 }}>
            {n === 0 ? (
              <div style={{ border: `2px dashed ${INK}`, borderRadius: 22, padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span className="display" style={{ fontSize: 32 }}>Nothing here… yet</span>
                <span style={{ fontSize: 16, color: 'var(--muted)' }}>Try another word or fewer filters. New deals land every day.</span>
                <button type="button" className="pill btn-dark" onClick={() => browse()} style={{ padding: '0 18px', minHeight: 44 }}>See all deals</button>
              </div>
            ) : (
              <div className="deal-grid">
                {results.map((d, i) => <DealCard key={d.id} d={d} eager={i < 4} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      {isMobile && sheetOpen && <div onClick={() => setSheetOpen(false)} aria-hidden="true" style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,16,.55)', zIndex: 55 }} />}
    </>
  );
}
