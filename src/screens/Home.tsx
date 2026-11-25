import { useState } from 'react';
import { DealCard, FeatureCard } from '../components/DealCard';
import { SearchIcon } from '../components/Chrome';
import {
  ACTIVE_CATS, ACTIVE_COLLS, BUSINESSES, CATS, CREAM, DEALS, INK, LILAC, SUN, TOMATO,
  filterDeals, inColl, todayLabel, DEFAULT_FILTERS, type Deal, type Filters,
} from '../data';
import { useStore } from '../store';

const count = (p: Partial<Filters>) => filterDeals(DEALS, { ...DEFAULT_FILTERS, ...p }).length;

/** Horizontal, swipeable row of deal cards. */
export function DealRow({ deals }: { deals: Deal[] }) {
  return (
    <div className="deal-row">
      {deals.map((d) => <div key={d.id}><DealCard d={d} /></div>)}
    </div>
  );
}

function SectionHead({ title, sub, onAll, allLabel = 'See all', color }: { title: string; sub?: string; onAll?: () => void; allLabel?: string; color?: string }) {
  return (
    <div className="wrap sec-head">
      <div style={{ minWidth: 0 }}>
        <h2 className="display" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {color && <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: '50%', background: color, border: `2px solid ${INK}`, flex: 'none' }} />}
          {title}
        </h2>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {onAll && <button type="button" className="see-all" onClick={onAll}>{allLabel} →</button>}
    </div>
  );
}

function RowSection({ title, sub, deals, onAll, min = 2, color }: { title: string; sub?: string; deals: Deal[]; onAll: () => void; min?: number; color?: string }) {
  if (deals.length < min) return null;
  return (
    <section style={{ paddingTop: 28 }}>
      <SectionHead title={title} sub={sub} onAll={onAll} allLabel={`All ${deals.length}`} color={color} />
      <DealRow deals={deals.slice(0, 12)} />
    </section>
  );
}

