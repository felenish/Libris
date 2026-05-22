# Libris — Task List

> Status key: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 1 — Solution Setup

- [ ] Create `Libris.sln` and directory structure (`src/`, `ui/`, `tests/`)
- [ ] Create `Libris.Core` class library (`net10.0`)
- [ ] Create `Libris.Storage` class library (`net10.0`)
- [ ] Create `Libris.Epub` class library (`net10.0`)
- [ ] Create `Libris.Metadata` class library (`net10.0`)
- [ ] Create `Libris.Api` ASP.NET Core Web API project (`net10.0`)
- [ ] Create `Libris.Desktop` WPF project (`net10.0-windows`)
- [ ] Create `Libris.Core.Tests` xUnit project
- [ ] Create `Libris.Storage.Tests` xUnit project
- [ ] Create `Libris.Epub.Tests` xUnit project
- [ ] Add project references: Storage/Epub/Metadata/Api → Core; Api → Storage + Epub + Metadata; Desktop → Api
- [ ] Enable `<Nullable>enable</Nullable>` and `<ImplicitUsings>enable</ImplicitUsings>` in all C# projects
- [ ] Add `.editorconfig` with Roslyn analyzer rules
- [ ] Install `Microsoft.EntityFrameworkCore.Sqlite` + `Microsoft.EntityFrameworkCore.Design` in Storage
- [ ] Install `VersOne.Epub` NuGet package in Libris.Epub
- [ ] Install `Microsoft.AspNetCore.OpenApi` and `Swashbuckle.AspNetCore` in Libris.Api
- [ ] Install `Microsoft.Web.WebView2` in Libris.Desktop
- [ ] Install `dotnet-ef` global tool
- [ ] Scaffold `ui/libris-ui` with `npm create vite@latest` (React + TypeScript)
- [ ] Configure Vite `build.outDir` to `../../src/Libris.Desktop/wwwroot`
- [ ] Verify solution builds clean with no warnings

---

## Phase 2 — Domain Models

- [ ] Implement `EpubBook` sealed class in `Libris.Core`
- [ ] Implement `BookMetadata` sealed class
- [ ] Implement `ReadingProgress` sealed class
- [ ] Implement `ReadingStatus` enum (`NotStarted`, `Reading`, `Finished`)
- [ ] Implement `SpineItem` record/DTO
- [ ] Implement `ExternalBookMetadata` DTO
- [ ] Implement `EpubResourceResult` record (`Content`, `MediaType`)
- [ ] Define `ILibraryRepository` interface
- [ ] Define `IReadingProgressRepository` interface
- [ ] Define `IEpubParser` interface
- [ ] Define `IMetadataProvider` interface
- [ ] Define `IShellService` interface (`OpenFileDialogAsync`, `OpenFolderDialogAsync`, `RevealInExplorerAsync`)
- [ ] Define `ICoverCacheManager` interface (`SaveCoverAsync`, `GetCoverPathAsync`, `DeleteCoverAsync`)
- [ ] Verify `Libris.Core` has zero non-system dependencies

---

## Phase 3 — Database Setup

