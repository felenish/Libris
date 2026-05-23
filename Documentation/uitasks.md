# UI Tasks â€” Libris MVP UX Alignment

Tracks the delta between the implemented UI and the design spec (`UIREADME.md` / wireframes `LibraryA`, `DetailB`, `MetadataB`, `ReaderB`).

Work bottom-up: design tokens first, then components, then interactions.

---

## 1. Design Tokens & Global Styles (`index.css`)

The current CSS uses a purple accent and different background values. Replace with the spec palette and add missing tokens.

- [x] **1a â€” Accent color**: Change `--accent` from `#7c6af7` to `#c96442` (terracotta). Update `--accent-hover` to a lightened variant (e.g. `#d97450`). Remove `--accent-tint` workaround; add `--accent-tint: rgba(201,100,66,0.12)`.
- [x] **1b â€” Background tokens**: Rename / add to match spec:
  - `--bg-canvas: #0c0c10` (was `--bg: #0f0f13`)
  - `--bg-surface: #15151b` (was `--surface: #1a1a22`)
  - `--fg-default: #e8e6df` (was `--text: #e2e2ea`)
  - `--fg-muted: rgba(232,230,223,0.55)` (was `--text-muted: #7c7c9a`)
  - `--border-default: rgba(232,230,223,0.20)` (was `--border: #2e2e3e`)
  - `--progress-track: rgba(232,230,223,0.18)`
- [x] **1c â€” Font stack**: Set `font-family: 'Inter', system-ui, sans-serif` on `:root`. Load Inter via `@import` from Google Fonts or bundle it. Reader body will use `'Source Serif 4', Georgia, serif` (applied locally in `EpubReader`).
- [x] **1d â€” Radius tokens**: Update border-radius values across all existing rules:
  - Buttons / pills â†’ `border-radius: 999px`
  - Book cards / covers â†’ `border-radius: 4px`
  - Modals â†’ `border-radius: 12px`
  - Inputs â†’ `border-radius: 6px`
- [x] **1e â€” Progress bar spec**: Height 4px (currently 2px on `.book-progress-track`), fill = `--accent`, track = `--progress-track`.

---

## 2. Book Card (`BookCard.tsx` + card CSS)

Target: pure cover card, no text below, progress bar directly under cover, hover reveals â–¶ Read + âœŽ Edit.

- [x] **2a â€” Card size**: Change from `130Ã—195` to `110Ã—165` (M default). Update `.book-card` width and `.book-cover-wrap` dimensions.
- [x] **2b â€” Remove text below cover**: Delete `.book-title` and `.book-author` from the JSX and CSS. The card is cover-only.
- [x] **2c â€” Progress bar position**: Move progress bar from below the title text to directly underneath the cover image (inside `.book-cover-wrap` but below the `<img>`, outside the cover border-radius). Show only when `book.readingStatus === 'Reading'` **or** `book.percentage > 0`.
- [x] **2d â€” Hover overlay redesign**: Replace "Details" / "Open Reader" buttons with:
  - A slim action row overlaid at the bottom of the cover with `backdrop-filter: blur(6px)` + semi-transparent dark bg.
  - Two buttons: `â–¶ Read` (opens reader) and `âœŽ Edit` (opens detail/metadata). Use Lucide icons (`Play`, `Pencil`).
  - Single-click on cover â†’ detail. Double-click â†’ reader. Overlay buttons are secondary affordances.
- [x] **2e â€” Hover scale**: Change `whileHover={{ scale: 1.05 }}` to `1.04`, duration 180ms easeOut. Overlay opacity 0â†’1 in 120ms.
- [x] **2f â€” Shelf row fade**: Add a right-edge fade gradient (linear-gradient to `--bg-canvas`) as a pseudo-element or sibling div at the end of `.shelf-scroll`, to signal horizontal scrollability.

---

## 3. TopBar (`TopBar.tsx` + CSS)

- [x] **3a â€” Search pill shape**: Change search input to pill-shaped (`border-radius: 999px`), `flex: 1`, max-width ~480px. Add search icon (Lucide `Search`) inside.
- [x] **3b â€” Filter / Sort chips**: Add `Filter â–¾` and `Sort â–¾` pill-shaped buttons (outline style) between search and Import. These are non-functional stubs for MVP but must be present in the layout.
- [x] **3c â€” Import button style**: Change from filled button to outline button (`border: 1.4px solid --fg-default`, transparent bg, text color `--fg-default`). Use Lucide `Plus` icon.
- [x] **3d â€” Wordmark**: Render `Libris` in the display/serif font (or Inter 700 at 20px with tight letter-spacing) rather than `system-ui`. Place on the far left before the search field.

---

## 4. Shelf Row (`ShelfRow.tsx` + CSS)

