import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SearchIcon } from '../components/Chrome';
import { DealCard } from '../components/DealCard';
import { CATS, CREAM, DEALS, DEFAULT_FILTERS, FILTER_KEYS, INK, PAPER, REGIONS, SUN, TOMATO, filterDeals, type CatKey, type Filters } from '../data';
import { useStore } from '../store';

type Opt<K extends keyof Filters> = [Filters[K], string];

const GROUPS: { label: string; key: (typeof FILTER_KEYS)[number]; opts: [string, string][] }[] = [
  { label: 'Where', key: 'region', opts: [['all', 'All T&T'], ...REGIONS.map((r) => [r, r] as [string, string])] },
  { label: 'Price (TTD)', key: 'price', opts: [['any', 'Any'], ['free', 'Free'], ['u50', 'Under $50'], ['m150', '$50–150'], ['m300', '$150–300'], ['o300', '$300+']] },
  { label: 'Verified discount', key: 'disc', opts: [['any', 'Any'], ['20', '20%+'], ['30', '30%+'], ['50', '50%+']] },
  { label: 'Added', key: 'added', opts: [['any', 'Any time'], ['today', 'Today'], ['week', 'This week']] },
  { label: 'Ends', key: 'ends', opts: [['any', 'Any time'], ['3', 'Within 3 days'], ['7', 'This week']] },
  { label: 'Format', key: 'format', opts: [['any', 'Any'], ['store', 'In-store'], ['online', 'Online']] },
];

const SORTS: Opt<'sort'>[] = [['popular', 'Most popular'], ['new', 'Newest'], ['ending', 'Ending soonest'], ['saving', 'Biggest saving'], ['price', 'Lowest price']];

const chipStyle = (on: boolean): CSSProperties => ({ background: on ? INK : 'transparent', color: on ? CREAM : INK });

