// Main Library — two variations.
// A: Classic horizontal shelves (rows by category)
// B: Hero strip ("Continue Reading" focus) + grid below

function LibraryA({ tw }) {
  const dark = tw.dark;
  const showProg = tw.progress;
  const sizeMap = { S: { w: 88, h: 132, gap: 14 }, M: { w: 110, h: 165, gap: 16 }, L: { w: 132, h: 198, gap: 20 } };
  const sz = sizeMap[tw.size] || sizeMap.M;
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.55)' : 'rgba(26,26,31,0.55)';

  const shelves = [
    { id: 'continue',  label: 'Continue Reading',   books: SAMPLE_BOOKS.filter(b => b.status === 'reading') },
    { id: 'series',    label: 'The Maren Cycle',    books: [SAMPLE_BOOKS[0], SAMPLE_BOOKS[9], SAMPLE_BOOKS[2], SAMPLE_BOOKS[5], SAMPLE_BOOKS[7]] },
    { id: 'author',    label: 'By Author · A. Maren', books: [SAMPLE_BOOKS[0], SAMPLE_BOOKS[9], SAMPLE_BOOKS[11], SAMPLE_BOOKS[3]] },
    { id: 'genre',     label: 'Literary Fiction',    books: [SAMPLE_BOOKS[1], SAMPLE_BOOKS[8], SAMPLE_BOOKS[10], SAMPLE_BOOKS[2], SAMPLE_BOOKS[5], SAMPLE_BOOKS[7]] },
  ];

  return (
    <div className={dark ? 'sk-dark' : 'sk-light'} style={{ width: '100%', height: '100%', overflow: 'hidden', color: fg, display: 'flex', flexDirection: 'column' }}>
      <SkTopBar dark={dark} />
      <div style={{ padding: '22px 26px 30px', flex: 1, overflow: 'hidden' }}>
        {shelves.map((sh, i) => (
          <div key={sh.id} style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 22, letterSpacing: 0.3 }}>{sh.label}</div>
              <div style={{ display: 'flex', gap: 6, color: fg }}>
                <span className="sk-chev">‹</span>
                <span className="sk-chev">›</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: sz.gap, alignItems: 'flex-start' }}>
              {sh.books.slice(0, 7).map((b, idx) => (
                <SkCover key={idx} book={b} w={sz.w} h={sz.h} variant={tw.card} dark={dark} showProgress={showProg} />
              ))}
              {/* fade-out hint for scroll */}
              <div style={{
                flex: 1, minWidth: 30, alignSelf: 'stretch',
                background: dark
                  ? 'linear-gradient(to right, transparent, #0c0c10)'
                  : 'linear-gradient(to right, transparent, #faf8f3)'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* annotation note */}
      <div style={{ position: 'absolute', right: 28, top: 86 }}>
        <SkCallout>horizontal shelves<br/>by category</SkCallout>
      </div>
    </div>
  );
}

function LibraryB({ tw }) {
  const dark = tw.dark;
  const showProg = tw.progress;
  const sizeMap = { S: { w: 80, h: 120, gap: 12 }, M: { w: 100, h: 150, gap: 14 }, L: { w: 120, h: 180, gap: 18 } };
  const sz = sizeMap[tw.size] || sizeMap.M;
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const muted = dark ? 'rgba(232,230,223,0.55)' : 'rgba(26,26,31,0.55)';
  const accent = '#c96442';

  // Featured "now reading" book at top
  const hero = SAMPLE_BOOKS[0];
  const continueRow = SAMPLE_BOOKS.filter(b => b.status === 'reading');

  return (
    <div className={dark ? 'sk-dark' : 'sk-light'} style={{ width: '100%', height: '100%', overflow: 'hidden', color: fg, display: 'flex', flexDirection: 'column' }}>
      <SkTopBar dark={dark} />

      {/* Hero strip — cinematic focus on a single in-progress book */}
      <div style={{
        margin: '20px 26px 0',
        padding: 18,
        border: '1.4px dashed ' + (dark ? 'rgba(232,230,223,0.3)' : 'rgba(26,26,31,0.25)'),
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 24,
        position: 'relative',
        background: dark
          ? 'linear-gradient(90deg, rgba(201,100,66,0.10), transparent 70%)'
          : 'linear-gradient(90deg, rgba(201,100,66,0.06), transparent 70%)'
      }}>
        <SkCover book={hero} w={120} h={180} variant="poster" dark={dark} showProgress={false} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Kalam', fontSize: 11, opacity: 0.6, letterSpacing: 1.5, textTransform: 'uppercase' }}>Pick up where you left off</div>
          <div style={{ fontFamily: 'Caveat', fontSize: 36, fontWeight: 700, lineHeight: 1.05, marginTop: 4 }}>{hero.t}</div>
          <div style={{ fontFamily: 'Kalam', fontSize: 14, opacity: 0.7, marginTop: 2 }}>{hero.a} · Chapter 14 · 62%</div>
          <div className="sk-progress" style={{ width: 260, marginTop: 12, background: dark ? 'rgba(232,230,223,0.18)' : 'rgba(26,26,31,0.15)' }}>
            <i style={{ width: '62%' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <div className="sk-btn" style={{ borderColor: accent, color: accent, fontWeight: 700 }}>▶ Continue</div>
            <div className="sk-btn" style={{ borderColor: fg, color: fg }}>Details</div>
          </div>
        </div>
        <SkCallout style={{ position: 'absolute', top: -8, right: 18, transform: 'rotate(-2deg)' }}>
          hero / "now reading"
        </SkCallout>
      </div>

      {/* Continue Reading row */}
      <div style={{ padding: '18px 26px 8px' }}>
        <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Continue Reading</div>
        <div style={{ display: 'flex', gap: sz.gap }}>
          {continueRow.slice(0, 8).map((b, i) => (
            <SkCover key={i} book={b} w={sz.w} h={sz.h} variant={tw.card} dark={dark} showProgress={showProg} />
          ))}
        </div>
      </div>

      {/* All books grid below */}
      <div style={{ padding: '14px 26px 0', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 20 }}>All Books · 412</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="sk-pill" style={{ borderColor: fg, color: fg }}>▦ Grid</span>
            <span className="sk-pill" style={{ borderColor: fg, color: fg, opacity: 0.5 }}>≡ List</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, ${sz.w}px)`, gap: sz.gap, justifyContent: 'flex-start' }}>
          {SAMPLE_BOOKS.concat(SAMPLE_BOOKS).slice(0, 16).map((b, i) => (
            <SkCover key={i} book={b} w={sz.w} h={sz.h} variant={tw.card} dark={dark} showProgress={showProg} />
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LibraryA, LibraryB });
