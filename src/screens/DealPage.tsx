import type { CSSProperties } from 'react';
import { DealCard, useDealActions } from '../components/DealCard';
import { Starburst } from '../components/Starburst';
import { CREAM, DEALS, INK, LIME, PAPER, PINK, SUN, TOMATO, dealUrl, whatsappShareUrl } from '../data';
import { useStore } from '../store';

const panel: CSSProperties = { border: `2px solid ${INK}`, borderRadius: 22, padding: 22, background: PAPER };
const h3: CSSProperties = { margin: '0 0 14px', fontSize: 28 };

function Meta({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div style={{ fontWeight: 700, fontSize: 15, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  );
}

export function DealPage() {
  const { dealId, goBack, isMobile, showDemo, showToast } = useStore();
  const deal = DEALS.find((d) => d.id === dealId) ?? DEALS[0];
  const a = useDealActions(deal);
  const related = DEALS.filter((d) => d.id !== deal.id && (d.cat === deal.cat || d.region === deal.region)).sort((x, y) => y.hot - x.hot).slice(0, 8);
  const shareUrl = whatsappShareUrl(deal);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(dealUrl(deal.id));
      showToast('Link copied');
    } catch {
      showToast('Couldn’t copy. Long-press the address bar instead.');
    }
  };

  return (
    <>
      <div className="wrap" style={{ paddingTop: 16, paddingBottom: 48 }}>
        <button type="button" className="pill" onClick={goBack} style={{ padding: '0 16px', minHeight: 44, fontSize: 14 }}>← Back</button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 36, marginTop: 18, alignItems: 'start' }}>
          <div className={deal.image ? undefined : 'stripes-lg'} style={{ position: 'relative', aspectRatio: '1 / 1', border: `2px solid ${INK}`, borderRadius: 28, boxShadow: `8px 8px 0 ${INK}`, backgroundColor: deal.image ? INK : deal.color, overflow: 'hidden' }}>
            {deal.image && <img src={deal.image} alt={`${deal.title} from ${deal.biz}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />}
            <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {deal.isNew && <span className="badge-new" style={{ padding: '3px 12px', fontSize: 16, letterSpacing: 0 }}>NEW</span>}
              {deal.endingSoon && <span className="badge-ends" style={{ padding: '4px 12px', fontSize: 16, letterSpacing: 0 }}>{deal.endsShort}</span>}
            </div>
            {deal.pct > 0 && <Starburst size={118} fontSize={30} style={{ position: 'absolute', top: 12, right: 12 }}>-{deal.pct}%</Starburst>}
            {!deal.image && <span className="photo-note" style={{ left: 16, bottom: 16, fontSize: 12, letterSpacing: '.05em', padding: '5px 10px', borderRadius: 8, background: 'rgba(255,246,229,.9)' }}>photo · {deal.img}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ background: deal.color, border: `2px solid ${INK}`, borderRadius: 999, padding: '4px 12px', fontWeight: 800, fontSize: 13 }}>{deal.catLabel}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{deal.addedLabel}</span>
              {showDemo && deal.demo && <span className="demo-tag" style={{ fontSize: 11, border: `1.5px dashed ${INK}`, borderRadius: 999, padding: '3px 10px' }}>Demo offer · fictional</span>}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{deal.biz}</div>
              <h1 className="display" style={{ margin: '6px 0 0', fontSize: 'clamp(38px,5.5vw,64px)', lineHeight: 0.95, textWrap: 'balance' } as CSSProperties}>{deal.title}</h1>
            </div>
            <div style={{ background: PAPER, border: `2px solid ${INK}`, borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 60, lineHeight: 0.9 }}>{deal.priceLabel}</span>
                {deal.wasLabel && <s style={{ fontSize: 18, color: 'var(--muted-3)' }}>{deal.wasLabel}</s>}
                {deal.saveLabel && <span style={{ background: PINK, border: `2px solid ${INK}`, borderRadius: 999, padding: '3px 12px', fontWeight: 800, fontSize: 14 }}>{deal.saveLabel}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, borderTop: `2px solid ${INK}`, paddingTop: 14 }}>
                <Meta label="Valid" value={deal.validity} sub={deal.endsLabel} />
                <Meta label="Where" value={deal.area} sub={deal.region} />
                <Meta label="Format" value={deal.format} />
              </div>
            </div>
            <button type="button" className="btn-claim" onClick={a.claim}>
              <span className="display" style={{ fontSize: 24, letterSpacing: '.02em' }}>{deal.action} →</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{deal.destLabel}</span>
            </button>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" style={{ flex: '1 1 180px', minHeight: 48, border: `2px solid ${INK}`, borderRadius: 999, background: LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, textDecoration: 'none', color: INK }}>Share on WhatsApp</a>
              <button type="button" className="pill" aria-pressed={a.isSaved} onClick={a.toggleSave} style={{ flex: '0 1 auto', minHeight: 48, background: a.saveBg, padding: '0 18px', fontWeight: 800, fontSize: 15 }}>{a.heart} {a.saveText}</button>
              <button type="button" className="pill" onClick={copyLink} style={{ flex: '0 1 auto', minHeight: 48, padding: '0 18px', fontWeight: 800, fontSize: 15 }}>Copy link</button>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
              Checked by the EventoryTT team on {deal.checked}. EventoryTT doesn’t sell or take payment. Prices and availability are set by {deal.biz}.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20, marginTop: 48 }}>
          <div style={panel}>
            <h3 className="display" style={h3}>How to claim</h3>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {deal.claimSteps.map((t, i) => (
                <li key={i} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr)', gap: 12, alignItems: 'start', padding: '8px 0' }}>
                  <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: '50%', background: SUN, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: 16 }}>{i + 1}</span>
                  <span style={{ fontSize: 15, lineHeight: 1.45, paddingTop: 5 }}>{t}</span>
                </li>
              ))}
            </ol>
          </div>
          <div style={panel}>
            <h3 className="display" style={h3}>Terms</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {deal.terms.map((t) => (
                <li key={t} style={{ fontSize: 15, lineHeight: 1.45, padding: '7px 0', borderBottom: '1.5px solid rgba(20,18,16,.15)' }}>{t}</li>
              ))}
            </ul>
          </div>
          <div style={{ ...panel, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="mono" style={{ height: 130, backgroundColor: '#E9DFC9', backgroundImage: 'repeating-linear-gradient(45deg,rgba(20,18,16,.07) 0 8px,transparent 8px 16px)', borderBottom: `2px solid ${INK}`, display: 'grid', placeItems: 'center', fontSize: 11, letterSpacing: '.06em' }}>map · {deal.area}</div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3 className="display" style={{ fontSize: 28 }}>{deal.biz}</h3>
              <span style={{ fontSize: 15 }}>{deal.address}</span>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>{deal.hours}</span>
              <button type="button" className="pill" onClick={a.claim} style={{ alignSelf: 'flex-start', marginTop: 8, padding: '0 16px', minHeight: 44 }}>Contact business</button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: 52 }}>
            <h2 className="display" style={{ margin: '0 0 16px', fontSize: 'clamp(32px,5vw,46px)' }}>More like this</h2>
            <div className="scroll-x" style={{ gap: 16, padding: '4px 4px 16px', scrollSnapType: 'x mandatory' }}>
              {related.map((d) => (
                <div key={d.id} style={{ flex: '0 0 252px', scrollSnapAlign: 'start' }}><DealCard d={d} /></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isMobile && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, background: CREAM, borderTop: `2px solid ${INK}`, padding: '10px 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 26, lineHeight: 1 }}>{deal.priceLabel}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{deal.endsLabel}</span>
          </div>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" style={{ marginLeft: 'auto', width: 48, height: 48, borderRadius: '50%', border: `2px solid ${INK}`, background: LIME, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, textDecoration: 'none', color: INK }}>Share</a>
          <button type="button" className="pill" onClick={a.claim} style={{ minHeight: 52, background: TOMATO, padding: '0 20px', fontWeight: 800, fontSize: 15 }}>{deal.action}</button>
        </div>
      )}
    </>
  );
}