export function Browse() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { filters: f, setFilters, resetFilters, browse, isMobile, focusSearch, consumeFocusSearch } = useStore();
  const searchRef = useRef<HTMLInputElement>(null);
  const results = filterDeals(DEALS, f);
  const activeCount = FILTER_KEYS.filter((k) => f[k] !== DEFAULT_FILTERS[k]).length;
  const n = results.length;
  const nLabel = `${n} ${n === 1 ? 'deal' : 'deals'}`;
  const title = f.q ? `“${f.q}”` : f.cat !== 'all' ? CATS[f.cat].label : f.region !== 'all' ? `Deals: ${f.region}` : 'All deals';
  const color = f.cat !== 'all' ? CATS[f.cat].color : SUN;

  useEffect(() => {
    if (focusSearch && searchRef.current) {
      searchRef.current.focus();
      consumeFocusSearch();
    }
  }, [focusSearch, consumeFocusSearch]);

  // Close sheet on Escape and when switching to desktop.
  useEffect(() => {
    if (!isMobile && sheetOpen) setSheetOpen(false);
  }, [isMobile, sheetOpen]);
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const showPanel = !isMobile || sheetOpen;
  const panelStyle: CSSProperties = !isMobile
    ? { position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 20, border: `2px solid ${INK}`, borderRadius: 22, padding: 18, background: PAPER }
    : { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, background: CREAM, borderTop: `2px solid ${INK}`, borderRadius: '24px 24px 0 0', padding: '16px 20px 0', maxHeight: '84vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18, animation: 'ettSheet .22s ease-out' };

  const catOpts: ['all' | CatKey, string][] = [['all', 'All deals'], ...(Object.entries(CATS) as [CatKey, { label: string }][]).map(([k, c]) => [k, c.label] as ['all' | CatKey, string])];

  return (
    <>
      <section style={{ background: color, borderBottom: `2px solid ${INK}` }}>
        <div className="wrap" style={{ paddingTop: 28, paddingBottom: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 className="display" style={{ fontSize: 'clamp(46px,9vw,100px)', lineHeight: 0.9, textWrap: 'balance', overflowWrap: 'anywhere' } as CSSProperties}>{title}</h1>
          <form role="search" onSubmit={(e) => { e.preventDefault(); searchRef.current?.blur(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: CREAM, border: `2px solid ${INK}`, borderRadius: 999, padding: '4px 6px 4px 18px', boxShadow: `4px 4px 0 ${INK}`, maxWidth: 640 }}>
            <SearchIcon />
            <input
              ref={searchRef}
              type="search"
              value={f.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              placeholder="Search doubles, spa, Tobago, free…"
              aria-label="Search deals"
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 16, minHeight: 44, outline: 'none' }}
            />
            {f.q && <button type="button" className="pill btn-dark" onClick={() => setFilters({ q: '' })} style={{ padding: '0 14px', minHeight: 40, fontWeight: 700, border: 'none' }}>Clear</button>}
          </form>
          <div className="scroll-x" role="group" aria-label="Category" style={{ gap: 8, paddingBottom: 4 }}>
            {catOpts.map(([k, l]) => {
              const on = f.cat === k;
              return <button key={k} type="button" className="pill chip" aria-pressed={on} onClick={() => setFilters({ cat: k })} style={{ background: on ? INK : CREAM, color: on ? CREAM : INK }}>{l}</button>;
            })}
          </div>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 20, paddingBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <span className="display" style={{ fontSize: 24 }} aria-live="polite">{nLabel}</span>
          <div style={{ flex: 1 }} />
          {isMobile && (
            <button type="button" className="pill btn-dark" onClick={() => setSheetOpen(true)} aria-expanded={sheetOpen} style={{ padding: '0 16px', minHeight: 44, fontSize: 14 }}>
              {activeCount ? `Filters (${activeCount})` : 'Filters'}
            </button>
          )}
        </div>
        <div className="scroll-x" role="group" aria-label="Sort" style={{ gap: 8, marginBottom: 22, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>Sort</span>
          {SORTS.map(([v, l]) => (
            <button key={v} type="button" className="pill chip-sm" aria-pressed={f.sort === v} onClick={() => setFilters({ sort: v })} style={chipStyle(f.sort === v)}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : '250px minmax(0,1fr)', gap: 28, alignItems: 'start' }}>
          {showPanel && (
            <aside style={panelStyle} aria-label="Filters" role={isMobile ? 'dialog' : undefined} aria-modal={isMobile ? true : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="display" style={{ fontSize: 26 }}>Filters</span>
                <button type="button" onClick={() => resetFilters()} style={{ border: 'none', background: 'none', fontWeight: 700, fontSize: 14, textDecoration: 'underline', cursor: 'pointer', minHeight: 44 }}>Reset</button>
              </div>
              {GROUPS.map((g) => (
                <div key={g.key} role="group" aria-label={g.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{g.label}</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {g.opts.map(([v, l]) => {
                      const on = f[g.key] === v;
                      return <button key={v} type="button" className="pill chip-xs" aria-pressed={on} onClick={() => setFilters({ [g.key]: v } as Partial<Filters>)} style={chipStyle(on)}>{l}</button>;
                    })}
                  </div>
                </div>
              ))}
              {isMobile && (
                <div style={{ position: 'sticky', bottom: 0, background: CREAM, padding: '12px 0 16px', borderTop: `2px solid ${INK}` }}>
                  <button type="button" className="pill" onClick={() => setSheetOpen(false)} style={{ width: '100%', minHeight: 52, background: TOMATO, color: INK, fontWeight: 800, fontSize: 16 }}>Show {nLabel}</button>
                </div>
              )}
            </aside>
          )}
          <div style={{ minWidth: 0 }}>
            {n === 0 && (
              <div style={{ border: `2px dashed ${INK}`, borderRadius: 22, padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span className="display" style={{ fontSize: 34 }}>Nothing matches yet</span>
                <span style={{ fontSize: 16, color: 'var(--muted)' }}>Try fewer filters. New deals land every morning.</span>
                <button type="button" className="pill btn-dark" onClick={() => browse()} style={{ padding: '0 18px', minHeight: 44 }}>Clear search &amp; filters</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,230px),1fr))', gap: 18 }}>
              {results.map((d) => <DealCard key={d.id} d={d} />)}
            </div>
          </div>
        </div>
      </div>
      {isMobile && sheetOpen && <div onClick={() => setSheetOpen(false)} aria-hidden="true" style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,16,.55)', zIndex: 55 }} />}
    </>
  );
}
