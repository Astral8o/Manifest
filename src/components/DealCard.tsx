import { useState, type MouseEvent } from 'react';
import { CREAM, KINDS, PINK, SIZES, type Deal } from '../data';
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

/** Big product photo, or a striped placeholder with a note when there's no photo yet. */
export function DealImage({ d, ratio = '1 / 1', eager = false, rounded = 0 }: { d: Deal; ratio?: string; eager?: boolean; rounded?: number }) {
  return (
    <div className={d.image ? 'deal-media' : 'deal-media stripes'} style={{ aspectRatio: ratio, backgroundColor: d.image ? 'var(--ink)' : d.color, borderRadius: rounded }}>
      {d.image ? (
        <>
          {/* Blurred copy fills the space around wide or tall photos, so nothing is cropped. */}
          <img className="deal-media-fill" src={d.image} alt="" aria-hidden="true" loading={eager ? 'eager' : 'lazy'} decoding="async" />
          <img src={d.image} alt={d.title} loading={eager ? 'eager' : 'lazy'} decoding="async" />
        </>
      ) : (
        <span className="photo-note" style={{ left: 10, bottom: 10, maxWidth: 'calc(100% - 20px)', fontSize: 10, padding: '3px 7px', borderRadius: 6 }}>photo · {d.img}</span>
      )}
    </div>
  );
}

export function SaveButton({ d, size = 40 }: { d: Deal; size?: number }) {
  const a = useDealActions(d);
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      className={'save-btn' + (pop ? ' pop' : '')}
      aria-label={a.isSaved ? `Remove ${d.title} from saved` : `Save ${d.title}`}
      aria-pressed={a.isSaved}
      style={{ background: a.saveBg, width: size, height: size, flex: `0 0 ${size}px` }}
      onClick={(e) => { a.toggleSave(e); setPop(true); }}
      onAnimationEnd={() => setPop(false)}
    >
      {a.heart}
    </button>
  );
}

/** Short facts shown under the title: who it feeds and how you get it. */
export function dealFacts(d: Deal): string[] {
  return [
    d.size && SIZES[d.size],
    d.getIt ?? (d.format === 'Online' ? 'Delivery only' : d.format === 'Online & in-store' ? 'Delivery or pickup' : 'In store'),
  ].filter(Boolean) as string[];
}

/**
 * The one deal card used everywhere: photo first, then the price, then what it is.
 * The whole card opens the deal; the heart saves it.
 */
export function DealCard({ d, eager = false }: { d: Deal; eager?: boolean }) {
  const { showDemo } = useStore();
  const a = useDealActions(d);

  return (
    <article
      className="deal-card"
      onClick={a.open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) a.open(); }}
      tabIndex={0}
      aria-label={`${d.title}, ${d.priceLabel}, ${d.biz}`}
    >
      <div style={{ position: 'relative' }}>
        <DealImage d={d} eager={eager} />
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5, flexWrap: 'wrap', maxWidth: 'calc(100% - 60px)' }}>
          {d.promo && <span className="badge-ends" style={{ padding: '2px 8px', fontSize: 12, background: 'var(--ink)', color: 'var(--sun)', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{d.promo}</span>}
          {d.isNew && <span className="badge-new pulse" style={{ padding: '1px 8px', fontSize: 12 }}>NEW</span>}
          {d.endingSoon && <span className="badge-ends" style={{ padding: '2px 8px', fontSize: 12 }}>{d.endsShort}</span>}
        </div>
        <div style={{ position: 'absolute', top: 8, right: 8 }}><SaveButton d={d} size={38} /></div>
        {d.pct > 0 && !d.priceIsPercent && <Starburst size={58} fontSize={16} style={{ position: 'absolute', bottom: 6, right: 6 }}>-{d.pct}%</Starburst>}
      </div>
      <div className="deal-body">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span className="deal-price" style={d.priceIsPercent ? { fontSize: 22 } : undefined}>{d.priceLabel}</span>
          {d.wasLabel && <s style={{ fontSize: 13, color: 'var(--muted-3)' }}>{d.wasLabel}</s>}
        </div>
        <h3 className="deal-title">{d.title}</h3>
        <div className="deal-meta">{d.biz}{d.kind ? ` · ${KINDS[d.kind]}` : ''}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 6 }}>
          {dealFacts(d).map((f) => <span key={f} className="fact">{f}</span>)}
          {d.endsLabel && !d.endingSoon && <span className="fact">{d.endsLabel}</span>}
        </div>
        {showDemo && d.demo && <span className="demo-tag" style={{ fontSize: 9.5, color: '#7A7067', marginTop: 4 }}>Demo offer · fictional</span>}
      </div>
    </article>
  );
}

/**
 * Wide spotlight card for the top of the home page: large photo with the key facts
 * and a direct claim button beside it.
 */
export function FeatureCard({ d, label }: { d: Deal; label: string }) {
  const a = useDealActions(d);
  return (
    <article className="feature-deal" onClick={a.open} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) a.open(); }} aria-label={`${label}: ${d.title}, ${d.priceLabel}`}>
      <div style={{ position: 'relative' }}>
        <DealImage d={d} eager />
        <span className="feature-label">{label}</span>
        <div style={{ position: 'absolute', top: 10, right: 10 }}><SaveButton d={d} /></div>
      </div>
      <div className="feature-body">
        <div className="deal-meta" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>{d.biz}</div>
        <h3 className="display" style={{ fontSize: 'clamp(24px,3vw,34px)', lineHeight: 0.95 }}>{d.title}</h3>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{d.promo && <span className="fact" style={{ background: 'var(--ink)', color: 'var(--sun)', borderColor: 'var(--ink)' }}>{d.promo}</span>}{dealFacts(d).map((f) => <span key={f} className="fact">{f}</span>)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 4, flexWrap: 'wrap' }}>
          <span className="deal-price" style={{ fontSize: d.priceIsPercent ? 30 : 40 }}>{d.priceLabel}</span>
          {d.wasLabel && <s style={{ fontSize: 15, color: 'var(--muted-3)' }}>{d.wasLabel}</s>}
          <button type="button" className="pill btn-dark" onClick={a.claim} style={{ marginLeft: 'auto', minHeight: 46, padding: '0 18px', fontSize: 14 }}>{d.action} →</button>
        </div>
      </div>
    </article>
  );
}
