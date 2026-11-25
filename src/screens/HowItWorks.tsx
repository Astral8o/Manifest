import { useState, type CSSProperties, type ReactNode } from 'react';
import { CREAM, INK, LILAC, LIME, PAPER, SUN, TOMATO } from '../data';
import { useStore } from '../store';
import { setNextPlan, type Plan } from './Submit';
import { track } from '../analytics';

/** Public handles and numbers businesses can reach us on. */
export const IG_HANDLE = '@eventory_tt';
export const IG_URL = 'https://www.instagram.com/eventory_tt/';
const WHATSAPP = `https://wa.me/18687177720?text=${encodeURIComponent('Hi EventoryTT, I’d like to list a deal.')}`;

const WAYS = [
  { n: 1, color: SUN, title: 'Fill in the form', body: 'Two minutes. Add the price, dates, a photo and where people get it.', cta: 'Open the form' },
  { n: 2, color: LIME, title: 'Send it on WhatsApp', body: 'Message 1-868-717-7720 with your flyer or details and we’ll do the rest.', cta: 'Message us' },
  { n: 3, color: LILAC, title: `Tag ${IG_HANDLE}`, body: 'Tag us in your Instagram or Facebook post and we’ll take the deal straight from it.' },
];

const NEXT = [
  ['We check it', 'A real price or discount, clear dates, and somewhere in Trinidad & Tobago.'],
  ['It goes live', 'Your deal gets its own page, shows up in Browse and search, and events land on the calendar.'],
  ['People come to you', 'The button sends them to your website, WhatsApp, booking page or store. You keep 100% of the sale.'],
  ['It comes down by itself', 'When your deal ends, it drops off the site. No outdated offers.'],
];

const PLANS: { k: Plan; name: string; price: string; per: string; note?: string; color: string; pitch: string; items: string[]; cta: string; best?: boolean }[] = [
  {
    k: 'free', name: 'Free', price: 'TT$0', per: 'always', color: PAPER,
    pitch: 'For every business in T&T, big or small.',
    items: ['Up to 3 deals or events live at a time', 'Your own deal page with photo and button', 'Browse, search, Business Directory and events calendar', 'Live within 2 business days', 'Standout deals may be picked for our socials and the Friday Five'],
    cta: 'List free',
  },
  {
    k: 'featured', name: 'Featured', price: 'TT$300', per: 'month', note: 'Founding offer: TT$150/month for your first 3 months. First 20 businesses.', color: SUN, best: true,
    pitch: 'For businesses with new deals every week.',
    items: ['Unlimited deals and events', 'Top of the home page, rotated weekly', '“Featured” badge on your deals', 'In the Friday Five on WhatsApp every week', '4 posts or reels a month on our Instagram, Facebook and Threads', 'Weekly report: views, clicks, saves and shares', 'Same-day review'],
    cta: 'Get Featured',
  },
  {
    k: 'spotlight', name: 'Spotlight boost', price: 'TT$100', per: 'week', color: LILAC,
    pitch: 'One deal or event, pushed hard for 7 days. Great for parties and launches.',
    items: ['7 days at the top of the home page', '“Featured” badge', 'In that week’s Friday Five', 'A report when it ends'],
    cta: 'Boost a deal',
  },
];

const LISTED = ['Sales and discounts', 'Special offers and bundles', 'Events, parties and fetes', 'Tours and days out', 'Launches and grand openings with an offer', 'Free events and activities'];
const NOT_LISTED = ['Posts with no price, discount or date', 'Classifieds and second-hand items', 'Anything outside Trinidad & Tobago', 'Adult content, weapons or anything illegal'];

