import { useState } from 'react';
import heroPhoto from './assets/hero-photo.jpg';
import { joinWaitlist } from './catalog';

const SANS = 'Manrope, sans-serif';
const DISPLAY_BLACK = "'Archivo Black', Archivo, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const ACCENT = '#E0512B';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const disabled = !(email && email.indexOf('@') > 0) || sending;

  const submit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    setSending(true);
    setError('');
    try {
      await joinWaitlist(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: SANS,
        color: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      <img
        src={heroPhoto}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'saturate(1.05)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(23,23,23,0.55) 0%, rgba(23,23,23,0.78) 55%, rgba(23,23,23,0.92) 100%)',
        }}
      />

      <div style={{ position: 'relative', width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 999,
            padding: '6px 14px',
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }} />
          Coming soon to Trinidad &amp; Tobago
        </div>

        <div style={{ marginTop: 22, fontFamily: DISPLAY_BLACK, fontSize: 'clamp(34px, 7vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          Eventory
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 17, lineHeight: 1.55, color: 'rgba(255,255,255,0.88)' }}>
          One place to find and book every vendor for your next event — caterers, venues, photographers and more.
          We're putting the finishing touches on it.
        </p>

        {sent ? (
          <div
            style={{
              marginTop: 28,
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(6px)',
              padding: 20,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700 }}>You're on the list</div>
            <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.8)' }}>
              We'll email {email} the moment Eventory launches.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            style={{
              marginTop: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(6px)',
                padding: 6,
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="you@organisation.tt"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 0,
                  outline: 'none',
                  background: 'transparent',
                  color: '#FFFFFF',
                  padding: '10px 14px',
                  fontFamily: SANS,
                  fontSize: 15,
                }}
              />
              <button
                type="submit"
                disabled={disabled}
                style={{
                  border: 0,
                  borderRadius: 999,
                  background: ACCENT,
                  color: '#FFFFFF',
                  padding: '12px 22px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {sending ? 'Joining…' : 'Notify me'}
              </button>
            </div>
            {error && <div style={{ fontSize: 13, color: '#FFD9CC' }}>{error}</div>}
          </form>
        )}

        <div style={{ marginTop: 22, fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>
          No spam — just one email when we're live.
        </div>
      </div>
    </div>
  );
}
