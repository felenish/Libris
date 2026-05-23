# Handoff: Libris MVP UI

## Overview

Libris is a desktop-first EPUB library organizer and reader (C# / .NET 10 / WPF + WebView2 + React frontend, per `Libris_Design_Document.md` in this folder).
This handoff covers the **React frontend UI** for the MVP: a Netflix-style shelf-browsing library, a book detail page, a metadata editor modal, and a minimal EPUB reader overlay.

## About the Design Files

The files in `wireframes/` are **design references created in HTML** — sketchy, low-fidelity prototypes that show layout, hierarchy, and flow. They are **not** production code to copy directly.

Your task is to **implement the same screens in the project's actual React + TypeScript frontend** (`ui/libris-ui/` per the design doc) using the established stack: React, TanStack Query, Zustand, framer-motion, and `epubjs` for the reader. Style with whatever convention the project uses (CSS Modules, Tailwind, etc. — none is mandated yet, so pick one and be consistent).

Open `wireframes/index.html` in a browser to explore the designs on a pan/zoom canvas. The Tweaks panel (top-right toolbar) lets you cycle through card-style variants, sizes, dark/light mode, and progress-bar visibility — useful for seeing the structure under different settings.

## Fidelity

**Low-fidelity wireframes.** Treat them as structural guidance:

- ✅ Use them for: **screen composition, element hierarchy, what's on screen, where it lives, interaction model, copy tone, dark cinematic vibe**
- ❌ Do **not** copy: the sketchy Caveat/Kalam/Architects Daughter fonts, the dashed/wobble borders, the hand-drawn cover placeholders, the orange annotation callouts (these are wireframe conventions, not the final visual language)

For the real implementation, choose a clean modern type pairing (e.g. Inter or a similar grotesque for UI + a serif like Source Serif / Lora for reader body), use real EPUB covers (fetched/extracted per the design doc), and lean on standard rounded rectangles, real shadows, and crisp 1px borders. Keep the **dark cinematic, cover-forward, sparse** personality — covers do the talking; chrome is minimal.

## Screens

### 1. Main Library (`LibraryA`)

**Purpose:** Browse the user's full EPUB collection, organized into themed shelves.

**Layout:**
- Top bar (full-width, ~56px tall): `Libris` wordmark · search field (flex 1, pill-shaped) · `Filter ▾` chip · `Sort ▾` chip · `+ Import` outline button
- Below the top bar: vertically stacked **shelves**, each with a header row and a horizontally-scrolling row of cover cards

**Shelf row:**
- Header: shelf title (large, e.g. 22–24px) on the left, prev/next chevrons (circular buttons) on the right
- Body: horizontal scroller of book cards with a fade-to-background on the right edge as a scroll affordance
- Each card is a **cover** with a thin progress bar **directly underneath** if the book is in progress

**Shelf order** (per design doc §7):
1. Continue Reading (books with status = Reading, sorted by `lastReadUtc` desc)
2. Recently Added (max 20, sorted by `importedUtc` desc)
3. Series shelves (one per series the user owns, sorted by `seriesIndex`)
4. Author shelves (one per author with ≥ 2 books, sorted by `publishedDate`)
5. Genre shelves (sorted by title)

Series → Author → Genre groups are each sorted alphabetically internally.

**Book card** (the locked-in style):
- Pure cover (no chrome under it by default) — let the artwork carry it
- Progress bar (4px tall, accent color) directly underneath when `book.progress.percentage > 0`
- On hover: scale 1.04, soft shadow, reveal a small action row (▶ Read, ✎ Edit) overlaid on the bottom of the cover with backdrop blur
- Double-click → opens the reader directly (per design doc §9 and §11)
- Single-click → opens the Book Detail page

**Sizes** (the wireframe exposes S / M / L; pick M as default):
- S: 88×132, gap 14
- **M: 110×165, gap 16** ← default
- L: 132×198, gap 20

### 2. Book Detail (`DetailB`) — full-page

**Purpose:** Inspect one title; launch reader; edit/fetch metadata.

**Layout:**
- Compact top strip: `← Library` chip · `Libris` wordmark center · `⋯ More` chip (Remove from Library, Reveal in Explorer, Relink file…)
- **Hero section** (~36px top padding, 50px side padding):
  - Left: large cover, 200×300, no chrome
  - Right column (flex 1):
    - Eyebrow text (11px, uppercase, letterspace 1.8): `Maren Cycle · Book 1 of 6`
    - Title (very large, ~56px, tight line-height 1.0)
    - Author (18px, 80% opacity)
    - Genre/year/length pills row (6px gap)
    - Description (14px, line-height 1.55, max-width 540px, 88% opacity)
    - Action row: **▶ Continue reading** (filled accent button, primary) · `✎ Edit metadata` (outline) · `⤓ Fetch info` (outline) · right-aligned `62% · 2h ago` whisper text
    - Progress bar (4px) under the action row, max-width 460px
  - Subtle radial gradient bg at top-left (accent at ~10–18% opacity) for cinematic feel
- **"More in this series" row** below the hero: ~92×138 covers in a horizontal scroller, each tagged `N of 6`

**Interactions:**
- Back chip → returns to library (push to router; preserve scroll position)
- ▶ Continue reading → opens the reader overlay; loads stored CFI before first paint
- ✎ Edit metadata → opens the metadata editor modal
- ⤓ Fetch info → opens the modal pre-routed to its right-side search panel
- ⋯ More → small popover menu

### 3. Metadata Editor (`MetadataB`) — split modal

**Purpose:** Edit any field, optionally search Open Library + Google Books and merge results.

**Layout:**
- Modal overlay (backdrop dim 40–60%) centered on screen
- Modal: **880px × 90vh max**, rounded 12, soft shadow
- **Left pane (flex 1)** — the form:
  - Header: small uppercase eyebrow `EDIT METADATA`, large title showing the book's current title
  - Fields in this order: Title · Authors (tag input) · [Series + Book # grid 2:1] · Genres (tag input) · [ISBN + Published grid 1:1] · Description (multiline, ≥ 80px tall)
  - Each field row: 11px uppercase label above a 1.4px-border input, 14px field gap
- **Right pane (340px, separated by 1.4px divider)** — search:
  - Eyebrow `SEARCH METADATA`
  - Search bar pre-filled with current `title · author`
  - Provider toggles: `Open Library ✓` `Google Books ✓` pills
  - Result count + ranking note (e.g. "4 results · ranked by match")
  - Vertical list of result cards. Each result:
    - Thin cover thumb 36×54 left
    - Title (bold 13px), Author · Year (11px, 70% opacity)
    - Source pill (`Open Library` / `Google Books`) + match-quality pill (`ISBN` / `Title+Author` / `Title`) — ISBN match is strongest
    - Selected result: solid accent border + tinted bg (`rgba(201,100,66,0.08)` light, `0.12` dark)
  - Sticky bottom: filled accent **Apply selected →** button

**Behavior:**
- Form is editable inline; tag inputs support add/remove
- Selecting a search result populates the form fields, but **does not auto-save** — user reviews and saves explicitly
- "Search for metadata" calls `POST /api/metadata/search` with current title + author (per design doc §11)
- Save calls `PUT /api/books/{id}/metadata`
- If the selected result has a cover URL, the API downloads + caches it (per design doc §8)
- Esc closes the modal; clicking the backdrop closes after a confirm if there are unsaved changes

### 4. EPUB Reader (`ReaderB`) — scroll with progress orb

**Purpose:** Read the book. Almost no chrome. Resume at exact position.

**Layout:**
- Full-window overlay (slides up over the library)
- Content area: **single column, ~540px wide, centered**, generous top/bottom padding (70 / 60)
- Body type: serif (Georgia / Iowan Old Style / Source Serif), 15–16px, line-height ~1.7, slightly muted color
- Chapter heading uses a display style — keep it minimal (uppercase 11px eyebrow for chapter subtitle, larger header for chapter name)

**Chrome (the only visible UI):**
- **Top-right floating pill:** `✕ Close` — 1.4px border, semi-transparent bg with backdrop blur
- **Bottom-right floating progress orb:**
  - 64×64 circle, 1.4px border, backdrop-blurred bg
  - SVG ring: muted dashed ring underneath (the "track") + solid accent arc on top representing percentage
  - Center: percentage (17px bold) + page number (9px, 60% opacity)
- Bottom-center whisper: `<Book title> · Chapter X` in 11px, muted, letterspaced 1.2

**Behavior:**
- Pagination handled by epub.js via scroll within the column (use `flow: scrolled`)
- On `locationChanged` (fired by epub.js): debounce 2s, `PUT /api/books/{id}/progress` with `{ cfi, percentage }`
- On reader close: synchronous save of current CFI before unmount (useEffect cleanup)
- On reader open: fetch progress → `rendition.display(cfi)` **before** first paint to prevent the "jump from page 1" flash
- Click the orb → opens a small popover with: TOC list, font-size slider, line-height slider, light/sepia/dark toggle (per `settings.json` future work — MVP can ship with just font size)
- `Esc` triggers Close (with save)

## Interactions & Behavior

### Global

- All API calls go to `/api/*` (same-origin via Kestrel in-process) — no CORS, no auth header
- Use TanStack Query for shelves, books, and progress; Zustand for transient UI state (current detail page, reader open/closed, modal open/closed)
- Optimistic updates for metadata save and progress save; reconcile on response

### Navigation flow

```
Library (LibraryA)
  ├── single-click cover → Detail (DetailB)
  │     ├── ▶ Continue reading → Reader (ReaderB)
  │     ├── ✎ Edit metadata → Metadata modal (MetadataB)
  │     ├── ⤓ Fetch info → Metadata modal, focus right pane
  │     └── ← Library → back
  └── double-click cover → Reader (ReaderB) directly
```

### Animations

Use `framer-motion`. Spec:
- **Card hover:** scale 1 → 1.04, 180ms, easeOut. Reveal hover actions with opacity 0 → 1 in 120ms.
- **Detail page enter:** the cover that was clicked becomes the hero cover via `layoutId` shared-element transition (~280ms easeOut).
- **Metadata modal:** scale 0.96 → 1, opacity 0 → 1, 180ms. Backdrop opacity 0 → 0.55.
- **Reader open:** slide up from bottom + fade backdrop, 260ms.
- All durations should respect `prefers-reduced-motion`.

### Loading & error states

- Shelf row loading: skeleton placeholders the size of the card grid (do not bounce in)
- Cover not yet cached: show the title text on a flat color tile until the image resolves (`/api/books/{id}/cover`)
- API error: toast at top-right; never block the UI; reading-progress save errors fail silently and retry on next page turn (per design doc §15)
- File-not-found: render the card with a warning glyph and a "Relink…" affordance on the detail page (out of scope for this handoff package — flagged for the next pass)

## State Management

```ts
// Zustand store (UI)
{
  currentBookId: string | null,         // viewing detail
  readerOpen: boolean,
  metadataModalOpen: boolean,
  metadataModalFocus: 'form' | 'search',
  tweaks?: never                         // production app does not expose wireframe tweaks
}

// TanStack Query keys
['shelves']
['book', id]
['progress', id]
['metadata-search', title, author]
['epub-spine', id]
```

Progress writes from the reader bypass the query cache and go straight through `fetch` (debounced 2s + final flush on unmount).

## Design Tokens

The wireframes hint at — but do **not commit to** — the final visual language. Establish these as CSS custom properties early:

### Colors (placeholder values — finalize in design pass 2)

| Token | Dark mode | Light mode |
|---|---|---|
| `--bg-canvas` | `#0c0c10` | `#faf8f3` |
| `--bg-surface` | `#15151b` | `#fdfaf3` |
| `--fg-default` | `#e8e6df` | `#1a1a1f` |
| `--fg-muted` | `rgba(232,230,223,0.55)` | `rgba(26,26,31,0.55)` |
| `--border-default` | `rgba(232,230,223,0.2)` | `rgba(26,26,31,0.15)` |
| `--accent` | `#c96442` | `#c96442` |
| `--accent-tint` | `rgba(201,100,66,0.12)` | `rgba(201,100,66,0.08)` |
| `--progress-track` | `rgba(232,230,223,0.18)` | `rgba(26,26,31,0.15)` |

Default the app to **dark mode**; expose a light toggle in settings later.

### Spacing scale

`4 · 6 · 8 · 10 · 14 · 18 · 22 · 26 · 36 · 50` (in px). Use rems if your stack prefers — match these visual ratios.

### Radius

- Buttons / pills: `999px`
- Cards / covers: `4px`
- Modal: `12px`
- Inputs: `6px`

### Type scale (placeholder — pick real fonts in design pass 2)

Suggested pairing for implementation:
- **UI:** Inter (400 / 500 / 600 / 700)
- **Display (titles, hero):** a refined serif or grotesque display — Source Serif 4, Fraunces (light/regular), or Söhne Breit if licensed
- **Reader body:** Source Serif 4 / Iowan Old Style / Georgia
- **Mono (file paths, ISBN):** JetBrains Mono / SF Mono

Sizes (UI): 11 (eyebrow) · 13 (small) · 14 (body) · 18 (subhead) · 22 (shelf header) · 28 (modal title) · 36 (hero subtitle) · 56 (hero title)

### Cover card sizes

- S: 88×132 (~2:3) · gap 14
- **M: 110×165** ← default · gap 16
- L: 132×198 · gap 20

### Progress bar

Height 4px · radius 2px · fill = `--accent` · track = `--progress-track`

## Assets

- **EPUB covers** — extracted by `EpubParser.ExtractCoverAsync()` on import OR fetched from Open Library / Google Books on user request. Served at `/api/books/{id}/cover`. Resize on the C# side to 400×600 JPEG 85% (per design doc §12).
- **Icons** — use `lucide-react` or `phosphor-react` for chevrons, search, filter, sort, plus, close, more, edit, download, play, etc. The wireframes use unicode glyphs as placeholders (`›` `⌕` `✕` `▶` `✎` `⤓` `⋯`); swap for real SVG icons.
- **No bespoke imagery** is required. Logo / wordmark is text-only for MVP (`Libris` in the display serif).

## Files in this Handoff

```
design_handoff_libris_mvp/
├── README.md                          ← this file
├── Libris_Design_Document.md          ← original product/architecture spec
└── wireframes/
    ├── index.html                     ← open this; pan/zoom canvas of all 4 screens
    ├── app.jsx                        ← canvas + tweaks panel composition
    ├── library.jsx                    ← Library (the locked variant is LibraryA)
    ├── detail.jsx                     ← Detail (locked: DetailB — full-page cinematic)
    ├── metadata.jsx                   ← Metadata editor (locked: MetadataB — split modal)
    ├── reader.jsx                     ← Reader (locked: ReaderB — scroll + orb)
    ├── primitives.jsx                 ← Shared sketchy primitives (SkCover, SkTopBar, SkCallout)
    ├── design-canvas.jsx              ← Pan/zoom canvas host (not part of the app)
    └── tweaks-panel.jsx               ← Wireframe tweaks panel (not part of the app)
```

**Components named `LibraryA`, `DetailB`, `MetadataB`, `ReaderB` are the chosen variants.** The `library.jsx` / `detail.jsx` files also contain `LibraryB` / `DetailA` / `MetadataA` / `ReaderA` for context, but ignore those — they were rejected directions.

## Out of Scope (next handoff pass)

- Empty / first-import state
- Search results page (when the search field actually has a query)
- File-not-found / relink dialog
- Settings (theme, font, reader prefs)
- Keyboard shortcuts overlay
- Reading-statistics view (post-MVP per design doc §14.3)

---

*Ship the MVP loop first: Import → Browse → Open Detail → Read → Close → Reopen at same position. Everything else comes after.*
