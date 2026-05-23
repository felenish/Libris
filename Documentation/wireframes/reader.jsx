// EPUB Reader — two variations. Minimal chrome (per user pref).
// A: Paginated, two-page spread, only close button visible
// B: Single column scroll with floating progress orb

function ReaderText({ dark, narrow }) {
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.7)' : 'rgba(26,26,31,0.75)';
  return (
    <div style={{
      fontFamily: 'Georgia, "Iowan Old Style", serif',
      fontSize: 15, lineHeight: 1.7,
      color: muted, maxWidth: narrow ? 460 : 'none'
    }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 700, color: fg, marginBottom: 4 }}>Chapter 14</div>
      <div style={{ fontFamily: 'Kalam', fontSize: 11, opacity: 0.55, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>The Slow Coast</div>
      <p style={{ margin: '0 0 14px' }}>
        The cartographer kept a list of tides he had failed to predict. He had begun it as a young man,
        in the orange ledger his father gave him on his seventeenth birthday, and he had not stopped
        adding to it in the forty years since. It was the most accurate document he owned.
      </p>
      <p style={{ margin: '0 0 14px' }}>
        From the cliffs above Marenholm he could see seven miles of coast in either direction —
        a stretch of grey that the maps insisted was a single bay but that he, having watched it
        for so long, had come to think of as four distinct places, each with its own weather.
      </p>
      <p style={{ margin: '0 0 14px' }}>
        On the night the new lantern was lit, he did not go up to watch. He sat at his desk with the
        ledger open and a pen in his hand. He waited for a tide that he had been expecting for
        thirty-one days. It did not come.
      </p>
      <p style={{ margin: '0 0 14px', opacity: 0.6 }}>
        The wind moved the curtain twice, then stopped. He wrote the date in the margin and underlined it.
      </p>
    </div>
  );
}

function ReaderA({ tw }) {
  const dark = tw.dark;
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.5)' : 'rgba(26,26,31,0.5)';
  const accent = '#c96442';

  return (
    <div className={dark ? 'sk-dark' : 'sk-light'} style={{ width: '100%', height: '100%', overflow: 'hidden', color: fg, position: 'relative' }}>
      {/* Top corners — only the close button is visible by default */}
      <div style={{
        position: 'absolute', top: 14, right: 18,
        width: 34, height: 34, borderRadius: 999,
        border: '1.4px solid ' + fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Kalam', fontSize: 18,
        background: dark ? 'rgba(12,12,16,0.6)' : 'rgba(250,248,243,0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 5
      }}>✕</div>

      {/* Two-page spread */}
      <div style={{
        height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.4px 1fr',
        padding: '60px 64px 50px'
      }}>
        <div style={{ paddingRight: 28 }}><ReaderText dark={dark} /></div>
        <div style={{ background: dark ? 'rgba(232,230,223,0.12)' : 'rgba(26,26,31,0.12)' }} />
        <div style={{ paddingLeft: 28 }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.7, color: dark ? 'rgba(232,230,223,0.7)' : 'rgba(26,26,31,0.75)', margin: '0 0 14px' }}>
            By morning he had decided not to leave the house. There were sixty-seven entries already
            in the ledger; one more would not change anything, and yet he understood now that this
            one was different. The coast had failed him personally.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.7, color: dark ? 'rgba(232,230,223,0.7)' : 'rgba(26,26,31,0.75)', margin: '0 0 14px' }}>
            He thought of his daughter, who had not written in two months, and of the small house
            in the city she had taken without telling him, and of the maps she did not believe in.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.7, color: dark ? 'rgba(232,230,223,0.7)' : 'rgba(26,26,31,0.75)', margin: '0 0 14px' }}>
            Outside, the lantern continued to burn, though no boat was coming and no boat would come.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.7, color: dark ? 'rgba(232,230,223,0.7)' : 'rgba(26,26,31,0.75)', margin: 0, opacity: 0.6 }}>
            He turned the page. The next chapter was already half-written in his head.
          </p>
        </div>
      </div>

      {/* Invisible click zones (hinted as dashed regions) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 64,
        borderRight: '1.2px dashed ' + muted, opacity: 0.5
      }}>
        <div style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', fontFamily: 'Caveat', color: muted, fontSize: 14, lineHeight: 1.1, textAlign: 'center' }}>
          tap<br/>back
        </div>
      </div>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 64,
        borderLeft: '1.2px dashed ' + muted, opacity: 0.5
      }}>
        <div style={{ position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)', fontFamily: 'Caveat', color: muted, fontSize: 14, lineHeight: 1.1, textAlign: 'center' }}>
          tap<br/>forward
        </div>
      </div>

      {/* Bottom — progress whisper */}
      <div style={{
        position: 'absolute', bottom: 14, left: 0, right: 0,
        display: 'flex', justifyContent: 'center'
      }}>
        <div style={{ fontFamily: 'Kalam', fontSize: 11, color: muted, letterSpacing: 1.2 }}>
          page 142 · 62%
        </div>
      </div>

      <SkCallout style={{ position: 'absolute', top: 16, left: 18, transform: 'rotate(-2deg)' }}>
        only close button visible<br/>edges are invisible tap zones
      </SkCallout>
    </div>
  );
}

