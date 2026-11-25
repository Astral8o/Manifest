import { CREAM, INK, LILAC, LIME, PINK, SUN, TOMATO } from '../data';
import { useStore, type Screen } from '../store';

const NAV: [Screen, string, string, string, string?][] = [
  ['home', 'Home', TOMATO, '50%'],
  ['browse', 'Browse', SUN, '3px'],
  ['things', 'Things to Do', LILAC, '50% 0'],
  ['directory', 'Business Directory', LIME, '3px 3px 50% 50%', 'Directory'],
  ['saved', 'Saved', PINK, '50%'],
];

function useNav() {
  const { screen, saved, go, browse } = useStore();
  return NAV.map(([k, label, dot, shape, short]) => ({
    k, label, dot, shape, short: short ?? label,
    on: screen === k,
    count: k === 'saved' && saved.length ? String(saved.length) : '',
    go: () => (k === 'browse' ? browse() : go(k)),
  }));
}

export function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={INK} strokeWidth="2.4" aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx="7.5" cy="7.5" r="5.5" />
      <line x1="11.5" y1="11.5" x2="16.5" y2="16.5" />
    </svg>
  );
}

export function Logo({ onClick }: { onClick: () => void }) {
  return (
    <a href="/" onClick={(e) => { e.preventDefault(); onClick(); }} aria-label="EventoryTT home" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: INK }}>
      <span style={{ fontFamily: 'var(--display)', fontSize: 28, letterSpacing: '.02em', lineHeight: 1 }}>EVENTORY</span>
      <span style={{ fontFamily: 'var(--display)', fontSize: 14, background: TOMATO, color: CREAM, width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `2px solid ${INK}`, transform: 'rotate(-12deg)' }}>TT</span>
    </a>
  );
}

