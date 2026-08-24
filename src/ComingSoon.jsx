const SANS = 'Manrope, sans-serif';
const DISPLAY_BLACK = "'Archivo Black', Archivo, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const INK = '#171717';
const ACCENT = '#E0512B';

export default function ComingSoon() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        padding: 24,
        textAlign: 'center',
        background: '#FAF9F7',
        color: INK,
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: INK,
          color: ACCENT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: DISPLAY_BLACK,
          fontSize: 28,
        }}
      >
        E
      </div>
      <div>
        <div style={{ fontFamily: DISPLAY_BLACK, fontSize: 32, letterSpacing: '-0.02em' }}>Eventory</div>
        <p style={{ margin: '10px 0 0', maxWidth: 380, fontSize: 15, lineHeight: 1.55, color: '#5B5B5B' }}>
          Discovery and sourcing for events. We're putting the finishing touches on things — check back soon.
        </p>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#9A9A9A',
        }}
      >
        Coming soon
      </div>
    </div>
  );
}
