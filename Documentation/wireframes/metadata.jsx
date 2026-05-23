// Metadata Editor — two variations.
// A: Single-column form modal (focused, simple)
// B: Split view — form left, "Search for metadata" results right

function FormRow({ label, value, dark, multiline, tags }) {
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.55)' : 'rgba(26,26,31,0.55)';
  const border = dark ? 'rgba(232,230,223,0.25)' : 'rgba(26,26,31,0.2)';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: 'Kalam', fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>{label}</div>
      {tags ? (
        <div style={{
          minHeight: 36, border: '1.4px solid ' + border, borderRadius: 6,
          padding: '5px 8px', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center'
        }}>
          {value.map((t, i) => (
            <span key={i} className="sk-pill" style={{ borderColor: fg, color: fg, fontSize: 11, padding: '1px 8px' }}>{t} ×</span>
          ))}
          <span style={{ fontFamily: 'Kalam', fontSize: 12, color: muted, padding: '0 4px' }}>+ add…</span>
        </div>
      ) : (
        <div style={{
          minHeight: multiline ? 80 : 36,
          border: '1.4px solid ' + border, borderRadius: 6,
          padding: '8px 10px',
          fontFamily: 'Architects Daughter', fontSize: 13,
          color: fg, whiteSpace: 'pre-wrap'
        }}>{value}</div>
      )}
    </div>
  );
}