function ReaderB({ tw }) {
  const dark = tw.dark;
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.5)' : 'rgba(26,26,31,0.5)';
  const accent = '#c96442';

  return (
    <div className={dark ? 'sk-dark' : 'sk-light'} style={{ width: '100%', height: '100%', overflow: 'hidden', color: fg, position: 'relative' }}>
      {/* Centered single column reading */}
      <div style={{ height: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center', padding: '70px 0 60px' }}>
        <div style={{ width: 540 }}>
          <ReaderText dark={dark} narrow />
          <div style={{ height: 18 }} />
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.7, color: dark ? 'rgba(232,230,223,0.7)' : 'rgba(26,26,31,0.75)', margin: '0 0 14px' }}>
            By morning he had decided not to leave the house. There were sixty-seven entries already
            in the ledger; one more would not change anything, and yet he understood now that this
            one was different.
          </p>
        </div>
      </div>

      {/* Floating close pill (top-right) */}
      <div style={{
        position: 'absolute', top: 14, right: 18,
        padding: '6px 14px',
        border: '1.4px solid ' + fg, borderRadius: 999,
        fontFamily: 'Kalam', fontSize: 13,
        background: dark ? 'rgba(12,12,16,0.6)' : 'rgba(250,248,243,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', gap: 6, zIndex: 5
      }}>✕ Close</div>

      {/* Floating progress orb bottom-right */}
      <div style={{
        position: 'absolute', bottom: 20, right: 20,
        width: 64, height: 64, borderRadius: 999,
        border: '1.4px solid ' + fg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Kalam', background: dark ? 'rgba(12,12,16,0.7)' : 'rgba(250,248,243,0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 5
      }}>
        {/* progress ring (rough) */}
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="32" cy="32" r="28" stroke={muted} strokeWidth="1.4" fill="none" strokeDasharray="2 3"/>
          <circle cx="32" cy="32" r="28" stroke={accent} strokeWidth="2.6" fill="none"
            strokeDasharray={`${28 * 2 * Math.PI * 0.62} ${28 * 2 * Math.PI}`}
            strokeDashoffset={`${28 * 2 * Math.PI * 0.25}`}
            transform="rotate(-90 32 32)" strokeLinecap="round"/>
        </svg>
        <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1, position: 'relative' }}>62%</div>
        <div style={{ fontSize: 9, opacity: 0.6, position: 'relative', marginTop: 1 }}>p.142</div>
      </div>

      {/* Whisper at very bottom */}
      <div style={{
        position: 'absolute', bottom: 14, left: 0, right: 0,
        textAlign: 'center', fontFamily: 'Kalam', fontSize: 11, color: muted, letterSpacing: 1.2
      }}>
        The Long Ascent · Chapter 14
      </div>

      <SkCallout style={{ position: 'absolute', top: 16, left: 18, transform: 'rotate(-1.5deg)' }}>
        single column scroll<br/>floating progress orb
      </SkCallout>
    </div>
  );
}

Object.assign(window, { ReaderA, ReaderB });
