import { DealCard } from '../components/DealCard';
import { Starburst } from '../components/Starburst';
import { CREAM, DEALS, INK, LILAC, LIME, PAPER, PINK, SKY, SUN, TOMATO } from '../data';

const PALETTE: [string, string, string][] = [
  ['Tomato', TOMATO, 'Food, primary CTA'],
  ['Sunflower', SUN, 'Shopping, discounts'],
  ['Bubblegum', PINK, 'Beauty, saved'],
  ['Lilac', LILAC, 'Events, Things to Do'],
  ['Lime', LIME, 'Experiences, new, share'],
  ['Sky', SKY, 'Near you, outdoor'],
  ['Ink', INK, 'Text, borders'],
  ['Cream', CREAM, 'Background'],
];

const RULES = [
  'Each category owns one colour, used on chips, headers and image grounds.',
  'Every card has exactly one action, matched to how the business takes customers.',
  'Urgency comes only from real expiry dates. No countdown timers or fake stock.',
  'Prices are always in TTD. Original price and savings appear only when verified.',
  'Browsing, saving and sharing never require an account.',
];

const box = { border: `2px solid ${INK}`, borderRadius: 22, padding: 22, display: 'flex', flexDirection: 'column' as const, background: PAPER };

export function DesignSystem() {
  const heroDeal = [...DEALS].filter((d) => d.startsIn <= 0).sort((a, b) => b.hot - a.hot)[0];
  return (
    <div className="wrap" style={{ paddingTop: 32, paddingBottom: 56, display: 'flex', flexDirection: 'column', gap: 44 }}>
      <div>
        <span className="eyebrow">EventoryTT · v1</span>
        <h1 className="display" style={{ margin: '6px 0 0', fontSize: 'clamp(56px,10vw,120px)', lineHeight: 0.85 }}>Design system</h1>
      </div>
      <div>
        <h2 className="display" style={{ margin: '0 0 14px', fontSize: 32 }}>Colour · one per category</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
          {PALETTE.map(([name, hex, use]) => (
            <div key={name} style={{ border: `2px solid ${INK}`, borderRadius: 18, overflow: 'hidden', background: PAPER }}>
              <div style={{ height: 90, background: hex, borderBottom: `2px solid ${INK}` }} />
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{hex} · {use}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 20 }}>
        <div style={{ ...box, gap: 12 }}>
          <h2 className="display" style={{ fontSize: 32 }}>Type</h2>
          <div className="display" style={{ fontSize: 64, lineHeight: 0.9 }}>Anton Display</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Headlines, prices, stickers · always uppercase · 0.85–0.95 line height</div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>Archivo 700 — offer titles</div>
          <div style={{ fontSize: 16, lineHeight: 1.5 }}>Archivo 400/500 — body copy at 15–18px with 1.45 line height.</div>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '.06em' }}>DM Mono — dates, labels, image notes</div>
        </div>
        <div style={{ ...box, gap: 14 }}>
          <h2 className="display" style={{ fontSize: 32 }}>Buttons &amp; badges</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ border: `2px solid ${INK}`, background: TOMATO, borderRadius: 999, padding: '12px 20px', fontWeight: 800, boxShadow: `4px 4px 0 ${INK}` }}>Primary action</span>
            <span style={{ background: INK, color: CREAM, borderRadius: 999, padding: '12px 20px', fontWeight: 800 }}>Card action</span>
            <span style={{ border: `2px solid ${INK}`, borderRadius: 999, padding: '10px 18px', fontWeight: 700 }}>Secondary</span>
            <span style={{ border: `2px solid ${INK}`, background: LIME, borderRadius: 999, padding: '10px 18px', fontWeight: 800 }}>Share on WhatsApp</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge-new" style={{ padding: '2px 10px', fontSize: 15, letterSpacing: 0 }}>NEW</span>
            <span className="badge-ends" style={{ padding: '3px 10px', fontSize: 15, letterSpacing: 0 }}>2 DAYS LEFT</span>
            <Starburst size={70} fontSize={19}>-25%</Starburst>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: '#3A342E' }}>Ink borders at 2px, hard offset shadows (4–8px), fully rounded pills, 18–28px card radius. Hit targets 44px minimum.</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 24, alignItems: 'start' }}>
        <div style={{ maxWidth: 280 }}><DealCard d={heroDeal} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="display" style={{ fontSize: 32 }}>Rules</h2>
          {RULES.map((r) => <div key={r} style={{ fontSize: 16, lineHeight: 1.45, padding: '10px 0', borderTop: `2px solid ${INK}` }}>{r}</div>)}
        </div>
      </div>
    </div>
  );
}
