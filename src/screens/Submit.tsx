import { useState, type FormEvent } from 'react';
import { track } from '../analytics';

const SUBMIT_URL = 'https://oiwjuvzsydhuhmetcuqk.supabase.co/functions/v1/submit-deal';
import { CATS, CREAM, INK, LIME, PAPER, SUN, TOMATO } from '../data';
import { useStore } from '../store';

type LinkType = 'WhatsApp' | 'Website' | 'Booking' | 'Tickets';
const LINK_LABELS: Record<LinkType, string> = {
  WhatsApp: 'WhatsApp number',
  Website: 'Website or online store URL',
  Booking: 'Booking page URL',
  Tickets: 'Ticketing page URL',
};

interface Field {
  name: string; label: string; ph?: string; type?: string; req?: boolean; wide?: boolean; area?: boolean; opts?: string[];
}

export type Plan = 'free' | 'featured' | 'spotlight';
let nextPlan: Plan = 'free';
/** Lets the How it works page open the form with a plan already picked. */
export const setNextPlan = (p: Plan) => { nextPlan = p; };
const PLAN_OPTS: { k: Plan; label: string; sub: string }[] = [
  { k: 'free', label: 'Free', sub: 'Up to 3 live at a time' },
  { k: 'featured', label: 'Featured', sub: 'TT$300/month · founding TT$150' },
  { k: 'spotlight', label: 'Spotlight boost', sub: 'TT$100 for 7 days' },
];

const STEPS = [
  { n: 1, title: 'Send your offer', sub: 'Takes about 5 minutes.' },
  { n: 2, title: 'We get it ready', sub: 'We set up your deal page within 2 business days.' },
  { n: 3, title: 'It goes live', sub: 'Your deal gets its own page and link to share.' },
];

function FieldInput({ f }: { f: Field }) {
  const id = `f-${f.name}`;
  return (
    <label htmlFor={id} style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: f.wide ? '1 / -1' : 'auto' }}>
      <span style={{ fontSize: 13, fontWeight: 800 }}>
        {f.label}
        {f.req && <span style={{ color: '#C42A1A' }} aria-hidden="true"> *</span>}
      </span>
      {f.area ? (
        <textarea id={id} name={f.name} className="field" placeholder={f.ph} rows={4} required={f.req} />
      ) : f.opts ? (
        <select id={id} name={f.name} className="field" required={f.req}>
          {f.opts.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input id={id} name={f.name} className="field" type={f.type ?? 'text'} placeholder={f.ph} required={f.req} min={f.type === 'number' ? 0 : undefined} />
      )}
    </label>
  );
}