export function Header() {
  const { isMobile, go, browse } = useStore();
  const nav = useNav();
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: CREAM, borderBottom: `2px solid ${INK}` }}>
      <div className="wrap" style={{ paddingTop: 10, paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Logo onClick={() => go('home')} />
        {!isMobile && (
          <nav aria-label="Main" className="top-nav" style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
            {nav.map((n) => (
              <button
                key={n.k}
                type="button"
                className="pill"
                aria-current={n.on ? 'page' : undefined}
                onClick={n.go}
                style={{ background: n.on ? INK : 'transparent', color: n.on ? CREAM : INK, padding: '8px 16px', fontSize: 14, display: 'flex', gap: 8, alignItems: 'center', minHeight: 42 }}
              >
                <span className="nav-long">{n.label}</span>
                <span className="nav-short">{n.short}</span>
                {n.count && <span style={{ background: PINK, color: INK, borderRadius: 999, padding: '0 7px', fontSize: 12, border: `1.5px solid ${INK}` }}>{n.count}</span>}
              </button>
            ))}
          </nav>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="hover-sun"
          onClick={() => browse({}, true)}
          aria-label="Search deals"
          style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${INK}`, background: CREAM, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
        >
          <SearchIcon />
        </button>
        <button
          type="button"
          className="pill btn-shadow btn-press"
          onClick={() => go('submit')}
          style={{ background: TOMATO, color: INK, padding: '0 16px', minHeight: 44, fontWeight: 800, fontSize: 14 }}
        >
          {isMobile ? 'List deal' : <><span className="nav-long">List your deal</span><span className="nav-short">List deal</span></>}
        </button>
      </div>
    </header>
  );
}

export function TabBar() {
  const nav = useNav();
  return (
    <nav aria-label="Main" style={{ position: 'fixed', left: 10, right: 10, bottom: 10, zIndex: 50, background: INK, borderRadius: 24, padding: 6, display: 'grid', gridTemplateColumns: `repeat(${nav.length},1fr)`, gap: 4, boxShadow: '0 10px 30px rgba(20,18,16,.3)' }}>
      {nav.map((n) => (
        <button
          key={n.k}
          type="button"
          onClick={n.go}
          aria-current={n.on ? 'page' : undefined}
          style={{ border: 'none', borderRadius: 18, minHeight: 54, background: n.on ? n.dot : 'transparent', color: n.on ? INK : CREAM, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 700, fontSize: 11, lineHeight: 1.1, textAlign: 'center', padding: '0 2px', cursor: 'pointer', position: 'relative' }}
        >
          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: n.shape, background: n.dot, border: `1.5px solid ${INK}` }} />
          <span>{n.short}</span>
          {n.count && (
            <span aria-label={`${n.count} saved`} style={{ position: 'absolute', top: 6, right: 'calc(50% - 26px)', background: PINK, color: INK, borderRadius: 999, minWidth: 18, height: 18, fontSize: 11, display: 'grid', placeItems: 'center', padding: '0 4px' }}>
              {n.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

export function Footer() {
  const { go, browse } = useStore();
  const cols: { title: string; links: [string, () => void][] }[] = [
    { title: 'Explore', links: [['Today’s deals', () => go('home')], ['Browse all', () => browse()], ['Things to Do', () => go('things')], ['Business Directory', () => go('directory')], ['Saved', () => go('saved')]] },
    { title: 'Businesses', links: [['How it works', () => go('how-it-works')], ['Pricing', () => go('how-it-works')], ['List your deal', () => go('submit')]] },
    { title: 'About', links: [['Privacy', () => go('privacy')], ['Friday Five on WhatsApp', () => window.open(`https://wa.me/18687177720?text=${encodeURIComponent('Hi EventoryTT, add me to the Friday Five.')}`, '_blank', 'noopener,noreferrer')]] },
  ];
  return (
    <footer style={{ background: INK, color: CREAM, marginTop: 56 }}>
      <div className="wrap" style={{ paddingTop: 44, paddingBottom: 36, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,200px),1fr))', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 40, lineHeight: 1 }}>EVENTORY<span style={{ color: TOMATO }}>TT</span></span>
          <span style={{ fontSize: 15, lineHeight: 1.45, opacity: 0.85 }}>The best deals in Trinidad &amp; Tobago, every day.</span>
        </div>
        {cols.map((col) => (
          <div key={col.title} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: SUN, marginBottom: 6 }}>{col.title}</span>
            {col.links.map(([label, fn]) => (
              <button key={label} type="button" className="footer-link" onClick={fn}>{label}</button>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,246,229,.2)' }}>
        <div className="wrap mono" style={{ paddingTop: 16, paddingBottom: 16, fontSize: 11, letterSpacing: '.05em', opacity: 0.8 }}>
          We find the deals. You buy direct from the business, and they set the prices and stock.
        </div>
      </div>
    </footer>
  );
}

export function PassModal() {
  const { pass, closePass } = useStore();
  if (!pass) return null;
  return (
    <div onClick={closePass} role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(20,18,16,.75)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div role="dialog" aria-modal="true" aria-label={`In-store pass for ${pass.biz}`} onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%,400px)', background: CREAM, border: `2px solid ${INK}`, borderRadius: 28, overflow: 'hidden', boxShadow: `8px 8px 0 ${INK}` }}>
        <div style={{ background: pass.color, borderBottom: `2px solid ${INK}`, padding: '18px 22px' }}>
          <span className="eyebrow">Show this at the counter</span>
          <div className="display" style={{ fontSize: 34, lineHeight: 0.95, marginTop: 6 }}>{pass.biz}</div>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 19, lineHeight: 1.25 }}>{pass.title}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 48, lineHeight: 1 }}>{pass.priceLabel}</span>
            {pass.wasLabel && <s style={{ color: 'var(--muted-3)' }}>{pass.wasLabel}</s>}
          </div>
          <div style={{ border: `2px dashed ${INK}`, borderRadius: 14, padding: 14, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 26, letterSpacing: '.12em' }}>{pass.code}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>{[pass.validity, pass.area].filter(Boolean).join(' · ')}</div>
          <button type="button" autoFocus onClick={closePass} className="pill btn-dark" style={{ minHeight: 50, fontSize: 15 }}>Done</button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ bottom }: { bottom: number }) {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" style={{ position: 'fixed', left: '50%', bottom, transform: 'translateX(-50%)', zIndex: 90, background: INK, color: CREAM, borderRadius: 999, padding: '12px 20px', fontWeight: 700, fontSize: 14, maxWidth: 'calc(100% - 32px)', textAlign: 'center', animation: 'ettToast .25s ease-out', border: `2px solid ${SUN}` }}>
      {toast}
    </div>
  );
}
