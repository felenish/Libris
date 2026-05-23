// Libris Wireframes — locked direction.
// User selected: Library A · Detail B · Metadata B · Reader B.
// Laid out in user-flow order on the canvas.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "card": "poster",
  "size": "M",
  "dark": true,
  "progress": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <DesignCanvas>
        <DCSection id="intro" title="Libris · Wireframes v1" subtitle="Locked direction: Library A · Detail B · Metadata B · Reader B.">
          <DCArtboard id="legend" label="Read me" width={420} height={460}>
            <Legend tw={t} />
          </DCArtboard>
        </DCSection>

        <DCSection id="flow" title="User flow" subtitle="Library → click a card → Detail → ✎ Edit metadata → ▶ Read.">
          <DCArtboard id="lib-a" label="1 · Library" width={1200} height={750}>
            <LibraryA tw={t} />
          </DCArtboard>
          <DCArtboard id="det-b" label="2 · Book detail" width={1200} height={750}>
            <DetailB tw={t} />
          </DCArtboard>
          <DCArtboard id="meta-b" label="3 · Metadata editor" width={900} height={640}>
            <MetadataB tw={t} />
          </DCArtboard>
          <DCArtboard id="rdr-b" label="4 · Reader" width={1100} height={720}>
            <ReaderB tw={t} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Wireframe knobs">
        <TweakSection label="Card style" />
        <TweakSelect label="Variant" value={t.card}
          options={[
            { value: 'poster',  label: 'Poster (cover only)' },
            { value: 'titled',  label: 'Cover + title' },
            { value: 'badge',   label: 'Cover + badge' },
            { value: 'hover',   label: 'Cover + hover actions' },
          ]}
          onChange={(v) => setTweak('card', v)} />
        <TweakRadio label="Card size" value={t.size}
          options={['S', 'M', 'L']}
          onChange={(v) => setTweak('size', v)} />

        <TweakSection label="Display" />
        <TweakToggle label="Dark wireframe" value={t.dark}
          onChange={(v) => setTweak('dark', v)} />
        <TweakToggle label="Progress bars" value={t.progress}
          onChange={(v) => setTweak('progress', v)} />
      </TweaksPanel>
    </>
  );
}

function Legend({ tw }) {
  const dark = tw.dark;
  const fg = dark ? '#e8e6df' : '#1a1a1f';
  const accent = '#c96442';
  return (
    <div className={dark ? 'sk-dark' : 'sk-light'} style={{ width: '100%', height: '100%', padding: 22, color: fg, fontFamily: 'Architects Daughter, sans-serif' }}>
      <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 30, lineHeight: 1.05 }}>Libris · v1 wires</div>
      <div style={{ fontFamily: 'Kalam', fontSize: 12, opacity: 0.6, marginTop: 2 }}>locked direction · low-fi</div>

      <hr className="sk-divider" style={{ margin: '14px 0', color: fg }} />

      <div style={{ fontFamily: 'Kalam', fontSize: 12, opacity: 0.7, marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>The flow</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, fontFamily: 'Architects Daughter' }}>
        1. <b>Library</b> — classic shelves<br/>
        2. <b>Detail</b> — full-page, cover-forward<br/>
        3. <b>Edit metadata</b> — split modal w/ search<br/>
        4. <b>Reader</b> — scroll + progress orb
      </div>

      <hr className="sk-divider" style={{ margin: '14px 0', color: fg }} />

      <div style={{ fontFamily: 'Kalam', fontSize: 12, opacity: 0.7, marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>Still TBD</div>
      <div style={{ fontSize: 12, lineHeight: 1.55, opacity: 0.85, fontFamily: 'Architects Daughter' }}>
        empty / first-import state · search results · file-not-found relink · keyboard shortcuts overlay
      </div>

      <hr className="sk-divider" style={{ margin: '14px 0', color: fg }} />

      <div style={{ fontFamily: 'Caveat', fontSize: 18, color: accent }}>Tweaks panel ↘</div>
      <div style={{ fontFamily: 'Kalam', fontSize: 12, opacity: 0.7, marginTop: 2 }}>
        Card style · size · progress bars · dark/light
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
