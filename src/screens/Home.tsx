import { useState, type ReactNode } from 'react';
import { DealCard } from '../components/DealCard';
import { CATS, COLLS, CREAM, DEALS, INK, LIME, LILAC, PINK, REGIONS, SKY, SUN, TOMATO, inColl, todayLabel, type CatKey, type Deal, type Filters, type Region } from '../data';
import { useStore } from '../store';

const MUTED = 'var(--muted)';

export function DealRow({ deals }: { deals: Deal[] }) {
  return (
    <div className="scroll-x" style={{ gap: 16, scrollSnapType: 'x mandatory', padding: '4px max(20px, calc((100% - 1200px) / 2)) 16px', scrollPaddingLeft: 'max(20px, calc((100% - 1200px) / 2))' }}>
      {deals.map((d) => (
        <div key={d.id} style={{ flex: '0 0 252px', scrollSnapAlign: 'start' }}><DealCard d={d} /></div>
      ))}
    </div>
  );
}

function RowSection({ title, sub, color, deals, onAll, children }: { title: string; sub: string; color: string; deals: Deal[]; onAll: () => void; children?: ReactNode }) {
  if (!deals.length && !children) return null;
  return (
    <section style={{ padding: '40px 0 8px' }} aria-labelledby={`row-${title}`}>
      <div className="wrap" style={{ paddingBottom: 16, display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', background: color, border: `2px solid ${INK}`, flex: 'none' }} />
            <h2 id={`row-${title}`} className="display" style={{ fontSize: 'clamp(32px,5vw,46px)', lineHeight: 1 }}>{title}</h2>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: MUTED }}>{sub}</p>
        </div>
        <button type="button" className="pill hover-ink" onClick={onAll} style={{ padding: '0 18px', minHeight: 44, fontSize: 14 }}>See all</button>
      </div>
      {children}
      {deals.length > 0 ? <DealRow deals={deals.slice(0, 10)} /> : (
        <div className="wrap"><p style={{ margin: 0, padding: '12px 0 16px', color: MUTED }}>No deals here today. Check back tomorrow morning.</p></div>
      )}
    </section>
  );
}

