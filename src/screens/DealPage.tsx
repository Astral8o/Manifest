import type { CSSProperties } from 'react';
import { Scroller } from '../components/Scroller';
import { DealCard, DealImage, dealFacts, useDealActions } from '../components/DealCard';
import { Starburst } from '../components/Starburst';
import { CREAM, DEALS, KINDS, INK, LIME, PAPER, PINK, SUN, TOMATO, dealUrl, googleCalUrl, icsFile, whatsappShareUrl } from '../data';
import { useStore } from '../store';
import { trackDeal } from '../analytics';

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
  // Same business first, then the same kind of deal, then anything in the category.
  const score = (d: typeof deal) => (d.biz === deal.biz ? 2 : 0) + (d.kind && d.kind === deal.kind ? 1 : 0);
  const related = DEALS.filter((d) => d.id !== deal.id && (d.biz === deal.biz || d.cat === deal.cat))
    .sort((x, y) => score(y) - score(x) || y.hot - x.hot).slice(0, 10);
  const shareUrl = whatsappShareUrl(deal);

  const copyLink = async () => {
    trackDeal('share_deal', deal, { method: 'copy_link' });
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: isMobile ? 20 : 36, marginTop: isMobile ? 12 : 18, alignItems: 'start' }}>
          <div
            className={deal.image || deal.eventDate ? undefined : 'stripes-lg'}
            style={isMobile
              ? { position: 'relative', aspectRatio: deal.imageRatio ?? '1 / 1', maxHeight: '72vh', width: 'calc(100% + 40px)', margin: '0 -20px', borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}`, backgroundColor: deal.image ? INK : deal.color, overflow: 'hidden' }
              : { position: 'sticky', top: 84, aspectRatio: deal.imageRatio ?? '1 / 1', maxHeight: 'calc(100vh - 110px)', border: `2px solid ${INK}`, borderRadius: 28, boxShadow: `8px 8px 0 ${INK}`, backgroundColor: deal.image ? INK : deal.color, overflow: 'hidden' }}
          >
            {deal.image && <img src={deal.image} alt={`${deal.title} from ${deal.biz}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />}
            <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {deal.promo && <span className="badge-ends" style={{ padding: '4px 12px', fontSize: 16, letterSpacing: 0, color: 'var(--sun)', textTransform: 'uppercase' }}>{deal.promo}</span>}
              {deal.isNew && <span className="badge-new" style={{ padding: '3px 12px', fontSize: 16, letterSpacing: 0 }}>NEW</span>}
              {deal.endingSoon && <span className="badge-ends" style={{ padding: '4px 12px', fontSize: 16, letterSpacing: 0 }}>{deal.endsShort}</span>}
            </div>
            {deal.pct > 0 && !deal.priceIsPercent && <Starburst size={118} fontSize={30} style={{ position: 'absolute', bottom: 12, right: 12 }}>-{deal.pct}%</Starburst>}
            {!deal.image && deal.eventDate && <div style={{ position: 'absolute', inset: 0 }}><DealImage d={deal} ratio="auto" eager /></div>}
            {!deal.image && !deal.eventDate && <span className="photo-note" style={{ left: 16, bottom: 16, fontSize: 12, letterSpacing: '.05em', padding: '5px 10px', borderRadius: 8, background: 'rgba(255,246,229,.9)' }}>photo · {deal.img}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ background: deal.color, border: `2px solid ${INK}`, borderRadius: 999, padding: '4px 12px', fontWeight: 800, fontSize: 13 }}>{deal.catLabel}</span>
              {!deal.eventDate && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{deal.addedLabel}</span>}
              {showDemo && deal.demo && <span className="demo-tag" style={{ fontSize: 11, border: `1.5px dashed ${INK}`, borderRadius: 999, padding: '3px 10px' }}>Demo offer · fictional</span>}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{deal.biz}</div>
              <h1 className="display" style={{ margin: '6px 0 0', fontSize: 'clamp(34px,5.5vw,60px)', lineHeight: 0.95, textWrap: 'balance' } as CSSProperties}>{deal.title}</h1>
              <p style={{ margin: '10px 0 0', fontSize: 17, lineHeight: 1.45 }}><strong>{deal.eventDate ? 'What’s on:' : 'What you get:'}</strong> {deal.blurb}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {[deal.kind && KINDS[deal.kind], ...dealFacts(deal)].filter(Boolean).map((t) => <span key={t} className="fact" style={{ fontSize: 13, padding: '3px 10px' }}>{t}</span>)}
              </div>
            </div>
            <div style={{ background: PAPER, border: `2px solid ${INK}`, borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: deal.priceIsPercent ? 'clamp(34px, 9vw, 52px)' : 60, lineHeight: 0.9 }}>{deal.priceLabel}</span>
                {deal.wasLabel && <s style={{ fontSize: 18, color: 'var(--muted-3)' }}>{deal.wasLabel}</s>}
                {deal.saveLabel && <span style={{ background: PINK, border: `2px solid ${INK}`, borderRadius: 999, padding: '3px 12px', fontWeight: 800, fontSize: 14 }}>{deal.saveLabel}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, borderTop: `2px solid ${INK}`, paddingTop: 14 }}>
                {deal.validity && (deal.eventDate ? <Meta label="When" value={deal.validity} /> : <Meta label="Valid" value={deal.validity} sub={deal.endsLabel} />)}
                <Meta label="Where" value={deal.area} sub={deal.region === 'Islandwide' ? undefined : deal.region} />
                <Meta label="Get it by" value={dealFacts(deal).slice(-1)[0]} />
              </div>
            </div>
            <button type="button" className="btn-claim" onClick={a.claim}>
              <span className="display" style={{ fontSize: 24, letterSpacing: '.02em' }}>{deal.action} →</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{deal.destLabel}</span>
            </button>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackDeal('share_deal', deal, { method: 'whatsapp' })} style={{ flex: '1 1 180px', minHeight: 48, border: `2px solid ${INK}`, borderRadius: 999, background: LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, textDecoration: 'none', color: INK }}>Share on WhatsApp</a>
              <button type="button" className="pill" aria-pressed={a.isSaved} onClick={a.toggleSave} style={{ flex: '0 1 auto', minHeight: 48, background: a.saveBg, padding: '0 18px', fontWeight: 800, fontSize: 15 }}>{a.heart} {a.saveText}</button>
              <button type="button" className="pill" onClick={copyLink} style={{ flex: '0 1 auto', minHeight: 48, padding: '0 18px', fontWeight: 800, fontSize: 15 }}>Copy link</button>
            </div>
            {deal.eventDate && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>Add to calendar:</span>
                <a className="pill" href={googleCalUrl(deal)} target="_blank" rel="noopener noreferrer" onClick={() => trackDeal('add_to_calendar', deal, { method: 'google' })} style={calBtn}>Google</a>
                <a className="pill" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(icsFile(deal))}`} download={`${deal.id}.ics`} onClick={() => trackDeal('add_to_calendar', deal, { method: 'ics' })} style={calBtn}>Apple / Outlook</a>
              </div>
            )}
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
              {deal.eventDate ? <>Added {deal.checked}. Tickets are sold by the organiser, who sets the price, time and line-up, so check their page before you go.</> : <>Added {deal.checked}. You buy direct from {deal.biz}, and they set the price and stock, so give it a quick check before you pay.</>}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20, marginTop: 48 }}>
          <div style={panel}>
            <h3 className="display" style={h3}>How to get it</h3>
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
            <h3 className="display" style={h3}>The fine print</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {deal.terms.map((t) => (
                <li key={t} style={{ fontSize: 15, lineHeight: 1.45, padding: '7px 0', borderBottom: '1.5px solid rgba(20,18,16,.15)' }}>{t}</li>
              ))}
            </ul>
          </div>
          <div style={{ ...panel, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {deal.region !== 'Islandwide' && <div className="mono" style={{ height: 130, backgroundColor: '#E9DFC9', backgroundImage: 'repeating-linear-gradient(45deg,rgba(20,18,16,.07) 0 8px,transparent 8px 16px)', borderBottom: `2px solid ${INK}`, display: 'grid', placeItems: 'center', fontSize: 11, letterSpacing: '.06em' }}>map · {deal.area}</div>}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3 className="display" style={{ fontSize: 28 }}>{deal.biz}</h3>
              <span style={{ fontSize: 15 }}>{deal.address}</span>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>{deal.hours}</span>
              <button type="button" className="pill" onClick={a.claim} style={{ alignSelf: 'flex-start', marginTop: 8, padding: '0 16px', minHeight: 44 }}>Contact {deal.biz}</button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: 52 }}>
            <h2 className="display" style={{ margin: '0 0 16px', fontSize: 'clamp(28px,5vw,42px)' }}>{related.every((d) => d.biz === deal.biz) ? `More from ${deal.biz}` : 'More like this'}</h2>
            <Scroller className="scroll-x" style={{ gap: 16, padding: '4px 4px 16px', scrollSnapType: 'x mandatory' }}>
              {related.map((d) => (
                <div key={d.id} style={{ flex: '0 0 min(44vw, 220px)', scrollSnapAlign: 'start' }}><DealCard d={d} /></div>
              ))}
            </Scroller>
          </div>
        )}
      </div>

      {isMobile && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, background: CREAM, borderTop: `2px solid ${INK}`, padding: '10px 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 26, lineHeight: 1 }}>{deal.priceLabel}</span>
            {deal.endsLabel && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{deal.endsLabel}</span>}
          </div>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackDeal('share_deal', deal, { method: 'whatsapp' })} aria-label="Share on WhatsApp" style={{ marginLeft: 'auto', width: 48, height: 48, borderRadius: '50%', border: `2px solid ${INK}`, background: LIME, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, textDecoration: 'none', color: INK }}>Share</a>
          <button type="button" className="pill" onClick={a.claim} style={{ minHeight: 52, background: TOMATO, padding: '0 20px', fontWeight: 800, fontSize: 15 }}>{deal.action}</button>
        </div>
      )}
    </>
  );
}

const calBtn: CSSProperties = { minHeight: 40, padding: '0 14px', display: 'inline-flex', alignItems: 'center', fontWeight: 700, fontSize: 14, textDecoration: 'none', color: 'var(--ink)' };
