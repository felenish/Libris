// Book Detail — two variations.
// A: Slide-in right panel over dimmed library
// B: Full-page detail (cinematic, cover-forward)

function DetailA({ tw }) {
  const dark = tw.dark;
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.55)' : 'rgba(26,26,31,0.55)';
  const border = dark ? 'rgba(232,230,223,0.2)' : 'rgba(26,26,31,0.15)';
  const accent = '#c96442';
  const book = SAMPLE_BOOKS[0];

  return (
    <div className={dark ? 'sk-dark' : 'sk-light'} style={{ width: '100%', height: '100%', overflow: 'hidden', color: fg, position: 'relative', display: 'flex' }}>
      {/* Library shown dimmed behind the panel */}
      <div style={{ flex: 1, opacity: 0.35, pointerEvents: 'none', filter: 'blur(0.4px)' }}>
        <SkTopBar dark={dark} />
        <div style={{ padding: '22px 26px' }}>
          <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 22, marginBottom: 10 }}>Continue Reading</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {SAMPLE_BOOKS.slice(0, 6).map((b, i) => (
              <SkCover key={i} book={b} w={100} h={150} variant={tw.card} dark={dark} showProgress={tw.progress} />
            ))}
          </div>
          <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 22, margin: '24px 0 10px' }}>The Maren Cycle</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {SAMPLE_BOOKS.slice(2, 8).map((b, i) => (
              <SkCover key={i} book={b} w={100} h={150} variant={tw.card} dark={dark} showProgress={tw.progress} />
            ))}
          </div>
        </div>
      </div>

      {/* Slide-in panel */}
      <div style={{
        width: 440,
        borderLeft: '1.5px solid ' + border,
        background: dark ? '#0c0c10' : '#faf8f3',
        padding: '20px 24px 24px',
        display: 'flex', flexDirection: 'column',
        boxShadow: dark ? '-20px 0 40px rgba(0,0,0,0.5)' : '-20px 0 40px rgba(0,0,0,0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'Kalam', fontSize: 12, opacity: 0.6, letterSpacing: 1.5, textTransform: 'uppercase' }}>Book</div>
          <div style={{ fontFamily: 'Kalam', fontSize: 20, opacity: 0.7, cursor: 'pointer' }}>✕</div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <SkCover book={book} w={130} h={195} variant="poster" dark={dark} showProgress={false} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Caveat', fontSize: 28, fontWeight: 700, lineHeight: 1.05 }}>{book.t}</div>
            <div style={{ fontFamily: 'Kalam', fontSize: 14, opacity: 0.75, marginTop: 2 }}>{book.a}</div>
            <div style={{ fontFamily: 'Kalam', fontSize: 12, opacity: 0.55, marginTop: 2 }}>Maren Cycle · Book 1 · 2024</div>

            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <span className="sk-pill" style={{ borderColor: border, color: fg }}>Literary</span>
              <span className="sk-pill" style={{ borderColor: border, color: fg }}>Sci-Fi</span>
              <span className="sk-pill" style={{ borderColor: border, color: fg }}>Series</span>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'Kalam', fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Reading · 62%</div>
              <div className="sk-progress" style={{ background: dark ? 'rgba(232,230,223,0.18)' : 'rgba(26,26,31,0.15)' }}>
                <i style={{ width: '62%' }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <div className="sk-btn sk-btn-solid" style={{ color: dark ? '#0c0c10' : '#faf8f3', background: accent, borderColor: accent, fontWeight: 700, padding: '8px 16px', fontSize: 14 }}>▶ Read</div>
          <div className="sk-btn" style={{ borderColor: fg, color: fg }}>✎ Edit</div>
          <div className="sk-btn" style={{ borderColor: fg, color: fg }}>⤓ Fetch</div>
          <div className="sk-btn" style={{ borderColor: muted, color: muted, marginLeft: 'auto' }}>⋯</div>
        </div>

        <hr className="sk-divider" style={{ margin: '20px 0 14px', color: fg }} />

        <div style={{ fontFamily: 'Architects Daughter', fontSize: 13, lineHeight: 1.55, opacity: 0.85 }}>
          On the cliffs above Marenholm, a cartographer waits for a tide that does not come. A patient,
          intricate novel about distance, memory, and the cost of accurate maps.
        </div>

        <div style={{ marginTop: 20, fontFamily: 'Kalam', fontSize: 12, color: muted, display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6 }}>
          <div>Publisher</div><div style={{ color: fg }}>Hollow House</div>
          <div>Published</div><div style={{ color: fg }}>March 2024</div>
          <div>ISBN</div><div style={{ color: fg }}>978-1-23456-789-0</div>
          <div>Language</div><div style={{ color: fg }}>English</div>
          <div>File</div><div style={{ color: fg, fontFamily: 'JetBrains Mono', fontSize: 11 }}>~/Books/maren-01.epub</div>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ marginTop: 14, fontFamily: 'Kalam', fontSize: 11, color: muted }}>
          Last read · 2h ago · 47 sessions
        </div>
      </div>

      <SkCallout style={{ position: 'absolute', top: 78, right: 470, transform: 'rotate(-3deg)' }}>
        slide-in detail panel<br/>library stays visible behind
      </SkCallout>
    </div>
  );
}

