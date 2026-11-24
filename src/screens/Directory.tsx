import { BUSINESSES, CATS, CREAM, DEALS, INK, LIME, PAPER } from '../data';
import { useStore } from '../store';

export function Directory() {
  const { browse, go } = useStore();
  const list = [...BUSINESSES].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <section style={{ background: LIME, borderBottom: `2px solid ${INK}` }}>
        <div className="wrap" style={{ paddingTop: 32, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="eyebrow">{list.length} {list.length === 1 ? 'business' : 'businesses'} · A–Z</span>
          <h1 className="display" style={{ fontSize: 'clamp(56px,11vw,132px)', lineHeight: 0.85 }}>Business<br />Directory</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.45, maxWidth: 560, fontWeight: 500 }}>
            Every store with deals on right now. Tap one to see everything they’ve got.
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: 18 }}>
          {list.map((b) => {
            const n = DEALS.filter((d) => d.biz === b.name).length;
            const cat = CATS[b.cat];
            return (
              <article key={b.name} style={{ border: `2px solid ${INK}`, borderRadius: 22, background: PAPER, boxShadow: `4px 4px 0 ${INK}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div className={b.logo ? undefined : 'stripes-sm'} style={{ width: 72, height: 72, flex: 'none', borderRadius: 16, border: `2px solid ${INK}`, overflow: 'hidden', backgroundColor: b.logo ? INK : cat.color }}>
                    {b.logo && <img src={b.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h2 className="display" style={{ fontSize: 32, lineHeight: 0.95 }}>{b.name}</h2>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      <span style={{ background: cat.color, border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 10px', fontWeight: 800, fontSize: 12 }}>{cat.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', alignSelf: 'center' }}>{b.area}</span>
                    </div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>{b.about}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                  <button type="button" className="pill btn-dark" onClick={() => browse({ biz: b.name })} style={{ flex: '1 1 auto', minHeight: 46, padding: '0 16px', fontSize: 14 }}>
                    See {n} {n === 1 ? 'deal' : 'deals'} →
                  </button>
                  <a href={b.website} target="_blank" rel="noopener noreferrer" className="pill" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 46, padding: '0 16px', fontSize: 14, textDecoration: 'none', color: INK, background: CREAM }}>
                    {b.websiteLabel} ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <div style={{ marginTop: 32, border: `2px dashed ${INK}`, borderRadius: 22, padding: '28px 22px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px' }}>
            <div className="display" style={{ fontSize: 28 }}>Run a business in T&amp;T?</div>
            <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: 4 }}>List your deal and your business shows up here. Free, no account needed.</div>
          </div>
          <button type="button" className="pill btn-shadow btn-press" onClick={() => go('submit')} style={{ background: 'var(--tomato)', minHeight: 48, padding: '0 20px', fontWeight: 800 }}>Submit a deal</button>
        </div>
      </div>
    </>
  );
}
