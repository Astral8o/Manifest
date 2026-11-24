import { DealCard } from '../components/DealCard';
import { DEALS, INK, PINK, TOMATO } from '../data';
import { useStore } from '../store';

export function Saved() {
  const { saved, browse } = useStore();
  const deals = DEALS.filter((d) => saved.includes(d.id));
  const soon = deals.filter((d) => d.daysLeft <= 3).length;

  return (
    <>
      <section style={{ background: PINK, borderBottom: `2px solid ${INK}` }}>
        <div className="wrap" style={{ paddingTop: 32, paddingBottom: 28 }}>
          <h1 className="display" style={{ fontSize: 'clamp(64px,12vw,140px)', lineHeight: 0.85 }}>Saved</h1>
          <p style={{ margin: '12px 0 0', fontSize: 17, fontWeight: 500 }}>Your shortlist. Kept on this phone, no sign-up needed.</p>
        </div>
      </section>
      <div className="wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {soon > 0 && (
          <div role="status" style={{ background: INK, color: '#FFF6E5', borderRadius: 16, padding: '14px 18px', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
            {soon} saved {soon === 1 ? 'deal ends' : 'deals end'} within 3 days.
          </div>
        )}
        {deals.length === 0 ? (
          <div style={{ border: `2px dashed ${INK}`, borderRadius: 22, padding: '44px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span className="display" style={{ fontSize: 36 }}>Nothing saved yet</span>
            <span style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 380 }}>Tap ♡ on any deal to keep it here. We’ll flag it when it’s about to end.</span>
            <button type="button" className="pill btn-shadow btn-press" onClick={() => browse()} style={{ background: TOMATO, padding: '0 20px', minHeight: 48, fontWeight: 800 }}>Browse today’s deals</button>
          </div>
        ) : (
          <div className="deal-grid">
            {deals.map((d) => <DealCard key={d.id} d={d} />)}
          </div>
        )}
      </div>
    </>
  );
}