function DetailB({ tw }) {
  const dark = tw.dark;
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.55)' : 'rgba(26,26,31,0.55)';
  const border = dark ? 'rgba(232,230,223,0.2)' : 'rgba(26,26,31,0.15)';
  const accent = '#c96442';
  const book = SAMPLE_BOOKS[0];

  return (
    <div className={dark ? 'sk-dark' : 'sk-light'} style={{ width: '100%', height: '100%', overflow: 'hidden', color: fg, display: 'flex', flexDirection: 'column' }}>
      {/* Back chip top-left */}
      <div style={{ padding: '14px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.2px solid ' + border }}>
        <div className="sk-pill" style={{ borderColor: fg, color: fg, fontSize: 13 }}>← Library</div>
        <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 22 }}>Libris</div>
        <div className="sk-pill" style={{ borderColor: muted, color: muted, fontSize: 13 }}>⋯ More</div>
      </div>

      {/* Cinematic top — large cover left, copy right */}
      <div style={{
        padding: '36px 50px 26px',
        display: 'flex', gap: 36,
        background: dark
          ? 'radial-gradient(circle at 20% 30%, rgba(201,100,66,0.18), transparent 60%)'
          : 'radial-gradient(circle at 20% 30%, rgba(201,100,66,0.10), transparent 60%)'
      }}>
        <SkCover book={book} w={200} h={300} variant="poster" dark={dark} showProgress={false} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'Kalam', fontSize: 11, opacity: 0.6, letterSpacing: 1.8, textTransform: 'uppercase' }}>Maren Cycle · Book 1 of 6</div>
          <div style={{ fontFamily: 'Caveat', fontSize: 56, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{book.t}</div>
          <div style={{ fontFamily: 'Kalam', fontSize: 18, opacity: 0.8, marginTop: 4 }}>{book.a}</div>

          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            <span className="sk-pill" style={{ borderColor: border, color: fg }}>Literary</span>
            <span className="sk-pill" style={{ borderColor: border, color: fg }}>Sci-Fi</span>
            <span className="sk-pill" style={{ borderColor: border, color: fg }}>2024</span>
            <span className="sk-pill" style={{ borderColor: border, color: fg }}>312 pp</span>
          </div>

          <div style={{ fontFamily: 'Architects Daughter', fontSize: 14, lineHeight: 1.55, marginTop: 16, maxWidth: 540, opacity: 0.88 }}>
            On the cliffs above Marenholm, a cartographer waits for a tide that does not come. A patient,
            intricate novel about distance, memory, and the cost of accurate maps — the opening salvo of
            the long-rumored Maren Cycle.
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 22, alignItems: 'center' }}>
            <div className="sk-btn sk-btn-solid" style={{ color: dark ? '#0c0c10' : '#faf8f3', background: accent, borderColor: accent, fontWeight: 700, padding: '9px 22px', fontSize: 15 }}>▶ Continue reading</div>
            <div className="sk-btn" style={{ borderColor: fg, color: fg }}>✎ Edit metadata</div>
            <div className="sk-btn" style={{ borderColor: fg, color: fg }}>⤓ Fetch info</div>
            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: 'Kalam', fontSize: 12, color: muted }}>62% · 2h ago</div>
          </div>
          <div className="sk-progress" style={{ marginTop: 8, maxWidth: 460, background: dark ? 'rgba(232,230,223,0.18)' : 'rgba(26,26,31,0.15)' }}>
            <i style={{ width: '62%' }} />
          </div>
        </div>
      </div>

      {/* Series row — also in series */}
      <div style={{ padding: '12px 50px 0' }}>
        <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 22, marginBottom: 10 }}>More in this series</div>
        <div style={{ display: 'flex', gap: 14 }}>
          {SAMPLE_BOOKS.slice(0, 6).map((b, i) => (
            <SkCover key={i} book={b} w={92} h={138} variant={tw.card} dark={dark} showProgress={tw.progress} label={`${i + 1} of 6`} />
          ))}
        </div>
      </div>

      <SkCallout style={{ position: 'absolute', top: 60, right: 30, transform: 'rotate(2deg)' }}>
        full-page detail<br/>cinematic, cover-forward
      </SkCallout>
    </div>
  );
}

Object.assign(window, { DetailA, DetailB });
