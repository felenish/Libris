// Shared sketchy primitives for Libris wireframes.
// All components read tweak values from props; no global state.

const SAMPLE_BOOKS = [
  { t: 'The Long Ascent',          a: 'A. Maren',          p: 0.62, status: 'reading',  finished: false },
  { t: 'Hollow Country',           a: 'J. Okafor',         p: 0.18, status: 'reading',  finished: false },
  { t: 'Cartographers of Smoke',   a: 'L. Westergaard',    p: 0,    status: 'new',      finished: false },
  { t: 'Tide & Coda',              a: 'M. Reyes',          p: 1.0,  status: 'finished', finished: true  },
  { t: 'A Map of Quiet Streets',   a: 'S. Imani',          p: 0.34, status: 'reading',  finished: false },
  { t: 'Sediment',                 a: 'R. Halloran',       p: 0,    status: 'new',      finished: false },
  { t: 'The Iron Library',         a: 'P. Strand',         p: 0.81, status: 'reading',  finished: false },
  { t: 'Brackish',                 a: 'N. Vance',          p: 0,    status: 'new',      finished: false },
  { t: 'Northing',                 a: 'K. Lindgren',       p: 1.0,  status: 'finished', finished: true  },
  { t: 'Field Notes from Vega',    a: 'A. Maren',          p: 0,    status: 'new',      finished: false },
  { t: 'Wax & Lantern',            a: 'C. Beaumont',       p: 0.45, status: 'reading',  finished: false },
  { t: 'A Slow Catalogue',         a: 'D. Itoh',           p: 0,    status: 'new',      finished: false },
];

// Sketchy cover. `variant` = card style:
//   'poster'       — cover only (no chrome below)
//   'titled'       — cover + tiny title/author beneath
//   'badge'        — cover w/ status badge in corner
//   'hover'        — cover w/ persistent ghost actions to suggest hover state
function SkCover({ book, w, h, variant, dark, showProgress, label }) {
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.55)' : 'rgba(26,26,31,0.55)';
  const accent = '#c96442';

  // visual differentiator per title — a faint colored "spine band" near top
  const hash = (book.t.charCodeAt(0) + book.t.charCodeAt(1)) % 5;
  const bands = ['#c96442', '#7a8c66', '#3f5c7c', '#a6824a', '#5e4a6b'];
  const band = bands[hash];

  return (
    <div style={{ width: w, color: fg, fontFamily: 'Architects Daughter, sans-serif' }}>
      <div
        className={'sk-cover' + (dark ? ' sk-cover-dark' : '') + (book.finished ? '' : ' sk-cover-x')}
        style={{ width: w, height: h, color: fg, position: 'relative' }}
      >
        {/* Faux spine/title band on the cover */}
        <div style={{ position: 'absolute', top: 12, left: 8, right: 8 }}>
          <div style={{ height: 3, background: band, opacity: 0.85, borderRadius: 2 }} />
        </div>
        <div style={{
          textAlign: 'center', padding: '0 10px',
          fontFamily: 'Caveat, cursive',
          fontSize: Math.max(13, w * 0.11),
          lineHeight: 1.05,
          color: fg, opacity: 0.85,
          mixBlendMode: 'normal'
        }}>
          {book.t}
        </div>
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          textAlign: 'center',
          fontFamily: 'Kalam, sans-serif',
          fontSize: Math.max(9, w * 0.055),
          opacity: 0.55,
        }}>
          {book.a}
        </div>

        {/* Status badge in top-right (variant: badge) */}
        {variant === 'badge' && book.status === 'finished' && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            fontFamily: 'Kalam', fontSize: 10,
            border: '1.2px solid ' + fg, borderRadius: 999,
            padding: '1px 7px', background: dark ? '#0c0c10' : '#faf8f3'
          }}>✓ done</div>
        )}
        {variant === 'badge' && book.status === 'reading' && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            fontFamily: 'Kalam', fontSize: 10,
            border: '1.2px solid ' + accent, color: accent, borderRadius: 999,
            padding: '1px 7px', background: dark ? '#0c0c10' : '#faf8f3'
          }}>reading</div>
        )}

        {/* Hover ghost actions */}
        {variant === 'hover' && (
          <div style={{
            position: 'absolute', inset: 'auto 8px 8px 8px',
            display: 'flex', gap: 4, justifyContent: 'center'
          }}>
            <div className="sk-pill" style={{ background: dark ? 'rgba(12,12,16,0.85)' : 'rgba(250,248,243,0.85)', color: fg, fontSize: 9, padding: '1px 6px' }}>▶ read</div>
            <div className="sk-pill" style={{ background: dark ? 'rgba(12,12,16,0.85)' : 'rgba(250,248,243,0.85)', color: fg, fontSize: 9, padding: '1px 6px' }}>✎ edit</div>
          </div>
        )}

        {/* Optional label (e.g. "1 of 6") */}
        {label && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            fontFamily: 'Kalam', fontSize: 10, opacity: 0.6
          }}>{label}</div>
        )}
      </div>

      {/* Progress bar overlay area — sits just under the cover */}
      {showProgress && book.p > 0 && (
        <div style={{ marginTop: 4 }}>
          <div className="sk-progress" style={{ background: dark ? 'rgba(232,230,223,0.15)' : 'rgba(26,26,31,0.15)' }}>
            <i style={{ width: (book.p * 100) + '%', background: accent }} />
          </div>
        </div>
      )}

      {/* Title/author under cover for 'titled' variant */}
      {variant === 'titled' && (
        <div style={{ marginTop: 6, fontFamily: 'Kalam', fontSize: 11, lineHeight: 1.2, color: fg }}>
          <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.t}</div>
          <div style={{ opacity: 0.6, fontSize: 10 }}>{book.a}</div>
        </div>
      )}
    </div>
  );
}