function Hero({ heroDeal, todayCount }: { heroDeal: Deal; todayCount: number }) {
  const { browse } = useStore();
  return (
    <section style={{ background: TOMATO, borderBottom: `2px solid ${INK}`, overflow: 'hidden' }}>
      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 44, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 36, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: INK, color: CREAM, borderRadius: 999, padding: '6px 12px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase' }}>{todayLabel}</span>
            <span style={{ background: LIME, border: `2px solid ${INK}`, borderRadius: 999, padding: '4px 12px', fontWeight: 800, fontSize: 13 }}>{todayCount} new today</span>
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(54px,10vw,118px)', lineHeight: 0.9, letterSpacing: '-.005em', color: CREAM, textWrap: 'balance' } as React.CSSProperties}>
            Today’s best deals in T&amp;T.
          </h1>
          <p style={{ margin: 0, maxWidth: 520, fontSize: 18, lineHeight: 1.45, fontWeight: 500, textWrap: 'pretty' } as React.CSSProperties}>
            Food specials, shop sales, events and things to do across Trinidad &amp; Tobago. Every offer is checked by our team. Tap one and go straight to the business.
          </p>
          <button
            type="button"
            onClick={() => browse({}, true)}
            style={{ cursor: 'text', display: 'flex', alignItems: 'center', gap: 10, background: CREAM, border: `2px solid ${INK}`, borderRadius: 999, padding: '6px 6px 6px 18px', boxShadow: `4px 4px 0 ${INK}`, maxWidth: 520, width: '100%', textAlign: 'left' }}
          >
            <span style={{ flex: 1, fontSize: 16, color: 'var(--muted-3)' }}>Search doubles, spa, Tobago, free…</span>
            <span style={{ background: INK, color: CREAM, borderRadius: 999, padding: '12px 18px', fontWeight: 800, fontSize: 14 }}>Find deals</span>
          </button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(Object.entries(CATS) as [CatKey, (typeof CATS)[CatKey]][]).map(([k, c]) => (
              <button key={k} type="button" className="pill chip hover-lift" onClick={() => browse({ cat: k })} style={{ background: c.color, padding: '8px 14px', minHeight: 40 }}>{c.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', padding: '20px 0' }}>
          <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 'max(0px, calc(50% - 170px))', zIndex: 2, width: 96, height: 96, borderRadius: '50%', background: SUN, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', textAlign: 'center', fontFamily: 'var(--display)', fontSize: 15, lineHeight: 1.05, transform: 'rotate(-14deg)' }}>
            DEAL<br />OF THE<br />DAY
          </div>
          <div style={{ width: 'min(100%,300px)', transform: 'rotate(3deg)' }}>
            <DealCard d={heroDeal} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ThingsTeaser() {
  const { go } = useStore();
  const picks = inColl('weekend').slice(0, 3);
  return (
    <section style={{ marginTop: 40, background: LILAC, borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}` }}>
      <div className="wrap" style={{ paddingTop: 44, paddingBottom: 44, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 32, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="eyebrow">Things to Do · updated every Thursday</span>
          <h2 className="display" style={{ fontSize: 'clamp(48px,8vw,88px)', lineHeight: 0.9 }}>Plans for the weekend?</h2>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.45, maxWidth: 440 }}>Events, date ideas, free days out and family plans across both islands.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLLS.slice(0, 4).map((c) => (
              <button key={c.k} type="button" className="pill hover-ink" onClick={() => go('things', { coll: c.k })} style={{ background: CREAM, padding: '8px 14px', fontSize: 14, minHeight: 40 }}>{c.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', background: CREAM, border: `2px solid ${INK}`, borderRadius: 22, boxShadow: `6px 6px 0 ${INK}`, overflow: 'hidden' }}>
          {picks.map((t) => <WeekendPick key={t.id} t={t} />)}
          <button type="button" onClick={() => go('things')} style={{ border: 'none', background: INK, color: CREAM, padding: 16, fontWeight: 800, fontSize: 15, cursor: 'pointer', minHeight: 52 }}>Open Things to Do →</button>
        </div>
      </div>
    </section>
  );
}

function WeekendPick({ t }: { t: Deal }) {
  const { openDeal } = useStore();
  return (
    <button type="button" className="row-hover" onClick={() => openDeal(t.id)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: '72px minmax(0,1fr) auto', gap: 14, alignItems: 'center', padding: 14, border: 'none', borderBottom: `2px solid ${INK}`, background: 'transparent', textAlign: 'left' }}>
      <div className="stripes-sm" style={{ width: 72, height: 72, borderRadius: 14, border: `2px solid ${INK}`, backgroundColor: t.color }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)' }}>{t.when}</div>
        <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2, marginTop: 2 }}>{t.title}</div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{t.area}</div>
      </div>
      <span style={{ fontFamily: 'var(--display)', fontSize: 20 }}>{t.priceLabel}</span>
    </button>
  );
}

function Digest() {
  const { showToast } = useStore();
  const [phone, setPhone] = useState('');
  return (
    <section className="wrap" style={{ marginTop: 48 }}>
      <div style={{ background: SUN, border: `2px solid ${INK}`, borderRadius: 28, boxShadow: `6px 6px 0 ${INK}`, padding: 'clamp(24px,4vw,44px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 24, alignItems: 'center' }}>
        <div>
          <h2 className="display" style={{ fontSize: 'clamp(36px,5.5vw,60px)', lineHeight: 0.95 }}>The Friday Five, on WhatsApp.</h2>
          <p style={{ margin: '10px 0 0', fontSize: 16, lineHeight: 1.45, maxWidth: 440 }}>The five best deals for the weekend, every Friday at 9am. Optional. Unsubscribe any time by replying STOP.</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); showToast(phone.trim() ? 'Done. Your first Friday Five arrives this week.' : 'Add your WhatsApp number first'); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 868 555 0123"
              inputMode="tel"
              type="tel"
              aria-label="WhatsApp number"
              style={{ flex: '1 1 200px', minHeight: 52, border: `2px solid ${INK}`, borderRadius: 999, padding: '0 18px', fontSize: 16, background: CREAM, outline: 'none' }}
            />
            <button type="submit" className="pill btn-dark" style={{ minHeight: 52, padding: '0 22px', fontSize: 15 }}>Send me deals</button>
          </div>
          <button type="button" onClick={() => showToast('Demo: email sign-up would open here')} style={{ fontSize: 14, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0 }}>
            Prefer email? Get it by email instead
          </button>
        </form>
      </div>
    </section>
  );
}

export function Home() {
  const { browse, homeRegion, setHomeRegion } = useStore();
  const active = DEALS.filter((d) => d.startsIn <= 0);
  const byHot = [...active].sort((a, b) => b.hot - a.hot);
  const newCount = DEALS.filter((d) => d.isNew).length;
  const todayCount = DEALS.filter((d) => d.added === 0).length;
  const b = (p: Partial<Filters>) => () => browse(p);

  return (
    <>
      <Hero heroDeal={byHot.find((d) => !d.demo) ?? byHot[0]} todayCount={todayCount} />
      <button type="button" className="new-strip" onClick={b({ sort: 'new', added: 'week' })} style={{ display: 'block', width: '100%', cursor: 'pointer', background: LIME, border: 'none', borderBottom: `2px solid ${INK}`, padding: 0, textAlign: 'left' }}>
        <div className="wrap" style={{ paddingTop: 14, paddingBottom: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span className="display" style={{ fontSize: 24, lineHeight: 1 }}>{newCount} new since your last visit</span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Fresh deals added in the last two days</span>
          <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 15 }}>See what’s new →</span>
        </div>
      </button>

      <RowSection title="Today's Deals" sub="Picked this morning by our team. New picks tomorrow." color={TOMATO} deals={byHot} onAll={b({ sort: 'popular' })} />
      <RowSection title="Just Added" sub="Fresh in the last few days." color={LIME} deals={[...DEALS].sort((a, c) => a.added - c.added)} onAll={b({ sort: 'new' })} />
      <ThingsTeaser />
      <RowSection title="Featured" sub="Our editors’ favourites this week." color={SUN} deals={DEALS.filter((d) => d.featured)} onAll={b({ sort: 'popular' })} />
      <RowSection title="Food & Drink" sub="Specials from kitchens, bars and roti shops." color={TOMATO} deals={DEALS.filter((d) => d.cat === 'food')} onAll={b({ cat: 'food' })} />
      <RowSection title="Deals Near You" sub={`Showing deals around ${homeRegion}.`} color={SKY} deals={[...DEALS.filter((d) => d.region === homeRegion), ...DEALS.filter((d) => d.region === 'Islandwide')]} onAll={b({ region: homeRegion })}>
        <div className="wrap scroll-x" role="group" aria-label="Choose your area" style={{ paddingBottom: 16, gap: 8 }}>
          {REGIONS.filter((r): r is Exclude<Region, 'Online'> => r !== 'Online').map((r) => {
            const on = r === homeRegion;
            return (
              <button key={r} type="button" className="pill" aria-pressed={on} onClick={() => setHomeRegion(r)} style={{ background: on ? INK : 'transparent', color: on ? CREAM : INK, padding: '6px 14px', fontSize: 14, minHeight: 40 }}>{r}</button>
            );
          })}
        </div>
      </RowSection>
      <RowSection title="Shopping & Retail" sub="Sales in store and online." color={SUN} deals={DEALS.filter((d) => d.cat === 'shopping')} onAll={b({ cat: 'shopping' })} />
      <RowSection title="Beauty & Wellness" sub="Treat yourself, for less." color={PINK} deals={DEALS.filter((d) => d.cat === 'beauty')} onAll={b({ cat: 'beauty' })} />
      <RowSection title="Events & Entertainment" sub="Shows, limes and nights out." color={LILAC} deals={DEALS.filter((d) => d.cat === 'events' || d.cat === 'experiences')} onAll={b({ cat: 'events' })} />
      <RowSection title="Ending Soon" sub="Real expiry dates only. Catch these before they go." color={INK} deals={active.filter((d) => d.daysLeft <= 5).sort((a, c) => a.daysLeft - c.daysLeft)} onAll={b({ sort: 'ending', ends: '7' })} />
      <Digest />
    </>
  );
}