- [ ] Create `EpubBookEntity` EF entity class in `Libris.Storage`
- [ ] Create `ReadingProgressEntity` EF entity class
- [ ] Implement `LibrisDbContext : DbContext` with `DbSet<EpubBookEntity>` and `DbSet<ReadingProgressEntity>`
- [ ] Add `IEntityTypeConfiguration<EpubBookEntity>` — configure PK, column types, `AuthorsJson`, `GenresJson`
- [ ] Add `IEntityTypeConfiguration<ReadingProgressEntity>` — configure FK, cascade delete
- [ ] Create `LibrisDataPaths` static class — resolves `%AppData%\Libris\` database and covers paths
- [ ] Ensure data directory and covers subdirectory are created on first access
- [ ] Implement `LibraryRepository : ILibraryRepository` — maps between entity and domain; all methods async
- [ ] Implement `ReadingProgressRepository : IReadingProgressRepository` — upsert on `SaveProgressAsync`
- [ ] Implement `CoverCacheManager : ICoverCacheManager` — write JPEG, resize to 400×600 at 85% quality
- [ ] Add `SixLabors.ImageSharp` NuGet for cover resizing
- [ ] Create initial EF Core migration (`InitialCreate`)
- [ ] Apply migration programmatically on startup (`context.Database.MigrateAsync()`)
- [ ] Write `LibrisDataPaths` unit test

---

## Phase 4 — EPUB Parser

- [ ] Implement `EpubParser : IEpubParser` in `Libris.Epub`
- [ ] `ExtractMetadataAsync` — map OPF title, authors, ISBN, language, publisher, published date, description; extract series via Calibre custom OPF tags if present
- [ ] `ExtractCoverAsync` — locate cover image in EPUB manifest, return raw bytes; return `null` if not found
- [ ] `GetResourceAsync` — open EPUB ZIP, locate resource by path, return bytes + MIME type
- [ ] `GetSpineAsync` — return ordered `SpineItem` list (href, media type, title)
- [ ] Implement `ContentTypeExtensions.ToMimeString()` — maps `VersOne.Epub` enum to MIME type strings
- [ ] Handle EPUB files with no cover gracefully (return `null`)
- [ ] Handle malformed OPF metadata without throwing (return empty/default values)

---

## Phase 5 — Storage Tests

- [ ] Add 2–3 EPUB fixture files to `tests/Libris.Epub.Tests/Fixtures/`
- [ ] `EpubParserTests` — metadata extraction: verify title, authors, ISBN match known fixture values
- [ ] `EpubParserTests` — cover extraction: verify non-null bytes returned for a book with a cover
- [ ] `EpubParserTests` — resource serving: verify correct bytes and MIME type for a known spine item
- [ ] `EpubParserTests` — spine: verify spine order matches expected item count
- [ ] `LibraryRepositoryTests` — add book, get by ID, update metadata, remove, verify not found
- [ ] `LibraryRepositoryTests` — `GetAllBooksAsync` returns all inserted books
- [ ] `ReadingProgressRepositoryTests` — save progress, retrieve, verify CFI and percentage round-trip
- [ ] `ReadingProgressRepositoryTests` — upsert: second save overwrites first
- [ ] `CoverCacheManagerTests` — save raw bytes, verify JPEG file exists at expected path, verify dimensions

---

## Phase 6 — WPF Shell + WebView2

- [ ] Add `App.xaml` and `App.xaml.cs` to `Libris.Desktop`
- [ ] Implement `GetAvailablePort()` — binds to port 0, reads assigned port, releases
- [ ] Implement `BuildApi(int port)` — full DI registration, Kestrel URL, static files, fallback route
- [ ] Register `LibrisDbContext` with SQLite connection string pointing to `LibrisDataPaths.DatabasePath`
- [ ] Register all repositories, services, and providers
- [ ] Call `context.Database.MigrateAsync()` before starting Kestrel
- [ ] Implement `MainWindow.xaml` — single `WebView2` control, `AllowsTransparency=False`, no chrome customization for MVP
- [ ] Implement `MainWindow.xaml.cs` — initialize WebView2, navigate to correct URL based on `#if DEBUG`
- [ ] Implement `WpfShellService : IShellService` — `Dispatcher.InvokeAsync` for all dialog calls
- [ ] `OpenFileDialogAsync` — filter `*.epub`, multi-select enabled
- [ ] `OpenFolderDialogAsync` — folder browser dialog
- [ ] `RevealInExplorerAsync` — `Process.Start("explorer.exe", $"/select,\"{path}\"")`
- [ ] Load and save window state (bounds, `WindowState`) to `settings.json` via `System.Text.Json`
- [ ] `OnExit` — stop Kestrel gracefully with `_api.StopAsync()`
- [ ] Verify WebView2 loads Vite dev server page in debug mode without errors

