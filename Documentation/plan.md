# Libris — Implementation Plan

## Overview

Build Libris in 14 sequential phases following the design document's recommended build order. Each phase produces a vertical slice that is testable before the next phase begins. The MVP goal is a complete end-to-end loop: **Import EPUB → Browse library → Open reader → Read → Close → Reopen at same position**.

---

## Phase 1 — Solution Setup

Create the .NET solution with all six C# projects and one React app.

**Projects to create:**
- `Libris.Core` — class library, no framework dependencies
- `Libris.Storage` — class library, EF Core + SQLite
- `Libris.Epub` — class library, VersOne.Epub
- `Libris.Metadata` — class library, HttpClient
- `Libris.Api` — ASP.NET Core Web API (no host, just controllers + services)
- `Libris.Desktop` — WPF (`net10.0-windows`), startup project
- `Libris.Core.Tests`, `Libris.Storage.Tests`, `Libris.Epub.Tests` — xUnit test projects
- `ui/libris-ui` — Vite + React + TypeScript

**Configuration:**
- Enable `<Nullable>enable</Nullable>` and `<ImplicitUsings>enable</ImplicitUsings>` across all C# projects
- Add `.editorconfig` with Roslyn analyzer rules
- Install EF Core tools globally (`dotnet tool install --global dotnet-ef`)
- Configure the React build to output to `src/Libris.Desktop/wwwroot/`

---

## Phase 2 — Domain Models

Implement all types in `Libris.Core`. No external dependencies.

**Types:**
- `EpubBook` — aggregate root; `Id`, `FilePath`, `FileFound`, `Metadata`, `Progress`, `ImportedUtc`, `LastModifiedUtc`
- `BookMetadata` — title, authors, series, genres, publisher, description, ISBN, language, cover path
- `ReadingProgress` — status, CFI, percentage, timestamps, total reading minutes
- `ReadingStatus` enum — `NotStarted`, `Reading`, `Finished`
- `SpineItem` — lightweight DTO for epub.js spine construction
- `ExternalBookMetadata` — neutral DTO for provider results
- `EpubResourceResult` — bytes + MIME type for resource streaming

**Interfaces:**
- `ILibraryRepository`
- `IReadingProgressRepository`
- `IEpubParser`
- `IMetadataProvider`
- `IShellService`
- `ICoverCacheManager`

---

## Phase 3 — Database Setup

Implement `Libris.Storage`: EF Core context, entity types, entity configurations, repository implementations, and EF Core migration.

**Entity types** (separate from domain models in Core):
- `EpubBookEntity` — flat columns; `AuthorsJson` and `GenresJson` stored as JSON strings
- `ReadingProgressEntity` — FK to `EpubBookEntity`

**Repositories:**
- `LibraryRepository : ILibraryRepository` — maps between entity and domain types
- `ReadingProgressRepository : IReadingProgressRepository`

**Cover cache:**
- `CoverCacheManager : ICoverCacheManager` — writes JPEGs to `%AppData%\Libris\covers\{id}.jpg`, resizes to 400×600 at 85% JPEG quality

**Infrastructure:**
- `LibrisDataPaths` — resolves `%AppData%\Libris\` paths for database and covers directory
- Create and apply the initial EF Core migration

---

## Phase 4 — EPUB Parser

Implement `Libris.Epub` wrapping `VersOne.Epub`.

**`EpubParser : IEpubParser`:**
- `ExtractMetadataAsync` — reads OPF metadata (title, authors, series via custom OPF tags, ISBN, language, publisher, published date, description)
- `ExtractCoverAsync` — locates the cover image in the EPUB manifest, returns raw bytes
- `GetResourceAsync` — opens the EPUB ZIP, locates the resource by path, returns bytes + MIME type
- `GetSpineAsync` — returns ordered `SpineItem` list for epub.js

**MIME type mapping** — maps `VersOne.Epub` content type enum to HTTP MIME strings.

---

## Phase 5 — Storage Tests

Write tests in `Libris.Storage.Tests` and `Libris.Epub.Tests` using real SQLite (in-memory or temp file) and real EPUB fixture files.

**Coverage targets:**
- Repository CRUD round-trips (add, get, update, remove)
- JSON serialization of Authors/Genres columns
- `ReadingProgressRepository` save and load
- `EpubParser` metadata extraction against 2–3 known EPUB fixture files
- `EpubParser` cover extraction
- `EpubParser` resource serving (verify bytes and MIME type)

---

## Phase 6 — WPF Shell + WebView2

Implement `Libris.Desktop`: application entry point, Kestrel in-process bootstrap, WPF main window with WebView2.

**Key pieces:**
- `App.xaml.cs` — `OnStartup` picks an available port, calls `BuildApi()`, starts Kestrel, shows `MainWindow`
- `BuildApi()` — registers all services, configures EF Core SQLite, static files, fallback to `index.html`
- `MainWindow.xaml` — single `WebView2` control filling the window
- WebView2 navigates to `http://localhost:5173` in Debug, `http://localhost:{port}` in Release
- `WpfShellService : IShellService` — marshals file/folder dialogs to the STA WPF thread via `Dispatcher.InvokeAsync`
- Window state (size, position, maximized) persisted to `settings.json` on close and restored on open