function MetadataA({ tw }) {
  const dark = tw.dark;
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.55)' : 'rgba(26,26,31,0.55)';
  const border = dark ? 'rgba(232,230,223,0.25)' : 'rgba(26,26,31,0.2)';
  const accent = '#c96442';

  return (
    <div className={dark ? 'sk-dark' : 'sk-light'} style={{ width: '100%', height: '100%', overflow: 'hidden', color: fg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* dimmed background hint */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none' }}>
        <SkTopBar dark={dark} />
        <div style={{ padding: '22px 26px', display: 'flex', gap: 16 }}>
          {SAMPLE_BOOKS.slice(0, 8).map((b, i) => <SkCover key={i} book={b} w={88} h={132} variant="poster" dark={dark} showProgress={false} />)}
        </div>
      </div>

      {/* Modal */}
      <div style={{
        width: 540, maxHeight: '88%',
        background: dark ? '#15151b' : '#fdfaf3',
        border: '1.5px solid ' + border, borderRadius: 12,
        padding: 24,
        boxShadow: dark ? '0 30px 80px rgba(0,0,0,0.6)' : '0 30px 80px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: 'Kalam', fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.5 }}>Edit metadata</div>
            <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 30, lineHeight: 1.05 }}>The Long Ascent</div>
          </div>
          <div style={{ fontFamily: 'Kalam', fontSize: 22, opacity: 0.6 }}>✕</div>
        </div>

        <hr className="sk-divider" style={{ margin: '14px 0 18px', color: fg }} />

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <FormRow label="Title" value="The Long Ascent" dark={dark} />
          <FormRow label="Authors" value={['A. Maren']} dark={dark} tags />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <FormRow label="Series" value="The Maren Cycle" dark={dark} />
            <FormRow label="Book #" value="1" dark={dark} />
          </div>
          <FormRow label="Genres" value={['Literary', 'Sci-Fi']} dark={dark} tags />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormRow label="Publisher" value="Hollow House" dark={dark} />
            <FormRow label="Published" value="March 2024" dark={dark} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <FormRow label="ISBN" value="978-1-23456-789-0" dark={dark} />
            <FormRow label="Language" value="English" dark={dark} />
          </div>
          <FormRow label="Description" value="On the cliffs above Marenholm, a cartographer waits for a tide that does not come. A patient, intricate novel about distance, memory, and the cost of accurate maps." dark={dark} multiline />
        </div>

        <hr className="sk-divider" style={{ margin: '16px 0 12px', color: fg }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="sk-btn" style={{ borderColor: fg, color: fg }}>⤓ Search metadata…</div>
          <div style={{ flex: 1 }} />
          <div className="sk-btn" style={{ borderColor: muted, color: muted }}>Cancel</div>
          <div className="sk-btn sk-btn-solid" style={{ background: accent, borderColor: accent, color: dark ? '#0c0c10' : '#faf8f3', fontWeight: 700 }}>Save</div>
        </div>
      </div>

      <SkCallout style={{ position: 'absolute', top: 30, left: 30, transform: 'rotate(-2deg)' }}>
        focused modal —<br/>"Search metadata" expands to a sub-panel
      </SkCallout>
    </div>
  );
}

function MetadataB({ tw }) {
  const dark = tw.dark;
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.55)' : 'rgba(26,26,31,0.55)';
  const border = dark ? 'rgba(232,230,223,0.25)' : 'rgba(26,26,31,0.2)';
  const accent = '#c96442';

  const results = [
    { src: 'Open Library', t: 'The Long Ascent', a: 'A. Maren', y: '2024', isbn: '978-1-23456-789-0', match: 'ISBN', sel: true  },
    { src: 'Google Books', t: 'The Long Ascent', a: 'A. Maren', y: '2024', isbn: '978-1-23456-789-0', match: 'ISBN', sel: false },
    { src: 'Open Library', t: 'The Long Ascent (UK ed.)', a: 'A. Maren', y: '2023', isbn: '—', match: 'Title+Author', sel: false },
    { src: 'Google Books', t: 'A Long Ascent', a: 'Anya Maren', y: '2019', isbn: '—', match: 'Title', sel: false },
  ];

  return (
    <div className={dark ? 'sk-dark' : 'sk-light'} style={{ width: '100%', height: '100%', overflow: 'hidden', color: fg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
        <SkTopBar dark={dark} />
      </div>

      <div style={{
        width: 880, height: '90%',
        background: dark ? '#15151b' : '#fdfaf3',
        border: '1.5px solid ' + border, borderRadius: 12,
        boxShadow: dark ? '0 30px 80px rgba(0,0,0,0.6)' : '0 30px 80px rgba(0,0,0,0.18)',
        display: 'flex',
        position: 'relative', zIndex: 1, overflow: 'hidden'
      }}>
        {/* Left: form */}
        <div style={{ flex: 1, padding: 22, overflowY: 'auto' }}>
          <div style={{ fontFamily: 'Kalam', fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.5 }}>Edit metadata</div>
          <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 28, marginBottom: 14 }}>The Long Ascent</div>

          <FormRow label="Title" value="The Long Ascent" dark={dark} />
          <FormRow label="Authors" value={['A. Maren']} dark={dark} tags />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <FormRow label="Series" value="The Maren Cycle" dark={dark} />
            <FormRow label="Book #" value="1" dark={dark} />
          </div>
          <FormRow label="Genres" value={['Literary', 'Sci-Fi']} dark={dark} tags />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormRow label="ISBN" value="978-1-23456-789-0" dark={dark} />
            <FormRow label="Published" value="March 2024" dark={dark} />
          </div>
          <FormRow label="Description" value="On the cliffs above Marenholm, a cartographer waits for a tide that does not come…" dark={dark} multiline />
        </div>

        {/* Right: search results */}
        <div style={{
          width: 340, borderLeft: '1.4px solid ' + border,
          background: dark ? '#0c0c10' : '#f5f1e8',
          padding: 20, display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ fontFamily: 'Kalam', fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.5 }}>Search metadata</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: '1.4px solid ' + border, borderRadius: 999,
            padding: '5px 12px', marginTop: 8,
            fontFamily: 'Kalam', fontSize: 13, color: muted
          }}>
            <span>⌕</span><span style={{ color: fg }}>The Long Ascent · Maren</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <span className="sk-pill" style={{ borderColor: fg, color: fg, fontSize: 10 }}>Open Library ✓</span>
            <span className="sk-pill" style={{ borderColor: fg, color: fg, fontSize: 10 }}>Google Books ✓</span>
          </div>

          <hr className="sk-divider" style={{ margin: '14px 0', color: fg }} />

          <div style={{ fontFamily: 'Kalam', fontSize: 11, opacity: 0.6, marginBottom: 8 }}>4 results · ranked by match</div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                border: '1.4px ' + (r.sel ? 'solid ' + accent : 'dashed ' + border),
                borderRadius: 8, padding: 10,
                background: r.sel ? (dark ? 'rgba(201,100,66,0.12)' : 'rgba(201,100,66,0.08)') : 'transparent',
                display: 'flex', gap: 10
              }}>
                <div className="sk-cover sk-cover-x" style={{ width: 36, height: 54, color: fg, flex: '0 0 auto' }}></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Kalam', fontSize: 13, fontWeight: 700, lineHeight: 1.15 }}>{r.t}</div>
                  <div style={{ fontFamily: 'Kalam', fontSize: 11, opacity: 0.7 }}>{r.a} · {r.y}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    <span className="sk-pill" style={{ borderColor: border, color: muted, fontSize: 9, padding: '0 5px' }}>{r.src}</span>
                    <span className="sk-pill" style={{ borderColor: accent, color: accent, fontSize: 9, padding: '0 5px' }}>{r.match}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <hr className="sk-divider" style={{ margin: '12px 0', color: fg }} />
          <div className="sk-btn sk-btn-solid" style={{ background: accent, borderColor: accent, color: dark ? '#0c0c10' : '#faf8f3', fontWeight: 700, justifyContent: 'center' }}>Apply selected →</div>
        </div>
      </div>

      <SkCallout style={{ position: 'absolute', top: 30, right: 30, transform: 'rotate(2deg)' }}>
        split modal —<br/>form left, picker right
      </SkCallout>
    </div>
  );
}

Object.assign(window, { MetadataA, MetadataB });