export function Submit() {
  const { go } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [linkType, setLinkType] = useState<LinkType>('WhatsApp');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [ref, setRef] = useState('');
  const [plan, setPlan] = useState<Plan>(() => { const p = nextPlan; nextPlan = 'free'; return p; });

  const groups: { n: number; title: string; fields: Field[]; linkTypes?: boolean; hasImage?: boolean }[] = [
    {
      n: 1, title: 'Your business', fields: [
        { name: 'business', label: 'Business name', ph: 'e.g. Aunty Vee’s Doubles', req: true },
        { name: 'contact', label: 'Contact person', ph: 'Full name', req: true },
        { name: 'email', label: 'Email', ph: 'you@business.tt', type: 'email', req: true },
        { name: 'phone', label: 'WhatsApp / phone', ph: '+1 868 555 0123', type: 'tel' },
      ],
    },
    {
      n: 2, title: 'The offer', fields: [
        { name: 'title', label: 'Promotion title', ph: 'e.g. Doubles breakfast for four', req: true, wide: true },
        { name: 'description', label: 'Description', ph: 'What’s included, sizes, options…', area: true, wide: true },
        { name: 'category', label: 'Category', opts: Object.values(CATS).map((c) => c.label) },
        { name: 'location', label: 'Location / area', ph: 'e.g. Curepe, or Online', req: true },
        { name: 'was', label: 'Original price (TT$)', ph: '64', type: 'number' },
        { name: 'price', label: 'Promo price (TT$)', ph: '48', type: 'number', req: true },
        { name: 'start', label: 'Start date', type: 'date', req: true },
        { name: 'end', label: 'Expiry date', type: 'date', req: true },
      ],
    },
    {
      n: 3, title: 'How customers claim', linkTypes: true, fields: [
        { name: 'link', label: LINK_LABELS[linkType], ph: linkType === 'WhatsApp' ? '+1 868 555 0123' : 'https://', type: linkType === 'WhatsApp' ? 'tel' : 'url', wide: true, req: true },
      ],
    },
    {
      n: 4, title: 'Photo & terms', hasImage: true, fields: [
        { name: 'terms', label: 'Terms & conditions', ph: 'e.g. Dine-in only. Not valid on public holidays.', area: true, wide: true },
      ],
    },
  ];

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const data = new FormData(e.currentTarget);
    const start = String(data.get('start') || ''), end = String(data.get('end') || '');
    const price = Number(data.get('price')), was = Number(data.get('was') || 0);
    if (start && end && end < start) return setError('The expiry date must be on or after the start date.');
    if (was && price > was) return setError('The promo price should be lower than the original price.');
    setError('');
    data.set('linkType', linkType);
    setSending(true);
    try {
      // Saved to Supabase and emailed to the EventoryTT admin inbox (submit-deal edge function).
      const res = await fetch(SUBMIT_URL, { method: 'POST', body: data });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.error || 'Something went wrong.');
      setRef(body.ref);
      track('submit_listing', { plan });
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'Couldn’t send your deal. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section style={{ background: SUN, borderBottom: `2px solid ${INK}` }}>
        <div className="wrap" style={{ paddingTop: 32, paddingBottom: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 28, alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="eyebrow">For businesses · free</span>
            <h1 className="display" style={{ fontSize: 'clamp(50px,9vw,104px)', lineHeight: 0.88 }}>Put your deal in front of T&amp;T.</h1>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.45, maxWidth: 500, fontWeight: 500 }}>
              One form. No account or login. Customers contact you directly through your website, WhatsApp or booking page.
            </p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
              Rather send it on WhatsApp or tag us on Instagram?{' '}
              <button type="button" className="link-btn" style={{ fontSize: 15, padding: 0 }} onClick={() => go('how-it-works')}>See how it works</button>
            </p>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STEPS.map((st) => (
              <li key={st.n} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 12, alignItems: 'center', background: CREAM, border: `2px solid ${INK}`, borderRadius: 16, padding: 12 }}>
                <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: '50%', background: TOMATO, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: 20 }}>{st.n}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{st.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>{st.sub}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 56px' }}>
        {submitted ? (
          <div role="status" style={{ border: `2px solid ${INK}`, borderRadius: 28, background: LIME, boxShadow: `6px 6px 0 ${INK}`, padding: 'clamp(24px,4vw,44px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="eyebrow" style={{ letterSpacing: '.06em' }}>Reference {ref}</span>
            <h2 className="display" style={{ fontSize: 'clamp(44px,7vw,72px)', lineHeight: 0.9 }}>Thanks, we’ve got it.</h2>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, maxWidth: 560 }}>
              We’ll set up your deal within 2 business days and may WhatsApp you to confirm prices or dates. Once approved, your deal goes live with its own shareable link.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              <button type="button" className="pill btn-dark" onClick={() => { setSubmitted(false); setFileName(''); setRef(''); }} style={{ padding: '0 20px', minHeight: 48 }}>Submit another deal</button>
              <button type="button" className="pill" onClick={() => go('home')} style={{ padding: '0 20px', minHeight: 48, fontWeight: 800 }}>Back to home</button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Honeypot for bots: hidden from people and screen readers */}
            <input type="hidden" name="plan" value={plan} />
            <fieldset style={{ border: `2px solid ${INK}`, borderRadius: 24, padding: 22, margin: 0, background: PAPER, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <legend className="display" style={{ fontSize: 26, padding: '0 10px', background: CREAM, border: `2px solid ${INK}`, borderRadius: 999 }}>Your plan</legend>
              <div role="radiogroup" aria-label="Plan" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: 10 }}>
                {PLAN_OPTS.map((o) => (
                  <button key={o.k} type="button" role="radio" aria-checked={plan === o.k} onClick={() => setPlan(o.k)}
                    style={{ textAlign: 'left', border: `2px solid ${INK}`, borderRadius: 16, padding: '12px 14px', cursor: 'pointer', font: 'inherit', color: INK, background: plan === o.k ? SUN : CREAM, boxShadow: plan === o.k ? `3px 3px 0 ${INK}` : 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{plan === o.k ? '● ' : '○ '}{o.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{o.sub}</span>
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                {plan === 'free' ? 'Free. Up to 3 deals live at a time.' : 'No payment now. We’ll send you an invoice once your deal is approved.'}{' '}
                <button type="button" className="link-btn" style={{ fontSize: 13.5, padding: 0 }} onClick={() => go('how-it-works')}>Compare plans</button>
              </span>
            </fieldset>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
            {groups.map((g) => (
              <fieldset key={g.n} style={{ border: `2px solid ${INK}`, borderRadius: 24, padding: 22, margin: 0, background: PAPER, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                <legend className="display" style={{ fontSize: 26, padding: '0 10px', background: CREAM, border: `2px solid ${INK}`, borderRadius: 999 }}>{g.n} · {g.title}</legend>
                {g.linkTypes && (
                  <div role="group" aria-label="Claim link type" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(Object.keys(LINK_LABELS) as LinkType[]).map((k) => {
                      const on = linkType === k;
                      return <button key={k} type="button" className="pill" aria-pressed={on} onClick={() => setLinkType(k)} style={{ background: on ? INK : 'transparent', color: on ? CREAM : INK, padding: '6px 14px', fontSize: 14, minHeight: 42 }}>{k}</button>;
                    })}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 14 }}>
                  {g.fields.map((f) => <FieldInput key={f.name + (f.name === 'link' ? linkType : '')} f={f} />)}
                </div>
                {g.hasImage && (
                  <label style={{ cursor: 'pointer', border: `2px dashed ${INK}`, borderRadius: 18, minHeight: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', padding: 20, backgroundImage: 'repeating-linear-gradient(135deg,rgba(20,18,16,.05) 0 10px,transparent 10px 20px)' }}>
                    <input type="file" name="photo" accept="image/jpeg,image/png" onChange={(e) => { const file = e.target.files?.[0]; if (file) setFileName(file.name); }} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
                    <span className="display" style={{ fontSize: 22, overflowWrap: 'anywhere' }}>{fileName || 'Upload a promo photo'}</span>
                    <span style={{ fontSize: 14, color: 'var(--muted)' }}>JPG or PNG. Bright, landscape photos of the actual product work best.</span>
                  </label>
                )}
              </fieldset>
            ))}
            <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.45 }}>
              <input type="checkbox" required style={{ width: 22, height: 22, marginTop: 2, accentColor: INK, flex: 'none' }} />
              <span>I confirm this offer is real, the prices are accurate, and I’m authorised to promote it. I understand EventoryTT reviews every submission before publishing.</span>
            </label>
            {error && <div role="alert" style={{ border: `2px solid ${INK}`, background: '#FFE1DC', borderRadius: 14, padding: '12px 16px', fontWeight: 700 }}>{error}</div>}
            <button type="submit" disabled={sending} className="pill btn-press display" style={{ minHeight: 60, background: TOMATO, boxShadow: `5px 5px 0 ${INK}`, fontSize: 24, opacity: sending ? 0.6 : 1 }}>{sending ? 'Sending…' : 'Send my deal'}</button>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>We use your details only to review and list your deal. See our <button type="button" className="link-btn" style={{ fontSize: 13, padding: 0 }} onClick={() => go('privacy')}>privacy page</button>.</p>
          </form>
        )}
      </div>
    </>
  );
}
