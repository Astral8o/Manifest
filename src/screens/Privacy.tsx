import type { CSSProperties, ReactNode } from 'react';
import { INK, PAPER } from '../data';
import { useStore } from '../store';

const UPDATED = '25 November 2026';
const WHATSAPP = 'https://wa.me/18687177720';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ borderTop: `2px solid ${INK}`, padding: '22px 0 6px' }}>
      <h2 className="display" style={{ fontSize: 'clamp(26px,4vw,34px)', lineHeight: 1, margin: '0 0 12px' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16, lineHeight: 1.6 }}>{children}</div>
    </section>
  );
}

const ul: CSSProperties = { margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 };

export function Privacy() {
  const { go } = useStore();
  return (
    <div className="wrap" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 760 }}>
      <span className="eyebrow">Last updated {UPDATED}</span>
      <h1 className="display" style={{ fontSize: 'clamp(48px,9vw,88px)', lineHeight: 0.9, margin: '8px 0 14px' }}>Privacy</h1>
      <p style={{ fontSize: 18, lineHeight: 1.5, margin: '0 0 22px', fontWeight: 500 }}>
        EventoryTT lists deals and things to do in Trinidad &amp; Tobago. You don’t need an account to use it.
        This page explains what we collect, why, and the choices you have.
      </p>

      <div style={{ background: PAPER, border: `2px solid ${INK}`, borderRadius: 20, padding: '16px 20px', marginBottom: 26 }}>
        <strong>The short version</strong>
        <ul style={{ ...ul, marginTop: 8 }}>
          <li>We use Google Analytics to count visits and see which deals people look at and click.</li>
          <li>Your saved deals stay on your own phone or computer.</li>
          <li>If you send us a deal, we use your details only to review and list it.</li>
          <li>We never sell your personal information.</li>
        </ul>
      </div>

      <Section title="Visiting the site">
        <p style={{ margin: 0 }}>We use Google Analytics to understand how EventoryTT is used. It records things like:</p>
        <ul style={ul}>
          <li>which pages, deals and events are viewed;</li>
          <li>what is clicked, saved, shared or added to a calendar;</li>
          <li>words typed into the search box;</li>
          <li>your general location (country or city), device, browser and the site that sent you here.</li>
        </ul>
        <p style={{ margin: 0 }}>
          Google Analytics uses cookies and similar technology to do this. It doesn’t tell us your name, email or phone number, and we
          don’t try to identify anyone. Google processes this data under its own terms. You can read{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">how Google uses data from sites that use its services</a>.
        </p>
      </Section>

      <Section title="Reports we share with businesses">
        <p style={{ margin: 0 }}>
          We may show businesses on EventoryTT how their listings are doing, for example “your deal was viewed 500 times and got 120 clicks”.
          These reports only ever contain totals. They never include anything that identifies you.
        </p>
      </Section>

      <Section title="Saved deals">
        <p style={{ margin: 0 }}>
          When you tap ♡ to save a deal, the list is kept in your browser’s storage on your own device. It isn’t sent to us.
          Clearing your browser data removes it.
        </p>
      </Section>

      <Section title="Listing a deal">
        <p style={{ margin: 0 }}>
          If you use the <button type="button" className="link-btn" style={{ fontSize: 16, padding: 0 }} onClick={() => go('submit')}>List your deal</button> form,
          we receive the business name, contact name, email, phone number (if given), the deal details and any photo you upload.
          We use these only to review the deal, contact you about it, and publish it. We keep them securely and only for as long as we need them.
          Ask us any time and we’ll delete them.
        </p>
      </Section>

      <Section title="WhatsApp">
        <p style={{ margin: 0 }}>
          If you join the Friday Five or message us on WhatsApp, we see your WhatsApp name and number. We use them only to send what you asked for.
          Reply STOP any time to stop. WhatsApp’s own privacy policy also applies.
        </p>
      </Section>

      <Section title="Links to other sites">
        <p style={{ margin: 0 }}>
          Buttons like “Get Deal” and “Get Tickets” take you to the business or ticket seller. Anything you buy or share there is between you and them,
          and their privacy policy applies, not ours.
        </p>
      </Section>

      <Section title="Your choices">
        <ul style={ul}>
          <li>Block or clear cookies in your browser settings.</li>
          <li>Install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics opt-out add-on</a> to stop Analytics on every site.</li>
          <li>Ask us what we hold about you, or ask us to correct or delete it.</li>
        </ul>
      </Section>

      <Section title="Children">
        <p style={{ margin: 0 }}>EventoryTT is meant for adults. We don’t knowingly collect information from anyone under 18.</p>
      </Section>

      <Section title="Changes and contact">
        <p style={{ margin: 0 }}>
          If we change this page, we’ll update the date at the top. Questions or requests? Message us on{' '}
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp at 1-868-717-7720</a>.
        </p>
      </Section>
    </div>
  );
}