At the end of this phase the shell loads and WebView2 shows the Vite default page in dev mode.

---

## Phase 7 — React Scaffold

Initialize `ui/libris-ui` with the full dependency set.

**Install:**
- `react`, `react-dom`, TypeScript, Vite
- `@tanstack/react-query`
- `zustand`
- `framer-motion`
- `epubjs`

**Configure Vite proxy:** forward `/api/*` to `http://localhost:{kestrelPort}` during development.

**Scaffold:**
- API client layer (`src/api/`) — typed `fetch` wrappers for every endpoint group
- Zustand store (`src/store/`) — `openBookId`, `readerVisible`, `activeShelf`
- TanStack Query client setup with global error handler
- React Router or simple view-state routing (library view vs. reader view)
- Basic layout shell: top bar placeholder, shelf scroll area placeholder

At the end of this phase `npm run dev` serves the app and `/api/library/books` returns `[]` from Kestrel.

---

## Phase 8 — Library API

Wire up import, list, and remove book operations.

**Controllers:**
- `LibraryController` — `GET /api/library/books`, `POST /api/library/import`, `POST /api/library/import-folder`, `DELETE /api/library/books/{id}`
- `BooksController` — `GET /api/books/{id}`, `PUT /api/books/{id}/metadata`, `GET /api/books/{id}/cover`, `PUT /api/books/{id}/cover`
- `ShellController` — `POST /api/shell/open-file-dialog`, `POST /api/shell/open-folder-dialog`

**Application service — `LibraryService`:**
- `ImportAsync(string filePath)` — validates file exists, calls `EpubParser`, extracts cover, saves to DB
- `ImportFolderAsync(string folderPath)` — scans recursively for `.epub` files, calls `ImportAsync` per file, skips duplicates by path
- `RemoveAsync(Guid id)` — deletes DB record (never touches the file)

**DTOs:** `BookSummaryDto`, `BookDetailDto`, `ImportResultDto` — mapped in service, not controller.

---

## Phase 9 — Library UI

Build the Netflix-style shelf interface in React.

**Components:**
- `ShelfList` — vertical scroll container of `ShelfRow` components
- `ShelfRow` — label + horizontal scroll of `BookCard` components; shows scroll arrows when overflow
- `BookCard` — cover image, title, author, progress bar (if reading), Finished badge; framer-motion scale-up on hover; quick-action overlay; double-click opens reader
- `BookDetailPanel` — slide-in right panel; full cover, metadata, action buttons (Read, Edit Metadata, Fetch Metadata, Remove)
- `TopBar` — search input, Filter dropdown, Sort dropdown, Import button

**Data fetching:** `GET /api/shelves` via TanStack Query, invalidate on import/remove.

**Cover display:** `<img src="/api/books/{id}/cover" />` — no file paths in frontend.

At the end of this phase the library is browsable with real imported EPUBs.

---

## Phase 10 — EPUB Reader

Integrate epub.js into a full-screen reader overlay.

**Controller:**
- `EpubController` — `GET /api/epub/{id}/spine`, `GET /api/epub/{id}/content/{**path}`

**React component — `EpubReader`:**
- Mounts epub.js `Book` with base URL `/api/epub/{id}/content/`
- Renders epub.js `Rendition` into a `<div>` ref
- Previous/Next page buttons call `rendition.prev()` / `rendition.next()`
- Table of contents sidebar toggle (populated from epub.js `book.navigation`)
- Font size controls adjust `rendition.themes.fontSize()`
- Reader chrome: TOC button, title + chapter name, font size, close button
- Progress bar at bottom derived from `rendition.currentLocation()`

The reader overlay slides in over the library view; closing it returns to the library.

At the end of this phase double-clicking a book opens and renders it correctly.

---

## Phase 11 — Progress Persistence

Implement CFI save/load and the Continue Reading shelf.