function Top({ spotlight }: { spotlight: Deal[] }) {
  const { browse } = useStore();
  const [q, setQ] = useState('');
  const newCount = DEALS.filter((d) => d.added <= 7).length;
  return (
    <section style={{ background: TOMATO, borderBottom: `2px solid ${INK}` }}>
      <div className="wrap" style={{ paddingTop: 20, paddingBottom: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ background: INK, color: CREAM, borderRadius: 999, padding: '5px 11px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase' }}>{todayLabel}</span>
          {newCount > 0 && (
            <button type="button" onClick={() => browse({ added: 'week', sort: 'new' })} style={{ background: 'var(--lime)', border: `2px solid ${INK}`, borderRadius: 999, padding: '3px 11px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              {newCount} fresh this week →
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <h1 className="display" style={{ fontSize: 'clamp(42px,7.5vw,84px)', lineHeight: 0.88, color: CREAM, flex: '1 1 300px' }}>
            Today’s best deals in T&amp;T
          </h1>
          <form
            role="search"
            onSubmit={(e) => { e.preventDefault(); browse({ q: q.trim() }); }}
            style={{ flex: '1 1 340px', maxWidth: 560, display: 'flex', alignItems: 'center', gap: 8, background: CREAM, border: `2px solid ${INK}`, borderRadius: 999, padding: '4px 4px 4px 16px', boxShadow: `4px 4px 0 ${INK}` }}
          >
            <SearchIcon />
            <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search deals, stores or products" aria-label="Search deals" style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 16, minHeight: 44, outline: 'none' }} />
            <button type="submit" className="pill btn-dark" style={{ minHeight: 44, padding: '0 16px', fontSize: 14, border: 'none' }}>Find it</button>
          </form>
        </div>
      </div>
      <div className="deal-row feature-row" style={{ paddingBottom: 22 }}>
        {spotlight.map((d, i) => <div key={d.id}><FeatureCard d={d} label={i === 0 ? 'Deal of the day' : 'Hot right now'} /></div>)}
      </div>
    </section>
  );
}

/** Sticky row of one-tap shortcuts into the most useful filters. Options with no deals are hidden. */
function QuickRail() {
  const { browse } = useStore();
  const opts: [string, Partial<Filters>][] = [
    ...ACTIVE_CATS.map((k) => [CATS[k].label, { cat: k }] as [string, Partial<Filters>]),
    ['Under TT$100', { price: 'u100' }],
    ['Under TT$500', { price: 'u500' }],
  ];
  return (
    <nav className="quick-rail" aria-label="Quick filters">
      <div className="rail">
        <button type="button" className="qchip" aria-pressed="true" onClick={() => browse()}>All deals <span className="n">{DEALS.length}</span></button>
        {opts.map(([label, p]) => {
          const n = count(p);
          if (!n || n === DEALS.length) return null;
          return <button key={label} type="button" className="qchip" onClick={() => browse(p)}>{label} <span className="n">{n}</span></button>;
        })}
      </div>
    </nav>
  );
}

function BizStrip() {
  const { browse, go } = useStore();
  if (!BUSINESSES.length) return null;
  return (
    <section style={{ paddingTop: 24 }}>
      <SectionHead title="Shop by store" sub="Your go-to spots. Every deal they’ve got, one tap." onAll={() => go('directory')} allLabel="All stores" />
      <div className="deal-row" style={{ gap: 14 }}>
        {[...BUSINESSES].filter((b) => DEALS.some((d) => d.biz === b.name)).sort((a, c) => DEALS.filter((d) => d.biz === c.name).length - DEALS.filter((d) => d.biz === a.name).length).map((b) => (
          <button key={b.name} type="button" className="biz-chip" style={{ flexBasis: 84 }} onClick={() => browse({ biz: b.name })}>
            <span className="logo" style={b.logo ? undefined : { background: CATS[b.cat].color, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: 30, color: INK }}>{b.logo ? <img src={b.logo} alt="" /> : b.name.charAt(0)}</span>
            <span>{b.name}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: -4 }}>{DEALS.filter((d) => d.biz === b.name).length} deals</span>
          </button>
        ))}
        <button type="button" className="biz-chip" style={{ flexBasis: 84 }} onClick={() => go('submit')}>
          <span className="logo" style={{ background: CREAM, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: 30, boxShadow: 'none', borderStyle: 'dashed' }}>+</span>
          <span>Add yours</span>
        </button>
      </div>
    </section>
  );
}

const SORTS: [Filters['sort'], string][] = [['popular', 'Popular'], ['price', 'Lowest price'], ['priceDesc', 'Highest price'], ['new', 'Newest']];

function AllDeals() {
  const [sort, setSort] = useState<Filters['sort']>('popular');
  const [shown, setShown] = useState(12);
  const all = filterDeals(DEALS, { ...DEFAULT_FILTERS, sort });
  const deals = all.slice(0, shown);
  return (
    <section style={{ paddingTop: 32 }}>
      <SectionHead title={`Every deal · ${all.length}`} sub="Everything on right now, best first." />
      <div className="wrap">
        <div className="scroll-x" role="group" aria-label="Sort" style={{ gap: 8, marginBottom: 14 }}>
          {SORTS.map(([v, l]) => (
            <button key={v} type="button" className="qchip" aria-pressed={sort === v} onClick={() => setSort(v)} style={{ minHeight: 36, fontSize: 13 }}>{l}</button>
          ))}
        </div>
        <div className="deal-grid">
          {deals.map((d) => <DealCard key={d.id} d={d} />)}
        </div>
        {shown < all.length && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
            <button type="button" className="pill btn-dark" onClick={() => setShown((n) => n + 12)} style={{ minHeight: 50, padding: '0 28px', fontSize: 15 }}>
              Show me {Math.min(12, all.length - shown)} more
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ThingsTeaser() {
  const { go, openDeal } = useStore();
  if (!ACTIVE_COLLS.length) return null;
  const picks = inColl('weekend').slice(0, 3);
  return (
    <section style={{ marginTop: 40, background: LILAC, borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}` }}>
      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="eyebrow">Things to Do · fresh every Thursday</span>
        <h2 className="display" style={{ fontSize: 'clamp(36px,6vw,64px)', lineHeight: 0.9 }}>Weekend plans, sorted.</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ACTIVE_COLLS.slice(0, 5).map((c) => (
            <button key={c.k} type="button" className="qchip" onClick={() => go('things', { coll: c.k })}>{c.label}</button>
          ))}
        </div>
        {picks.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {picks.map((t) => (
              <button key={t.id} type="button" onClick={() => openDeal(t.id)} style={{ display: 'flex', gap: 10, alignItems: 'center', background: CREAM, border: `2px solid ${INK}`, borderRadius: 16, padding: 8, cursor: 'pointer', textAlign: 'left', flex: '1 1 260px' }}>
                <span style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flex: 'none', background: INK, border: `2px solid ${INK}` }}>
                  {t.image && <img src={t.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{t.title}</span>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{t.priceLabel}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** EventoryTT's WhatsApp number for the Friday Five sign-up (no plus or dashes, as wa.me needs). */
const WHATSAPP_NUMBER = '18687177720';
const JOIN_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi EventoryTT, add me to the Friday Five.')}`;

function Digest() {
  return (
    <section className="wrap" style={{ marginTop: 40 }}>
      <div style={{ background: SUN, border: `2px solid ${INK}`, borderRadius: 24, boxShadow: `5px 5px 0 ${INK}`, padding: 'clamp(20px,4vw,36px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20, alignItems: 'center' }}>
        <div>
          <h2 className="display" style={{ fontSize: 'clamp(32px,5vw,52px)', lineHeight: 0.95 }}>The Friday Five, on WhatsApp</h2>
          <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.45, maxWidth: 440 }}>Five deals worth your weekend, every Friday at 9am. Tap below, hit send, and you’re in. Reply STOP any time.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <a href={JOIN_LINK} target="_blank" rel="noopener noreferrer" className="pill btn-dark"
            style={{ display: 'inline-flex', alignItems: 'center', minHeight: 54, padding: '0 26px', fontSize: 16, textDecoration: 'none', color: CREAM }}>
            Join on WhatsApp →
          </a>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Opens WhatsApp with the message ready to send.</span>
        </div>
      </div>
    </section>
  );
}

/**
 * Round-robin across businesses so no single business fills a row,
 * keeping each business's own order (best first).
 */
function spread(list: Deal[]): Deal[] {
  const groups = new Map<string, Deal[]>();
  list.forEach((d) => groups.set(d.biz, [...(groups.get(d.biz) ?? []), d]));
  const queues = [...groups.values()];
  const out: Deal[] = [];
  while (out.length < list.length) queues.forEach((q) => { const d = q.shift(); if (d) out.push(d); });
  return out;
}

export function Home() {
  const { browse } = useStore();
  const live = DEALS.filter((d) => d.startsIn <= 0);
  const byHot = [...live].sort((a, b) => b.hot - a.hot);
  const spotlight = spread([...byHot.filter((d) => d.featured), ...byHot.filter((d) => !d.featured)]).slice(0, 6);
  const b = (p: Partial<Filters>) => () => browse(p);
  const upcoming = DEALS.filter((d) => d.startsIn > 0).sort((a, c) => a.startsIn - c.startsIn);
  const ending = live.filter((d) => d.daysLeft <= 5).sort((a, c) => a.daysLeft - c.daysLeft);
  const savings = spread(live.filter((d) => d.was > d.price && d.pct >= 10).sort((a, c) => c.pct - a.pct || (c.was - c.price) - (a.was - a.price)));

  return (
    <>
      <Top spotlight={spotlight} />
      <QuickRail />
      <RowSection title="Coming soon" sub="Sales starting soon. Tap ♡ to save one for later." deals={upcoming} onAll={b({ sort: 'new' })} min={1} />
      <RowSection title="Last call" sub="These deals end in the next few days." deals={ending} onAll={b({ sort: 'ending', ends: '7' })} min={1} />
      <RowSection title="Biggest savings" sub={savings.length ? `Up to ${savings[0].pct}% off the original price.` : ''} deals={savings} onAll={b({ sort: 'saving', disc: '20' })} color={TOMATO} />
      <BizStrip />
      {ACTIVE_CATS.map((k) => {
        const deals = spread(byHot.filter((d) => d.cat === k));
        const bizCount = new Set(deals.map((d) => d.biz)).size;
        return (
          <RowSection key={k} title={CATS[k].label} color={CATS[k].color}
            sub={`${deals.length} ${deals.length === 1 ? 'deal' : 'deals'} · ${bizCount} ${bizCount === 1 ? 'store' : 'stores'}`}
            deals={deals} onAll={b({ cat: k })} min={1} />
        );
      })}
      <AllDeals />
      <ThingsTeaser />
      <Digest />
    </>
  );
}