- [x] **4a â€” Header font size**: Increase shelf label from 16px to 22px, weight 600 (spec: 22â€“24px).
- [x] **4b â€” Chevron buttons**: The current scroll buttons are positioned outside the row. Move them to a header row `display:flex; justify-content:space-between` â€” label left, `â€¹ â€º` right â€” matching the wireframe.
- [x] **4c â€” Scroll behavior**: Shelves already use `overflow-x: auto`. Ensure `scroll-snap-type` works for the new 110px card size (adjust snap by card width).
- [x] **4d â€” Padding**: Update shelf area padding to `22px 26px 30px` per the wireframe.

---

## 5. Book Detail â€” Full-Page (`BookDetailPanel.tsx`)

**Major rework.** The current component is a 340px slide-in panel (`DetailA`). The spec requires a full-page cinematic layout (`DetailB`).

- [x] **5a â€” Navigation**: Replace the right-side panel with a full-page `<main>`. Add a compact top strip:
  - Left: `â† Library` pill-chip button that calls `onClose` (navigates back).
  - Center: `Libris` wordmark.
  - Right: `â‹¯ More` pill-chip (placeholder for popover; wire up Remove from Library action here).
- [x] **5b â€” Hero section**: Layout is `display: flex; gap: 36px; padding: 36px 50px 26px`:
  - Left: cover image 200Ã—300, `border-radius: 4px`.
  - Right column (flex 1):
    - Eyebrow: series name + "Book N of M" (11px uppercase, letter-spacing 1.8, opacity 0.6). Only show if `book.seriesName` is set.
    - Title: 56px, line-height 1.0, font-weight 700.
    - Author: 18px, opacity 0.8.
    - Pills row: genres + published year + page count (if available), gap 6px, pill shape.
    - Description: 14px, line-height 1.55, max-width 540px, opacity 0.88.
    - Action row: `â–¶ Continue reading` (filled accent, primary) Â· `âœŽ Edit metadata` (outline) Â· `â¤“ Fetch info` (outline) Â· right-aligned whisper `{pct}% Â· {timeAgo}`.
    - Progress bar 4px directly under the action row, max-width 460px.
- [x] **5c â€” Cinematic gradient**: Add `background: radial-gradient(circle at 20% 30%, rgba(201,100,66,0.18), transparent 60%)` to the hero section wrapper.
- [x] **5d â€” "More in this series" row**: Below the hero, if `book.seriesName` is set, render a horizontal scroller of other books in the same series (92Ã—138 covers, labelled `N of M`). Query the shelves data for books sharing the same series.
- [x] **5e â€” Shared-element transition**: Add `layoutId={`cover-${book.id}`}` to the `<motion.img>` in `BookCard` and the hero cover in `BookDetailPanel`, so framer-motion animates the cover from card position to hero position (~280ms easeOut).
- [x] **5f â€” Animation**: Detail page enters as full-page overlay. Animate with `AnimatePresence` + `motion.div` sliding from below or fading in, 280ms. Update `App.tsx` to treat the detail view as a page-level overlay (stack over library) rather than a side panel.

---

## 6. EPUB Reader â€” ReaderB (`EpubReader.tsx`)

**Major rework.** Current: top chrome bar + side nav buttons + bottom progress bar. Target: floating "âœ• Close" pill + floating progress orb + scrolled flow.

- [x] **6a â€” Switch to scrolled flow**: Change epub.js rendition options from pagination to `flow: 'scrolled'`. Remove `spread: 'none'` and adjust width/height to fill the column.
- [x] **6b â€” Remove top chrome bar**: Delete `.reader-chrome` and its contents. Remove side nav buttons (`.reader-nav`). The reading area should now be a centered 540px column, full-height.
- [x] **6c â€” Floating "âœ• Close" pill**: Add `position: fixed; top: 14px; right: 18px; z-index: 5` pill button (`border-radius: 999px`, `border: 1.4px solid --fg-default`, backdrop-blur bg). Clicking it calls `handleClose`.
- [x] **6d â€” Floating progress orb**: `position: fixed; bottom: 20px; right: 20px; width: 64px; height: 64px; border-radius: 50%`. Contents:
  - SVG ring: dashed muted track circle + solid accent arc (stroke-dasharray computed from `progress` percentage, `strokeLinecap: round`). `r=28`, rotated -90Â°.
  - Center text: percentage (`17px`, bold) + page label (`9px`, 60% opacity).
  - Clicking the orb opens a small popover with: TOC list, font-size slider. (TOC already implemented â€” repurpose `reader-toc` logic; font-size already implemented â€” move to popover.)
- [x] **6e â€” Bottom-center whisper**: `position: fixed; bottom: 14px; left: 0; right: 0; text-align: center` in 11px muted text: `{bookTitle} Â· {currentChapter}`.
- [x] **6f â€” Reader column styling**: Content area `max-width: 540px; margin: 0 auto; padding: 70px 0 60px`. Inject serif font + line-height 1.7 + muted color into the epub.js rendition via `rendition.themes.register`.
- [x] **6g â€” Animation update**: Change reader entry animation from `opacity 0â†’1` to slide-up from bottom + fade: `y: '100%' â†’ 0` + `opacity 0â†’1`, 260ms. Backdrop dims to 40% if library is visible behind.

---