**Controller:** `ProgressController` — `GET /api/books/{id}/progress`, `PUT /api/books/{id}/progress`

**Application service — `ReadingProgressService`:**
- `GetProgressAsync(Guid id)` — returns current progress DTO
- `SaveProgressAsync(Guid id, string cfi, double percentage)` — upserts progress, sets `Status = Reading`, updates `LastReadUtc`

**React reader integration (three save points):**
1. `locationChanged` event — debounced PUT at 2-second intervals
2. Close button handler — immediate PUT before hiding overlay
3. `beforeunload` — synchronous `fetch` as last resort

**On reader open:** fetch progress, call `rendition.display(cfi)` before first render if CFI exists.

**`ShelfService`:** build `continue-reading` shelf — all books with `Status = Reading`, sorted by `LastReadUtc` descending.

At the end of this phase reopening a book resumes at the exact last position.

---

## Phase 12 — Metadata Editor

Build the metadata edit form and external API fetch flow.

**Controllers:**
- `MetadataController` — `POST /api/books/{id}/metadata/fetch`, `POST /api/metadata/search`

**`Libris.Metadata` providers:**
- `OpenLibraryMetadataProvider : IMetadataProvider`
- `GoogleBooksMetadataProvider : IMetadataProvider`

**Application service — `MetadataService`:**
- `SearchAsync(string title, string? author)` — queries both providers in parallel, merges and ranks results
- `FetchAndApplyAsync(Guid bookId, ExternalBookMetadata selected)` — merges non-empty fields into local metadata, downloads and caches cover if URL present

**React components:**
- `MetadataEditor` modal — editable fields with tag inputs for Authors and Genres
- `MetadataSearchPanel` sub-panel — search results list, select to populate fields
- User can accept or discard individual fields before saving

---

## Phase 13 — Native Shell Endpoints

Wire up file/folder dialogs and Reveal in Explorer.

**`ShellController`:**
- `POST /api/shell/open-file-dialog` — returns selected `.epub` file paths
- `POST /api/shell/open-folder-dialog` — returns selected folder path
- `POST /api/shell/reveal` — calls `Process.Start("explorer.exe", "/select,{path}")`

**`WpfShellService`:** all three methods use `Dispatcher.InvokeAsync` to run on the STA WPF thread.

**React Import button:** calls `open-file-dialog`, then `POST /api/library/import` for each returned path.

---

## Phase 14 — MVP Polish

Final hardening to complete the MVP acceptance criteria.

**File-not-found detection:**
- On startup, `LibraryService.ScanForMissingFilesAsync()` checks each stored path; sets `FileFound = false` for any that have moved
- `BookCard` and `BookDetailPanel` show a warning indicator for missing-file books
- "Relink" opens a file dialog; updating the path clears the warning

**Error handling:**
- All API errors return `{ "error": { "code": "...", "message": "..." } }`
- React global error handler displays toast notifications
- epub.js parse errors, metadata fetch failures, and cover download failures fail independently

**Keyboard shortcuts:**
- `Escape` closes the reader overlay and detail panel
- `←` / `→` navigate pages in the reader
- `Ctrl+I` or toolbar button opens the import file dialog

**Window state persistence:** save/restore window bounds, maximized state via `settings.json`.

**Performance:**
- Cover images lazy-loaded with `loading="lazy"` or IntersectionObserver
- Shelf data cached by TanStack Query; stale-while-revalidate on focus

---

## Dependency Graph

```
Libris.Core
    ↑
Libris.Storage    Libris.Epub    Libris.Metadata
    ↑                  ↑               ↑
              Libris.Api
                  ↑
            Libris.Desktop
                  ↑
             libris-ui (React)
```

`Libris.Core` has zero external dependencies. All other C# projects depend on Core. `Libris.Api` depends on Storage, Epub, and Metadata. `Libris.Desktop` depends on Api and owns the startup entry point.

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| In-process hosting | Kestrel inside WPF process | No IPC, single process, same-origin fetch |
| EPUB resource serving | `/api/epub/{id}/content/{**path}` | Keeps reader origin-consistent, avoids `file://` in WebView2 |
| Progress persistence | EPUB CFI strings | W3C standard, epub.js native format, opaque tokens never manually parsed |
| Cover storage | `%AppData%\Libris\covers\{id}.jpg` | Consistent resolution, all serving through API endpoint |
| State management split | TanStack Query (server state) + Zustand (UI state) | Clean separation of concerns |
| Entity/domain split | EF entities in Storage, domain models in Core | Prevents ORM concerns leaking into business logic |