---

## Phase 7 — React Scaffold

- [ ] Install `@tanstack/react-query` and configure `QueryClient` with default stale time
- [ ] Install `zustand` and create `useLibrisStore` with `openBookId`, `readerVisible`, `activeShelfId`
- [ ] Install `framer-motion`
- [ ] Install `epubjs` and `@types/epubjs`
- [ ] Configure Vite proxy: `/api` → `http://localhost:7070` (or env-var-driven port)
- [ ] Create `src/api/library.ts` — typed wrappers: `getBooks()`, `importBook()`, `importFolder()`, `removeBook()`
- [ ] Create `src/api/books.ts` — `getBook()`, `updateMetadata()`, `getCoverUrl()` (returns URL string, not fetched data)
- [ ] Create `src/api/shelves.ts` — `getShelves()`, `getContinueReading()`
- [ ] Create `src/api/progress.ts` — `getProgress()`, `saveProgress()`
- [ ] Create `src/api/epub.ts` — `getSpine()`, `getResourceUrl()` (returns URL string)
- [ ] Create `src/api/shell.ts` — `openFileDialog()`, `openFolderDialog()`
- [ ] Create `src/api/metadata.ts` — `fetchMetadata()`, `searchMetadata()`
- [ ] Add global error handler in `QueryClient` config — extract `error.code` and display toast
- [ ] Create `src/components/Layout.tsx` — top bar + main scroll area shell
- [ ] Verify `npm run dev` loads and `/api/library/books` returns `[]`

---

## Phase 8 — Library API

- [ ] Create `BookSummaryDto` — id, title, authors, cover URL, series name, series index, reading status, percentage, last read
- [ ] Create `BookDetailDto` — all `BookSummaryDto` fields plus description, genres, publisher, published date, ISBN, language, imported date, file found
- [ ] Create `ImportResultDto` — imported count, skipped count, errors list
- [ ] Create `ShelfDto` and `ShelfListDto`
- [ ] Implement `ShelfService.GetAllShelvesAsync()` — query all books, group into named shelves with correct sort order
- [ ] Implement `ShelfService.GetContinueReadingAsync()` — books with `Status = Reading`, sorted by `LastReadUtc` desc
- [ ] Implement `LibraryService.ImportAsync(string filePath)` — validate, parse, extract cover, save to DB
- [ ] Implement `LibraryService.ImportFolderAsync(string folderPath)` — recursive `.epub` scan, skip duplicates by path
- [ ] Implement `LibraryService.RemoveAsync(Guid id)` — delete record, delete cached cover file
- [ ] Implement `LibraryController` with all four routes
- [ ] Implement `BooksController` with metadata get/update and cover get/put
- [ ] Implement `ShelvesController` — `GET /api/shelves`, `GET /api/shelves/continue-reading`
- [ ] Implement `ShellController` with file dialog and folder dialog endpoints
- [ ] Verify import of a real EPUB returns 200 and the book appears in `GET /api/library/books`

---

## Phase 9 — Library UI

- [ ] Implement `TopBar` component — search input (non-functional for MVP), Import button, placeholder filter/sort dropdowns
- [ ] Import button calls `openFileDialog()` then `importBook()` per returned path; invalidates shelves query on success
- [ ] Implement `BookCard` component — `<img src={coverUrl}>`, title, author, progress bar if reading, Finished badge if finished
- [ ] `BookCard` framer-motion hover: `scale: 1.05` with `whileHover`
- [ ] `BookCard` hover overlay: Edit Metadata button, Open Reader button
- [ ] `BookCard` double-click: set `openBookId` and `readerVisible = true` in Zustand store
- [ ] `BookCard` single-click: set `openBookId` and open `BookDetailPanel`
- [ ] Implement `ShelfRow` component — label, horizontal scroll container, `BookCard` list, scroll arrows
- [ ] Implement `ShelfList` component — vertical stack of `ShelfRow` components; `GET /api/shelves` via TanStack Query
- [ ] Implement `BookDetailPanel` — slide-in from right, full cover, title, authors, series position, description, genres, progress; action buttons: Read, Edit Metadata, Fetch Metadata, Remove
- [ ] Read button sets `readerVisible = true` in Zustand store
- [ ] Remove button calls `removeBook()`, closes panel, invalidates shelves query
- [ ] Handle `fileFound = false` in `BookCard` and `BookDetailPanel` — show warning icon and "Relink" button placeholder
- [ ] Verify browsing a library of 20+ imported EPUBs with covers is smooth