// Top bar mock (search + filter + sort + import)
function SkTopBar({ dark }) {
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.5)' : 'rgba(26,26,31,0.5)';
  const border = dark ? 'rgba(232,230,223,0.25)' : 'rgba(26,26,31,0.2)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 26px',
      borderBottom: '1.2px solid ' + border,
      color: fg,
    }}>
      <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 26, letterSpacing: 0.5, marginRight: 8 }}>
        Libris
      </div>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 6,
        border: '1.4px solid ' + border, borderRadius: 999,
        padding: '5px 14px',
        fontFamily: 'Kalam', fontSize: 13, color: muted
      }}>
        <span style={{ opacity: 0.8 }}>⌕</span>
        <span>Search title, author, ISBN…</span>
      </div>
      <div className="sk-pill" style={{ borderColor: border, color: fg }}>Filter ▾</div>
      <div className="sk-pill" style={{ borderColor: border, color: fg }}>Sort: Recent ▾</div>
      <div className="sk-btn" style={{ borderColor: fg, color: fg, fontSize: 13 }}>+ Import</div>
    </div>
  );
}

// Annotated label that floats outside an artboard via absolute positioning.
// Used inside artboards too as a tiny "callout".
function SkCallout({ children, style }) {
  return (
    <div style={{
      fontFamily: 'Caveat, cursive', color: '#c96442',
      fontSize: 16, lineHeight: 1.15,
      ...style
    }}>{children}</div>
  );
}

// arrow svg, useful for callouts
function SkArrow({ rotate = 0, w = 70, h = 40, color = '#c96442' }) {
  return (
    <svg width={w} height={h} viewBox="0 0 70 40" style={{ transform: `rotate(${rotate}deg)`, overflow: 'visible' }}>
      <path d="M2 8 C 20 4, 38 28, 64 30" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M58 24 L 64 30 L 56 32" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

Object.assign(window, {
  SAMPLE_BOOKS, SkCover, SkTopBar, SkCallout, SkArrow,
});
