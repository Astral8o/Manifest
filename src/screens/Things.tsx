import type { CSSProperties } from 'react';
import { ACTIVE_COLLS, CREAM, INK, LILAC, PAPER, inColl } from '../data';
import { useStore } from '../store';

export function Things() {
  const { coll: collKey, setColl, openDeal } = useStore();
  const coll = ACTIVE_COLLS.find((c) => c.k === collKey) ?? ACTIVE_COLLS[0];
  const list = inColl(coll.k);
  const [feature, ...rest] = list;

  return (
    <>
      <section style={{ background: LILAC, borderBottom: `2px solid ${INK}` }}>
        <div className="wrap" style={{ paddingTop: 32, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span className="eyebrow">Fresh every Thursday</span>
          <h1 className="display" style={{ fontSize: 'clamp(64px,13vw,160px)', lineHeight: 0.85 }}>Things<br />to do</h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.45, maxWidth: 560, fontWeight: 500 }}>
            Nights out, date ideas, free days out and family trips across Trinidad &amp; Tobago.
          </p>
          <div role="group" aria-label="Collections" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(46%,180px),1fr))', gap: 10, marginTop: 6 }}>
            {ACTIVE_COLLS.map((c) => {
              const on = c.k === coll.k;
              const n = inColl(c.k).length;
              return (
                <button
                  key={c.k}
                  type="button"
                  className="hover-lift"
                  aria-pressed={on}
                  onClick={() => setColl(c.k)}
                  style={{ textAlign: 'left', border: `2px solid ${INK}`, background: on ? c.color : CREAM, borderRadius: 18, padding: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 84, boxShadow: on ? `4px 4px 0 ${INK}` : 'none', transition: 'transform .12s ease' }}
                >
                  <span className="display" style={{ fontSize: 21, lineHeight: 1 }}>{c.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{n} {n === 1 ? 'idea' : 'ideas'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
          <h2 className="display" style={{ fontSize: 'clamp(40px,7vw,72px)', lineHeight: 0.9 }}>{coll.label}</h2>
          <p style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--muted)', maxWidth: 440 }}>{coll.intro}</p>
        </div>

        {feature && (
          <button
            type="button"
            className="feature-card"
            onClick={() => openDeal(feature.id)}
            style={{ cursor: 'pointer', width: '100%', textAlign: 'left', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', border: `2px solid ${INK}`, borderRadius: 28, overflow: 'hidden', boxShadow: `6px 6px 0 ${INK}`, background: PAPER }}
          >
            <div className="stripes-lg" style={{ minHeight: 300, height: '100%', position: 'relative', backgroundColor: feature.color }}>
              <span className="photo-note" style={{ left: 16, bottom: 16, fontSize: 11, letterSpacing: '.05em', padding: '4px 9px', borderRadius: 7, background: 'rgba(255,246,229,.9)' }}>photo · {feature.img}</span>
            </div>
            <div style={{ padding: 'clamp(20px,3vw,36px)', display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
              <span className="mono" style={{ fontSize: 12, letterSpacing: '.06em' }}>Top pick · {feature.when}</span>
              <h3 className="display" style={{ fontSize: 'clamp(32px,4vw,48px)', lineHeight: 0.95 }}>{feature.title}</h3>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, textWrap: 'pretty' } as CSSProperties}>{feature.blurb}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 34 }}>{feature.priceLabel}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{feature.area}</span>
                <span style={{ marginLeft: 'auto', background: INK, color: CREAM, borderRadius: 999, padding: '12px 18px', fontWeight: 800, fontSize: 14 }}>See details →</span>
              </div>
            </div>
          </button>
        )}

        <ol style={{ listStyle: 'none', margin: '28px 0 0', padding: 0 }}>
          {rest.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                className="row-hover"
                onClick={() => openDeal(t.id)}
                style={{ cursor: 'pointer', width: '100%', textAlign: 'left', display: 'grid', gridTemplateColumns: 'auto 92px minmax(0,1fr)', gap: 16, alignItems: 'center', padding: '18px 4px', border: 'none', borderTop: `2px solid ${INK}`, background: 'transparent' }}
              >
                <span style={{ fontFamily: 'var(--display)', fontSize: 38, lineHeight: 1, minWidth: 46 }}>{String(i + 2).padStart(2, '0')}</span>
                <div className="stripes-sm" style={{ width: 92, height: 92, borderRadius: 16, border: `2px solid ${INK}`, backgroundColor: t.color }} />
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="mono" style={{ fontSize: 11, letterSpacing: '.05em', color: 'var(--muted-2)' }}>{t.when} · {t.area}</span>
                  <span style={{ fontWeight: 800, fontSize: 19, lineHeight: 1.2 }}>{t.title}</span>
                  <span style={{ fontSize: 14.5, lineHeight: 1.45, color: '#3A342E', textWrap: 'pretty' } as CSSProperties}>{t.blurb}</span>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 20, marginTop: 2 }}>{t.priceLabel}</span>
                </div>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