const FAQ: [string, ReactNode][] = [
  ['Is the free plan really free?', 'Yes. No card, no trial, no catch. Any business in Trinidad & Tobago can keep up to 3 deals or events live at a time, for free, for as long as they like.'],
  ['Do I need Instagram at all?', 'No. Use the form or WhatsApp. Tagging us is just one more option if you already post your deals.'],
  [`How does tagging ${IG_HANDLE} work?`, `Tag ${IG_HANDLE} in your Instagram or Facebook post. The post needs to be public and show the price or discount. We check our tags regularly, write up the listing, and message you if anything is missing, like an end date.`],
  ['How fast does my deal go live?', 'Free listings go live within 2 business days. Featured members are reviewed the same day.'],
  ['Can I change or remove a deal?', 'Yes. Message us on WhatsApp and we’ll update or take it down, usually the same day.'],
  ['How do I pay for Featured or Spotlight?', 'There’s no online checkout. Pick the plan on the form or message us, and we’ll send you an invoice with payment details. Your Featured spot starts once it’s paid.'],
  ['Is there a contract?', 'No. Featured is month to month. Stop any time and your plan runs to the end of the month you paid for.'],
  ['What’s in the reports?', 'How many people viewed your deals, clicked through to you, saved them and shared them. Reports show totals only, never anyone’s personal details.'],
  ['Do you sell anything or take a cut?', 'No. We don’t sell tickets or products and take no commission. Customers buy straight from you.'],
  ['Why would you turn a deal down?', 'If it has no clear price or discount, no dates, is outside T&T, or breaks the rules above. We’ll tell you why and what to change.'],
];

const h2: CSSProperties = { fontSize: 'clamp(36px,6vw,60px)', lineHeight: 0.92 };