---

## Phase 10 — EPUB Reader

- [ ] Add `EpubController` to `Libris.Api` — spine endpoint and resource streaming endpoint
- [ ] `GET /api/epub/{id}/spine` — returns ordered `SpineItem[]`
- [ ] `GET /api/epub/{id}/content/{**resourcePath}` — streams resource bytes with correct Content-Type
- [ ] Implement `EpubReader` React component as a full-screen overlay
- [ ] Initialize epub.js `Book` with base URL `/api/epub/{bookId}/content/`
- [ ] Create epub.js `Rendition` into a `<div ref>`, size 100% width/height
- [ ] Wire `rendition.prev()` / `rendition.next()` to Previous/Next buttons
- [ ] Populate TOC sidebar from `book.navigation.toc`; clicking a TOC item calls `rendition.display(href)`
- [ ] Font size controls: increase/decrease call `rendition.themes.fontSize()`
- [ ] Reader chrome: TOC toggle button, book title + current chapter name, font size controls, Close button
- [ ] Progress bar: derived from `rendition.currentLocation().start.percentage * 100`
- [ ] Close button hides overlay (sets `readerVisible = false` in Zustand), does NOT save progress yet (that's Phase 11)
- [ ] Reader overlay animation: slide up from bottom or fade in with framer-motion
- [ ] Verify double-clicking a book opens the reader and renders content correctly

---

## Phase 11 — Progress Persistence

- [ ] Implement `ReadingProgressService.GetProgressAsync(Guid id)`
- [ ] Implement `ReadingProgressService.SaveProgressAsync(Guid id, string cfi, double percentage)` — upsert, set `Status = Reading`, update `LastReadUtc`
- [ ] Add `ProgressController` — `GET /api/books/{id}/progress`, `PUT /api/books/{id}/progress`
- [ ] `SaveProgressRequest` DTO — `Cfi` (string), `Percentage` (double)
- [ ] React reader: on `locationChanged` event, debounce-PUT progress (2-second debounce)
- [ ] React reader: on close button click, immediate PUT before hiding overlay
- [ ] React reader: `beforeunload` event — synchronous fetch save
- [ ] React reader: on open, fetch progress; if `currentCfi` exists call `rendition.display(cfi)` before first render
- [ ] Verify: open book, read 3 pages, close, reopen — reader resumes at correct position
- [ ] `ShelfService.GetAllShelvesAsync()` — include Continue Reading shelf with `Status = Reading` books
- [ ] Verify Continue Reading shelf appears and shows in-progress books sorted by most recently read

---

## Phase 12 — Metadata Editor

- [ ] Implement `OpenLibraryMetadataProvider : IMetadataProvider`
  - [ ] `FetchByIsbnAsync` — `GET https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data`
  - [ ] `SearchAsync` — `GET https://openlibrary.org/search.json?title={t}&author={a}&limit=10`
  - [ ] Parse title, authors, publishers, publish_date, subjects
- [ ] Implement `GoogleBooksMetadataProvider : IMetadataProvider`
  - [ ] `FetchByIsbnAsync` — `GET https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`
  - [ ] `SearchAsync` — `GET https://www.googleapis.com/books/v1/volumes?q={t}+inauthor:{a}&maxResults=10`
  - [ ] Parse title, authors, publisher, publishedDate, description, categories, imageLinks
- [ ] Implement `MetadataService.SearchAsync(string title, string? author)` — query both providers in parallel, merge and rank results
- [ ] Implement `MetadataService.FetchAndApplyAsync(Guid id, ExternalBookMetadata selected)` — merge non-empty fields, download and cache cover if URL present
- [ ] Add `MetadataController` — `POST /api/books/{id}/metadata/fetch`, `POST /api/metadata/search`
- [ ] Register `HttpClient` for both providers in `App.xaml.cs` `BuildApi()`
- [ ] Implement `MetadataEditor` modal in React — editable fields: Title, Authors (tag input), Series Name, Series Number, Genres (tag input), Publisher, Published Date, Description, ISBN, Language
- [ ] Implement `MetadataSearchPanel` sub-panel — "Search for Metadata" button, results list, select to populate fields
- [ ] User can accept/discard individual fields (checkbox per field) before saving
- [ ] Save calls `PUT /api/books/{id}/metadata`, invalidates book and shelves queries
- [ ] Verify: fetch metadata for a book with a known ISBN, confirm fields populate correctly

---

## Phase 13 — Native Shell Endpoints

- [ ] `ShellController.OpenFileDialog` — returns `string[]` of selected paths
- [ ] `ShellController.OpenFolderDialog` — returns `string` selected path
- [ ] `ShellController.RevealInExplorer` — accepts `{ path: string }` body
- [ ] Verify `WpfShellService` properly marshals to STA thread; no cross-thread exceptions
- [ ] React Import button: calls `openFileDialog()`, then imports each returned file
- [ ] Folder import: calls `openFolderDialog()`, then `POST /api/library/import-folder`
- [ ] "Reveal in Explorer" option in `BookDetailPanel` — calls `POST /api/shell/reveal`
- [ ] Verify file dialog opens correctly from React button click in WebView2

---

## Phase 14 — MVP Polish

- [ ] Implement `LibraryService.ScanForMissingFilesAsync()` — called on startup; sets `FileFound = false` for moved files
- [ ] `BookCard` warning indicator for `fileFound = false` books
- [ ] `BookDetailPanel` "Relink" button — calls `openFileDialog()`, updates path via `PUT /api/books/{id}/metadata`, clears warning
- [ ] API global error envelope: all error responses return `{ "error": { "code": "...", "message": "..." } }`
- [ ] React global toast notification system (simple fixed-position div, no external library required)
- [ ] Keyboard shortcut: `Escape` closes reader overlay and detail panel
- [ ] Keyboard shortcut: `←` / `→` navigates pages in reader
- [ ] Window state persistence — save bounds + maximized state to `settings.json` on `Closing`, restore on `Loaded`
- [ ] Cover images: add `loading="lazy"` to all `<img>` tags
- [ ] TanStack Query: configure `staleTime` and `refetchOnWindowFocus` appropriately
- [ ] Import folder: skip files already in library (same absolute path), include skipped count in result toast
- [ ] Verify MVP acceptance criteria end-to-end:
  - [ ] Import EPUBs individually and by folder
  - [ ] Books appear in correct shelves (author, series, genre)
  - [ ] Book detail panel opens on single-click
  - [ ] Metadata editor opens, fields editable, external fetch works
  - [ ] Double-click opens reader and renders content
  - [ ] Close and reopen reader resumes at exact position
  - [ ] Continue Reading shelf shows in-progress books
  - [ ] Removed book disappears from library (file untouched)
  - [ ] Missing file shows warning indicator

---

## Deferred (Post-MVP)

- [ ] Custom user-defined shelves
- [ ] Reading statistics dashboard
- [ ] Annotations and highlights
- [ ] Night mode / custom reader themes
- [ ] Typography controls (font family, line height, margins)
- [ ] Reading goals and streaks
- [ ] OPDS catalog import
- [ ] Calibre library import (read-only)
- [ ] Cloud sync / backup
- [ ] Bulk metadata operations