## 7. Metadata Editor â€” MetadataB (`MetadataEditor.tsx`)

**Moderate rework.** Current: single-column ~560px modal with collapsed search section. Target: 880px split modal with always-visible search pane.

- [x] **7a â€” Modal size**: Change `max-width: 560px` to `width: 880px; max-width: 95vw; height: 90vh`. Update `.editor-modal` radius to `12px`.
- [x] **7b â€” Split layout**: Change `.editor-modal` from `flex-direction: column` to `flex-direction: row`. Left pane (`flex: 1`, padding 22px, `overflow-y: auto`) holds the form. Right pane (`width: 340px`, border-left `1.4px solid --border-default`) holds the search panel.
- [x] **7c â€” Left pane**: Keep existing form fields. Remove the "Search metadataâ€¦" button from the footer (it moves to the right pane). Simplify footer to just Cancel + Save.
- [x] **7d â€” Right pane â€” search UI**:
  - Eyebrow label `SEARCH METADATA` (11px uppercase).
  - Pill search bar pre-filled with `"{title} Â· {author}"`. Trigger search on mount if `focusSearch` prop is set.
  - Provider toggle pills: `Open Library âœ“` and `Google Books âœ“` (both active by default, clicking toggles).
  - Result count + note (`4 results Â· ranked by match`) after search completes.
  - Scrollable list of result cards (see 7e).
  - Sticky bottom: filled accent `Apply selected â†’` button. Disabled when no result selected.
- [x] **7e â€” Result cards**: Each card shows:
  - Small cover thumbnail 36Ã—54 (use `result.coverUrl` if available, else flat tile).
  - Title (13px bold) + Author Â· Year (11px, 70% opacity).
  - Source pill (`Open Library` / `Google Books`) + match-quality pill (`ISBN` / `Title+Author` / `Title`) with accent border.
  - Selected state: solid `--accent` border + `--accent-tint` background.
  - Remove the current "field checks / checkbox" mechanism. Selecting a result populates all form fields immediately.
- [x] **7f â€” "Fetch info" flow**: When `BookDetailPanel` calls `onEditMetadata` with a `focusSearch: true` flag (triggered by the "â¤“ Fetch info" button), auto-trigger the search on modal open. Add `focusSearch?: boolean` prop to `MetadataEditor` and pass it from `BookDetailPanel`.
- [x] **7g â€” Unsaved-changes guard**: On backdrop click or Esc, if the form is dirty (differs from initial `book` data), show a confirm dialog before closing.

---

## 8. App-Level Navigation (`App.tsx`)

- [x] **8a â€” Detail as page overlay**: The book detail is now full-page, not a side panel. In `App.tsx`, render `BookDetailPanel` as a full-screen overlay with `position: fixed; inset: 0; z-index: 100` and animate with `AnimatePresence`.
- [x] **8b â€” State cleanup**: Rename `selectedBookId` â†’ `detailBookId` for clarity. Ensure that opening the reader from the detail page does not close the detail (so closing the reader returns to detail).
- [x] **8c â€” Keyboard shortcuts**: Wire `Escape` key to close the reader (already partially done via `handleClose`), the detail overlay, and the metadata modal. Each layer should consume the event so only the topmost layer closes.

---

## 9. Icons

Replace all unicode glyph placeholders with Lucide React icons throughout.

- [x] **9a** â€” Install `lucide-react` if not already present: `npm install lucide-react`.
- [x] **9b** â€” Replace glyphs: `â–¶` â†’ `<Play>`, `âœŽ` â†’ `<Pencil>`, `â¤“` â†’ `<Download>`, `âœ•` â†’ `<X>`, `â€¹â€º` â†’ `<ChevronLeft>` / `<ChevronRight>`, `â‹¯` â†’ `<MoreHorizontal>`, `âŒ•` â†’ `<Search>`, `+` â†’ `<Plus>`.

---

## 10. Reduced-Motion Support

- [x] **10a** â€” Wrap all framer-motion `transition` durations with a helper that returns `0` when `prefers-reduced-motion: reduce` is set. Or use `useReducedMotion()` from framer-motion and set all durations to 0 conditionally.

---

## 11. Loading & Error States

- [x] **11a â€” Skeleton cards**: When shelf data is loading, render skeleton placeholders at `110Ã—165` (same size as M cards). No bounce animation â€” use a subtle shimmer or just a flat `--bg-surface` tile.
- [x] **11b â€” Cover fallback**: When cover image 404s, show the book title centered on a flat `--bg-surface` tile (currently the image just hides). Use the `onError` handler already in `BookCard` to swap to a fallback `<div>` with the title.

---

## Priority Order

1. **1 (design tokens)** â€” unblocks everything visually
2. **9a (Lucide install)**
3. **2 (book card)** â€” most visible component
4. **3 + 4 (topbar + shelf)**
5. **5 (detail page)** â€” largest structural change
6. **6 (reader)** â€” second-largest rework
7. **7 (metadata editor)**
8. **8 (app nav)**
9. **10 + 11 (polish)**
