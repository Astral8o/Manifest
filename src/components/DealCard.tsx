import { useState, type MouseEvent } from 'react';
import { CREAM, PINK, type Deal } from '../data';
import { useStore } from '../store';
import { Starburst } from './Starburst';

export function useDealActions(d: Deal) {
  const { saved, toggleSave, claim, openDeal } = useStore();
  const isSaved = saved.includes(d.id);
  return {
    isSaved,
    heart: isSaved ? '♥' : '♡',
    saveText: isSaved ? 'Saved' : 'Save',
    saveBg: isSaved ? PINK : CREAM,
    open: () => openDeal(d.id),
    toggleSave: (e?: MouseEvent) => { e?.stopPropagation(); toggleSave(d.id); },
    claim: (e?: MouseEvent) => { e?.stopPropagation(); claim(d); },
  };
}

/** The one consistent deal card used across home rows, browse grid, saved and related. */
export function DealCard({ d }: { d: Deal }) {
  const { showDemo } = useStore();
  const a = useDealActions(d);
  const [pop, setPop] = useState(false);

  return (
    <article
      className="deal-card"
      onClick={a.open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) a.open(); }}
      tabIndex={0}
      aria-label={`${d.title} at ${d.biz}, ${d.priceLabel}`}
    >
      <div className="stripes" style={{ position: 'relative', aspectRatio: '4 / 3', backgroundColor: d.color, borderBottom: '2px solid var(--ink)' }}>
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: '70%' }}>
          {d.isNew && <span className="badge-new pulse" style={{ padding: '2px 8px', fontSize: 13 }}>NEW</span>}
          {d.endingSoon && <span className="badge-ends" style={{ padding: '3px 9px', fontSize: 13 }}>{d.endsShort}</span>}
        </div>
        {d.pct > 0 && <Starburst size={62} fontSize={17} style={{ position: 'absolute', top: 6, right: 6 }}>-{d.pct}%</Starburst>}
        <span className="photo-note" style={{ left: 10, bottom: 10, maxWidth: 'calc(100% - 20px)', fontSize: 10, padding: '3px 7px', borderRadius: 6 }}>
          photo · {d.img}
        </span>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div className="label" style={{ fontSize: 11 }}>{d.biz}</div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.22, textWrap: 'pretty' } as React.CSSProperties}>{d.title}</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 6 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 28, lineHeight: 1 }}>{d.priceLabel}</span>
          {d.wasLabel && <s style={{ fontSize: 13, color: 'var(--muted-3)' }}>{d.wasLabel}</s>}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.35 }}>
          <span>{d.area}</span>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{d.endsLabel}</span>
          {showDemo && <span className="demo-tag" style={{ fontSize: 9.5, color: '#7A7067', marginTop: 2 }}>Demo offer · fictional</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button type="button" className="card-action" onClick={a.claim}>{d.action}</button>
          <button
            type="button"
            className={'save-btn' + (pop ? ' pop' : '')}
            aria-label={a.isSaved ? 'Remove from saved' : 'Save deal'}
            aria-pressed={a.isSaved}
            style={{ background: a.saveBg }}
            onClick={(e) => { a.toggleSave(e); setPop(true); }}
            onAnimationEnd={() => setPop(false)}
          >
            {a.heart}
          </button>
        </div>
      </div>
    </article>
  );
}