export function HowItWorks() {
  const { go } = useStore();
  const [open, setOpen] = useState<number | null>(0);
  const choose = (p: Plan) => { track('choose_plan', { plan: p }); setNextPlan(p); go('submit'); };

  return (
    <>
      <section style={{ background: TOMATO, borderBottom: `2px solid ${INK}` }}>
        <div className="wrap" style={{ paddingTop: 36, paddingBottom: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="eyebrow">For businesses</span>
          <h1 className="display" style={{ fontSize: 'clamp(54px,10vw,124px)', lineHeight: 0.86, maxWidth: 900 }}>Your deal, in front of all of T&amp;T.</h1>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.45, maxWidth: 620, fontWeight: 600 }}>
            Put your sale, special or event where people in Trinidad &amp; Tobago look for things to buy and do. Free to list.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
            <button type="button" className="pill btn-dark btn-press" onClick={() => choose('free')} style={{ minHeight: 54, padding: '0 24px', fontSize: 16 }}>List your deal free →</button>
            <button type="button" className="pill" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })} style={{ minHeight: 54, padding: '0 22px', fontSize: 16, fontWeight: 800, background: CREAM }}>See plans</button>
          </div>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 44, paddingBottom: 56, display: 'flex', flexDirection: 'column', gap: 56 }}>
        <section>
          <h2 className="display" style={h2}>Three ways to send it</h2>
          <p style={{ margin: '8px 0 20px', fontSize: 17, color: 'var(--muted)' }}>Use whichever is easiest. They all end up in the same place.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 14 }}>
            {WAYS.map((w) => (
              <div key={w.n} style={{ background: w.color, border: `2px solid ${INK}`, borderRadius: 24, padding: 20, boxShadow: `5px 5px 0 ${INK}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="display" style={{ fontSize: 44, lineHeight: 1 }}>{w.n}</span>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{w.title}</h3>
                <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.45, flex: 1 }}>{w.body}</p>
                {w.n === 1 && <button type="button" className="pill btn-dark" onClick={() => choose('free')} style={{ alignSelf: 'flex-start', minHeight: 44, padding: '0 16px' }}>{w.cta} →</button>}
                {w.n === 2 && <a className="pill btn-dark" href={WHATSAPP} target="_blank" rel="noopener noreferrer" onClick={() => track('contact_whatsapp', { from: 'how_it_works' })} style={{ alignSelf: 'flex-start', minHeight: 44, padding: '0 16px', display: 'inline-flex', alignItems: 'center', color: CREAM, textDecoration: 'none' }}>{w.cta} →</a>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="display" style={h2}>What happens next</h2>
          <ol style={{ listStyle: 'none', margin: '20px 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 14 }}>
            {NEXT.map(([t, b], i) => (
              <li key={t} style={{ borderTop: `3px solid ${INK}`, paddingTop: 12 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--muted-2)' }}>STEP {i + 1}</span>
                <h3 style={{ margin: '4px 0 6px', fontSize: 20, fontWeight: 800 }}>{t}</h3>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>{b}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="plans" style={{ scrollMarginTop: 90 }}>
          <h2 className="display" style={h2}>Pick your plan</h2>
          <p style={{ margin: '8px 0 20px', fontSize: 17, color: 'var(--muted)' }}>Start free. Upgrade when you want more people to see it.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,290px),1fr))', gap: 16, alignItems: 'stretch' }}>
            {PLANS.map((p) => (
              <div key={p.k} style={{ position: 'relative', background: p.color, border: `2px solid ${INK}`, borderRadius: 26, padding: 22, boxShadow: p.best ? `7px 7px 0 ${INK}` : `4px 4px 0 ${INK}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {p.best && <span style={{ position: 'absolute', top: -14, right: 18, background: INK, color: CREAM, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>Most popular</span>}
                <h3 className="display" style={{ fontSize: 30, lineHeight: 1, margin: 0 }}>{p.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="display" style={{ fontSize: 52, lineHeight: 0.9 }}>{p.price}</span>
                  <span style={{ fontWeight: 700 }}>/ {p.per}</span>
                </div>
                {p.note && <span style={{ background: CREAM, border: `2px solid ${INK}`, borderRadius: 12, padding: '6px 10px', fontSize: 13.5, fontWeight: 700 }}>{p.note}</span>}
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{p.pitch}</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {p.items.map((it) => (
                    <li key={it} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 8, fontSize: 15, lineHeight: 1.4 }}>
                      <span aria-hidden="true" style={{ fontWeight: 900 }}>✓</span><span>{it}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" className={p.best ? 'pill btn-dark btn-press' : 'pill btn-press'} onClick={() => choose(p.k)} style={{ minHeight: 52, fontSize: 16, fontWeight: 800, background: p.best ? INK : CREAM }}>{p.cta} →</button>
              </div>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>Prices in TT dollars. No contracts. No commission on your sales.</p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 16 }}>
          <div style={{ border: `2px solid ${INK}`, borderRadius: 24, padding: 22, background: PAPER }}>
            <h2 className="display" style={{ fontSize: 32, margin: '0 0 12px' }}>What we list</h2>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15.5 }}>{LISTED.map((x) => <li key={x}>{x}</li>)}</ul>
            <p style={{ margin: '14px 0 0', fontSize: 14.5, lineHeight: 1.5 }}><strong>Every listing needs:</strong> a price or discount, at least one photo, start and end dates (or the event date), and where to get it.</p>
          </div>
          <div style={{ border: `2px solid ${INK}`, borderRadius: 24, padding: 22, background: PAPER }}>
            <h2 className="display" style={{ fontSize: 32, margin: '0 0 12px' }}>What we don’t</h2>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15.5 }}>{NOT_LISTED.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </section>

        <section>
          <h2 className="display" style={h2}>Questions</h2>
          <div style={{ marginTop: 18, borderTop: `2px solid ${INK}` }}>
            {FAQ.map(([q, a], i) => {
              const on = open === i;
              return (
                <div key={i} style={{ borderBottom: `2px solid ${INK}` }}>
                  <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : i)}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '18px 2px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', font: 'inherit', color: INK }}>
                    <span style={{ flex: 1, fontWeight: 800, fontSize: 18 }}>{q}</span>
                    <span aria-hidden="true" style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', fontSize: 20, background: on ? SUN : CREAM }}>{on ? '−' : '+'}</span>
                  </button>
                  {on && <p style={{ margin: '0 0 18px', fontSize: 16, lineHeight: 1.55, maxWidth: 720 }}>{a}</p>}
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ background: INK, color: CREAM, borderRadius: 28, padding: 'clamp(24px,4vw,40px)', display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="display" style={{ fontSize: 'clamp(34px,5vw,52px)', lineHeight: 0.95, color: CREAM }}>Got a deal? Send it in.</h2>
            <p style={{ margin: '8px 0 0', fontSize: 16, opacity: 0.85 }}>Free to list. Customers come straight to you.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="pill btn-press" onClick={() => choose('free')} style={{ minHeight: 52, padding: '0 22px', fontSize: 16, fontWeight: 800, background: SUN }}>List your deal →</button>
            <a className="pill" href={WHATSAPP} target="_blank" rel="noopener noreferrer" onClick={() => track('contact_whatsapp', { from: 'how_it_works' })} style={{ minHeight: 52, padding: '0 22px', fontSize: 16, fontWeight: 800, background: LIME, color: INK, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>WhatsApp us</a>
          </div>
        </section>
      </div>
    </>
  );
}
