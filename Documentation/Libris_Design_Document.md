# Libris — Design Document

*Architecture • MVP Scope • Technical Reference*

**Version 1.0  •  May 2026**

---

## 1. Project Vision

Libris is a desktop-first EPUB library organizer and reader for book collectors and avid readers. Conceptually similar to a personal Netflix for ebooks — a visually rich, shelf-organized library where every book is one double-click away from opening in a full-featured reader.

### What Readers Can Do

- Import EPUB files from anywhere on disk into a unified library
- Browse their collection through a Netflix-style shelf interface organized by author, series, and genre
- Edit book metadata (title, author, series, genres, publisher, description) and fetch rich data and covers from free external APIs
- Double-click any book to open it instantly in a built-in EPUB reader
- Resume reading from exactly where they left off — position is persisted per book
- Track reading status across all books (Not Started, Reading, Finished)
- View a "Continue Reading" shelf that surfaces all in-progress books at a glance

### Core Priorities

- Offline-first functionality — the library and reader work with no network connection
- Non-destructive library management — EPUB files are never moved, modified, or locked
- Fast browsing with hundreds of books through efficient cover caching and lazy loading
- Accurate reading position persistence across reader open/close cycles
- Extensibility for future features: custom shelves, reading statistics, sync, themes

---

## 2. Application Concept

Libris treats the user's book collection as a catalog — a separate database layer that references EPUB files wherever they live on disk. EPUB files are never moved or modified; Libris writes only its own sidecar data. The library can be rebuilt from scratch by re-importing files, making it safe and resilient.

### Data Responsibility Split

| Data | Owner | Format |
|---|---|---|
| EPUB content | The file on disk | `.epub` (untouched) |
| Book metadata | Libris library database | SQLite (`library.db`) |
| Cover images | Libris covers cache | `covers/{id}.jpg` |
| Reading progress | Libris library database | SQLite (`library.db`) |
| Application settings | Libris settings file | `settings.json` |

### Application Data Directory

```
%AppData%\Libris\
  ├── library.db          ← SQLite catalog and progress store
  ├── settings.json       ← Window state, theme, default sort
  └── covers\
       └── {bookId}.jpg   ← Extracted or fetched cover images
```

EPUB files remain in their original locations. Libris stores only the file path. If a file is moved, Libris presents a "file not found" warning and allows the user to relink it.

---

## 3. Core Design Principles

### 3.1  Non-Destructive

Libris never writes to, moves, or modifies EPUB files. All supplementary data — metadata overrides, covers, progress — is stored separately. Removing a book from the library removes only the catalog entry, never the file.

### 3.2  Offline-First

The application must function fully without internet access. External API calls for metadata and cover enrichment are always on-demand and optional — the user initiates them explicitly. No feature is gated on network availability.

### 3.3  Local-First Storage

SQLite is the catalog and progress store — appropriate here because the data is relational and query-driven (shelf grouping, search, progress lookups) rather than document-based. EPUB files remain the true content source. The SQLite database is an index and annotation layer, not the source of truth for book content.

### 3.4  UI Should Not Own Business Logic

The React frontend renders shelves, manages the reader overlay, and calls the local API. It does not parse EPUBs, query external APIs, manage the SQLite database, or compute reading progress percentages. All of that lives in C# services.

### 3.5  Reader Fidelity

The EPUB reader must preserve the reading position (expressed as an EPUB CFI — Canonical Fragment Identifier) on every close, including sudden application exit. On reopen, the reader restores position before rendering the first visible page.

---

## 4. Technology Stack

| Layer | Technology |
|---|---|
| **Language** | C# / .NET 10 |
| **Desktop Shell** | WPF (`net10.0-windows`) with Microsoft WebView2 |
| **Frontend** | React (TypeScript) — served from `wwwroot` in production, Vite dev server in development |
| **Backend / API** | ASP.NET Core Web API hosted in-process via Kestrel on `localhost` |
| **Architecture** | In-Process Hosting — Kestrel starts inside the WPF process; WebView2 navigates to `http://localhost:{port}` |
| **Serialization** | System.Text.Json — all DTOs and settings files |
| **Library Store** | SQLite via `Microsoft.EntityFrameworkCore.Sqlite` |
| **EPUB Parsing** | `VersOne.Epub` NuGet package |
| **EPUB Rendering** | `epub.js` (JavaScript, loaded in the reader view) |
| **External Metadata** | Open Library API + Google Books API (both free, no API key required) |
| **Cover Cache** | Local filesystem (`covers/`) with fallback to extracted EPUB cover |

### Why In-Process Hosting

Identical rationale to the TextForge architecture. The WPF shell and ASP.NET Core API run in the same process. Kestrel starts in ~200 ms, WebView2 navigates to `http://localhost:{port}`, and React communicates with C# through standard `fetch` calls — same-origin, no CORS required. The EPUB resource serving endpoint streams file chunks from disk; this is a natural fit for Kestrel's pipeline and requires no IPC overhead.

### EPUB Resource Serving

The epub.js reader in the browser needs to load EPUB resources (HTML spine items, CSS, images, fonts) by URL. Libris exposes a resource endpoint at `/api/epub/{bookId}/content/{**path}` that reads the requested resource from the EPUB ZIP archive via VersOne.Epub and streams it back with the correct `Content-Type`. epub.js is configured to resolve all resource URLs through this endpoint.

### Development vs Production Mode

| Environment | Frontend served from | WebView2 navigates to |
|---|---|---|
| **Development** | Vite dev server (port 5173) — hot module reload active | `http://localhost:5173` |
| **Production** | Kestrel static files from `wwwroot/` | `http://localhost:{dynamic-port}` |

```csharp
#if DEBUG
    WebView.Source = new Uri("http://localhost:5173");
#else
    WebView.Source = new Uri($"http://localhost:{_port}");
#endif
```

---

## 5. Solution Structure

```
Libris.sln
  ├── src/
  │    ├── Libris.Core/          ← Domain models, interfaces, enums
  │    ├── Libris.Storage/       ← SQLite EF Core context, repositories, cover cache
  │    ├── Libris.Epub/          ← EPUB parsing, resource serving, metadata extraction
  │    ├── Libris.Metadata/      ← Open Library & Google Books API clients
  │    ├── Libris.Api/           ← ASP.NET Core controllers, application services, DI
  │    └── Libris.Desktop/       ← WPF shell, Kestrel bootstrap, WebView2, native dialogs
  ├── ui/
  │    └── libris-ui/            ← React (TypeScript) frontend; builds to Desktop/wwwroot
  └── tests/
       ├── Libris.Core.Tests/
       ├── Libris.Storage.Tests/
       └── Libris.Epub.Tests/
```

The React build output (`npm run build`) is written to `src/Libris.Desktop/wwwroot/` and committed or generated as part of the publish pipeline.

---

## 6. Project Responsibilities

### 6.1  Libris.Core

Pure domain logic and models. Must not reference WPF, ASP.NET Core, EF Core, or any UI framework. Contains all domain types, enums, interfaces, and validation primitives.

```csharp
public sealed class EpubBook
{
    public Guid Id { get; init; }
    public string FilePath { get; set; } = string.Empty;   // absolute path to .epub
    public bool FileFound { get; set; } = true;             // false if file has moved
    public BookMetadata Metadata { get; set; } = new();
    public ReadingProgress Progress { get; set; } = new();
    public DateTimeOffset ImportedUtc { get; init; }
    public DateTimeOffset LastModifiedUtc { get; set; }
}

public sealed class BookMetadata
{
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string? SeriesName { get; set; }
    public decimal? SeriesIndex { get; set; }
    public List<string> Genres { get; set; } = new();
    public string? Publisher { get; set; }
    public string? PublishedDate { get; set; }
    public string? Description { get; set; }
    public string? Isbn { get; set; }
    public string? Language { get; set; }
    public string? CoverPath { get; set; }       // path to cached cover image
}

public sealed class ReadingProgress
{
    public ReadingStatus Status { get; set; } = ReadingStatus.NotStarted;
    public string? CurrentCfi { get; set; }          // EPUB Canonical Fragment Identifier
    public double Percentage { get; set; }           // 0.0 – 100.0
    public DateTimeOffset? LastReadUtc { get; set; }
    public DateTimeOffset? StartedUtc { get; set; }
    public DateTimeOffset? FinishedUtc { get; set; }
    public int TotalReadingMinutes { get; set; }
}

public enum ReadingStatus { NotStarted, Reading, Finished }
```

**Interfaces defined in Core:**

```csharp
public interface ILibraryRepository
{
    Task<IReadOnlyList<EpubBook>> GetAllBooksAsync(CancellationToken ct = default);
    Task<EpubBook?> GetBookAsync(Guid id, CancellationToken ct = default);
    Task AddBookAsync(EpubBook book, CancellationToken ct = default);
    Task UpdateBookAsync(EpubBook book, CancellationToken ct = default);
    Task RemoveBookAsync(Guid id, CancellationToken ct = default);
}

public interface IReadingProgressRepository
{
    Task<ReadingProgress?> GetProgressAsync(Guid bookId, CancellationToken ct = default);
    Task SaveProgressAsync(Guid bookId, ReadingProgress progress, CancellationToken ct = default);
}

public interface IEpubParser
{
    Task<BookMetadata> ExtractMetadataAsync(string filePath, CancellationToken ct = default);
    Task<byte[]?> ExtractCoverAsync(string filePath, CancellationToken ct = default);
    Task<EpubResourceResult?> GetResourceAsync(string filePath, string resourcePath, CancellationToken ct = default);
    Task<IReadOnlyList<SpineItem>> GetSpineAsync(string filePath, CancellationToken ct = default);
}

public interface IMetadataProvider
{
    string ProviderName { get; }
    Task<ExternalBookMetadata?> FetchByIsbnAsync(string isbn, CancellationToken ct = default);
    Task<IReadOnlyList<ExternalBookMetadata>> SearchAsync(string title, string? author, CancellationToken ct = default);
}
```

### 6.2  Libris.Storage

SQLite persistence via Entity Framework Core. Contains the EF DbContext, entity configurations, repository implementations, and the cover cache manager.

```csharp
public class LibrisDbContext : DbContext
{
    public DbSet<EpubBookEntity> Books { get; set; } = null!;
    public DbSet<ReadingProgressEntity> ReadingProgress { get; set; } = null!;
}

public class LibraryRepository : ILibraryRepository
{
    private readonly LibrisDbContext _db;
    // ... standard EF Core CRUD implementation
}
```

The cover cache manager handles writing fetched or extracted cover images to `%AppData%\Libris\covers\{bookId}.jpg`, returning the local path for storage in `BookMetadata.CoverPath`. It also handles resizing covers to a consistent thumbnail resolution.

**Database schema (managed via EF Core migrations):**

```
Books
  Id (GUID PK), FilePath, FileFound, Title, AuthorsJson, SeriesName,
  SeriesIndex, GenresJson, Publisher, PublishedDate, Description,
  Isbn, Language, CoverPath, ImportedUtc, LastModifiedUtc

ReadingProgress
  BookId (FK → Books.Id), Status, CurrentCfi, Percentage,
  LastReadUtc, StartedUtc, FinishedUtc, TotalReadingMinutes
```

### 6.3  Libris.Epub

Wraps `VersOne.Epub` to provide a clean interface for the rest of the application. Handles EPUB parsing, metadata extraction, cover extraction, and resource serving for the in-browser reader.

```csharp
public class EpubParser : IEpubParser
{
    public async Task<BookMetadata> ExtractMetadataAsync(string filePath, CancellationToken ct = default)
    {
        var epubBook = await EpubReader.ReadBookAsync(filePath);
        return new BookMetadata
        {
            Title  = epubBook.Title ?? string.Empty,
            Authors = epubBook.AuthorList?.ToList() ?? new List<string>(),
            // ... map all OPF metadata
        };
    }

    public async Task<EpubResourceResult?> GetResourceAsync(
        string filePath, string resourcePath, CancellationToken ct = default)
    {
        // Opens the epub ZIP, locates the requested resource path,
        // returns the raw bytes and media type for HTTP streaming.
        var epubBook = await EpubReader.ReadBookAsync(filePath);
        var resource = epubBook.Resources.All.FirstOrDefault(
            r => r.FilePath.Equals(resourcePath, StringComparison.OrdinalIgnoreCase));

        return resource is null ? null : new EpubResourceResult(
            Content: resource.ContentAsBytes(),
            MediaType: resource.ContentType.ToMimeString()
        );
    }
}
```

**SpineItem** — a lightweight DTO representing one HTML document in the EPUB reading order, used by the frontend to construct the epub.js book object.

### 6.4  Libris.Metadata

Stateless HTTP clients for external book metadata APIs. All providers implement `IMetadataProvider`. The application service layer selects and merges results from multiple providers.

**Open Library Provider**

```csharp
// No API key required. Rate limit: polite usage (no more than 1 req/sec).
// Endpoint: https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data
// Cover:    https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg

public class OpenLibraryMetadataProvider : IMetadataProvider
{
    public string ProviderName => "Open Library";

    public async Task<ExternalBookMetadata?> FetchByIsbnAsync(string isbn, CancellationToken ct = default)
    {
        // GET https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data
        // Parse title, authors, publishers, publish_date, subjects from response
    }

    public async Task<IReadOnlyList<ExternalBookMetadata>> SearchAsync(
        string title, string? author, CancellationToken ct = default)
    {
        // GET https://openlibrary.org/search.json?title={title}&author={author}&limit=10
    }
}
```

**Google Books Provider**

```csharp
// No API key required for basic volume queries (up to ~1000/day unauthenticated).
// Endpoint: https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}
// Covers:   volumeInfo.imageLinks.thumbnail / smallThumbnail

public class GoogleBooksMetadataProvider : IMetadataProvider
{
    public string ProviderName => "Google Books";

    public async Task<ExternalBookMetadata?> FetchByIsbnAsync(string isbn, CancellationToken ct = default)
    {
        // GET https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}
        // Parse volumeInfo for title, authors, publisher, publishedDate,
        // description, categories, imageLinks
    }

    public async Task<IReadOnlyList<ExternalBookMetadata>> SearchAsync(
        string title, string? author, CancellationToken ct = default)
    {
        // GET https://www.googleapis.com/books/v1/volumes?q={title}+inauthor:{author}&maxResults=10
    }
}
```

**ExternalBookMetadata** — a neutral DTO that carries the fetched data regardless of provider; the application service merges it into the local `BookMetadata` model, applying only non-empty fields and leaving user-edited fields intact unless explicitly overwritten.

### 6.5  Libris.Api

ASP.NET Core Web API project. Contains controllers, request/response DTOs, application services, and DI registrations. Does not start the web host itself — referenced by `Libris.Desktop`.

**Application Services (orchestrate domain operations):**

- `LibraryService` — import/remove books, validate file paths, coordinate parsing and cover extraction
- `MetadataService` — query external providers, merge results, save updates
- `ReadingProgressService` — load and persist CFI positions, calculate percentages, update status
- `ShelfService` — query and group books into shelf structures for the frontend

**Controller summary:**

```
LibraryController         GET    /api/library/books
                          POST   /api/library/import          (file path from dialog)
                          POST   /api/library/import-folder   (folder path from dialog)
                          DELETE /api/library/books/{id}

BooksController           GET    /api/books/{id}
                          PUT    /api/books/{id}/metadata
                          GET    /api/books/{id}/cover        (streams image bytes)
                          PUT    /api/books/{id}/cover        (upload new cover)

MetadataController        POST   /api/books/{id}/metadata/fetch           (by ISBN from book)
                          POST   /api/metadata/search                     (title + author query)

ShelvesController         GET    /api/shelves                 (all shelf groups)
                          GET    /api/shelves/continue-reading

ProgressController        GET    /api/books/{id}/progress
                          PUT    /api/books/{id}/progress

EpubController            GET    /api/epub/{id}/spine         (ordered spine items)
                          GET    /api/epub/{id}/content/{**path}  (resource streaming)

ShellController           POST   /api/shell/open-file-dialog
                          POST   /api/shell/open-folder-dialog
```

**Example controllers:**

```csharp
[ApiController]
[Route("api/books/{id}/[controller]")]
public class ProgressController : ControllerBase
{
    private readonly IReadingProgressRepository _progress;

    [HttpGet]
    public async Task<IActionResult> GetProgress(Guid id, CancellationToken ct)
    {
        var p = await _progress.GetProgressAsync(id, ct);
        return p is null ? NotFound() : Ok(p);
    }

    [HttpPut]
    public async Task<IActionResult> SaveProgress(
        Guid id, [FromBody] SaveProgressRequest req, CancellationToken ct)
    {
        await _progress.SaveProgressAsync(id, new ReadingProgress
        {
            CurrentCfi = req.Cfi,
            Percentage = req.Percentage,
            Status     = ReadingStatus.Reading,
            LastReadUtc = DateTimeOffset.UtcNow,
        }, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/epub/{id}")]
public class EpubController : ControllerBase
{
    private readonly IEpubParser _parser;
    private readonly ILibraryRepository _library;

    [HttpGet("content/{**resourcePath}")]
    public async Task<IActionResult> GetResource(
        Guid id, string resourcePath, CancellationToken ct)
    {
        var book = await _library.GetBookAsync(id, ct);
        if (book is null) return NotFound();
        var result = await _parser.GetResourceAsync(book.FilePath, resourcePath, ct);
        if (result is null) return NotFound();
        return File(result.Content, result.MediaType);
    }
}
```

### 6.6  Libris.Desktop

WPF startup project (`net10.0-windows`). Owns the application entry point, bootstraps Kestrel in-process, creates the main WPF window hosting the WebView2 control. Handles native OS features: file/folder dialogs, window state persistence, and application lifecycle. Identical structural pattern to TextForge.Desktop.

```csharp
// App.xaml.cs
public partial class App : Application
{
    private WebApplication? _api;
    private int _port;

    protected override async void OnStartup(StartupEventArgs e)
    {
        _port = GetAvailablePort();
        _api  = BuildApi(_port);
        await _api.StartAsync();

        base.OnStartup(e);
        new MainWindow(_port).Show();
    }

    private WebApplication BuildApi(int port)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls($"http://localhost:{port}");
        builder.Services.AddControllers();

        // Library services
        builder.Services.AddDbContext<LibrisDbContext>(o =>
            o.UseSqlite($"Data Source={LibrisDataPaths.DatabasePath}"));
        builder.Services.AddScoped<ILibraryRepository, LibraryRepository>();
        builder.Services.AddScoped<IReadingProgressRepository, ReadingProgressRepository>();
        builder.Services.AddScoped<IEpubParser, EpubParser>();

        // Metadata providers — registered as a collection
        builder.Services.AddHttpClient<OpenLibraryMetadataProvider>();
        builder.Services.AddHttpClient<GoogleBooksMetadataProvider>();
        builder.Services.AddScoped<IEnumerable<IMetadataProvider>>(sp => new IMetadataProvider[]
        {
            sp.GetRequiredService<OpenLibraryMetadataProvider>(),
            sp.GetRequiredService<GoogleBooksMetadataProvider>(),
        });

        // Application services
        builder.Services.AddScoped<LibraryService>();
        builder.Services.AddScoped<MetadataService>();
        builder.Services.AddScoped<ShelfService>();
        builder.Services.AddScoped<ReadingProgressService>();

        // Shell service (WPF thread dispatcher for file dialogs)
        builder.Services.AddSingleton<IShellService, WpfShellService>();

        var app = builder.Build();
        app.UseDefaultFiles();
        app.UseStaticFiles();
        app.MapControllers();
        app.MapFallbackToFile("index.html");
        return app;
    }

    protected override async void OnExit(ExitEventArgs e)
    {
        if (_api is not null) await _api.StopAsync();
        base.OnExit(e);
    }
}
```

**WpfShellService** marshals file dialog calls back to the WPF UI thread (required since `OpenFileDialog` must run on a STA thread) and returns selected paths to the API controller.

### 6.7  libris-ui (React Frontend)

TypeScript React application. Communicates exclusively through `fetch` calls to `/api/*`. In development, the Vite config proxies `/api` to Kestrel.

**Key frontend dependencies:**

| Package | Purpose |
|---|---|
| `epubjs` | EPUB rendering and CFI-based position tracking |
| `react-query` / TanStack Query | Server state, caching, background refetch |
| `zustand` | Client-side UI state (open book, active shelf, reader visibility) |
| `framer-motion` | Shelf scroll animations, book card hover effects |

---

## 7. Library Data Model

### Shelf Grouping

The API's `GET /api/shelves` response structures books into named horizontal shelves for the Netflix-style view. The `ShelfService` builds this server-side:

```json
{
  "shelves": [
    {
      "id": "continue-reading",
      "label": "Continue Reading",
      "sortKey": 0,
      "books": [ /* EpubBook DTOs sorted by lastReadUtc desc */ ]
    },
    {
      "id": "recently-added",
      "label": "Recently Added",
      "sortKey": 1,
      "books": [ /* sorted by importedUtc desc, max 20 */ ]
    },
    {
      "id": "series:the-expanse",
      "label": "The Expanse",
      "sortKey": 100,
      "books": [ /* sorted by seriesIndex */ ]
    },
    {
      "id": "author:james-s-a-corey",
      "label": "James S.A. Corey",
      "sortKey": 200,
      "books": [ /* sorted by publishedDate */ ]
    },
    {
      "id": "genre:science-fiction",
      "label": "Science Fiction",
      "sortKey": 300,
      "books": [ /* sorted by title */ ]
    }
  ]
}
```

Shelf ordering rules: Continue Reading and Recently Added are always first. Series shelves appear before author shelves. Author shelves appear before genre shelves. Within each category, shelves are ordered alphabetically.

### Reading Progress and CFI

EPUB CFI (Canonical Fragment Identifier) is the standard W3C format for expressing a precise location within an EPUB document. epub.js exposes the current CFI via `rendition.currentLocation()` on every location change and accepts a CFI string via `rendition.display(cfi)` on load.

```typescript
// Saving position (called on every page turn and on component unmount)
rendition.on('locationChanged', async (location: Location) => {
  const cfi = location.start.cfi;
  const percentage = book.locations.percentageFromCfi(cfi) * 100;
  await fetch(`/api/books/${bookId}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cfi, percentage }),
  });
});

// Restoring position on open
const progress = await fetchProgress(bookId);
if (progress?.currentCfi) {
  rendition.display(progress.currentCfi);
} else {
  rendition.display(); // Start from beginning
}
```

The `SaveProgressRequest` DTO is also sent when the reader component unmounts (via `useEffect` cleanup), ensuring position is persisted even when the user closes the reader without a page turn event.

---

## 8. External Metadata APIs

Both APIs are free and require no API key for the usage patterns described.

### Open Library

| Operation | Endpoint |
|---|---|
| Fetch by ISBN | `GET https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data` |
| Search by title/author | `GET https://openlibrary.org/search.json?title={t}&author={a}&limit=10` |
| Cover by ISBN | `https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg` |
| Cover by OLID | `https://covers.openlibrary.org/b/olid/{olid}-L.jpg` |

Open Library is the preferred source for bibliographic completeness: it has strong coverage of older books, indie publications, and international titles.

### Google Books

| Operation | Endpoint |
|---|---|
| Fetch by ISBN | `GET https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}` |
| Search by title/author | `GET https://www.googleapis.com/books/v1/volumes?q={t}+inauthor:{a}&maxResults=10` |
| Cover | `volumeInfo.imageLinks.thumbnail` from response |

Google Books is the preferred source for cover images (higher resolution, more consistent) and descriptions.

### Merge Strategy

When the user triggers "Fetch Metadata" on a book:
1. Both providers are queried in parallel (by ISBN if present, otherwise by title + author).
2. Results are ranked by confidence (ISBN match > title+author match) and presented to the user as a selection list in the metadata editor.
3. The user selects a result; the application merges non-empty fields into the local metadata — it does not automatically overwrite user-edited fields without confirmation.
4. The cover is downloaded, resized to 400×600px, and cached to `covers/{bookId}.jpg`.

---

## 9. UI Layout and Philosophy

The React frontend owns all visual layout. WPF contributes only the window chrome. All panels, overlays, and interactions live in React components.

### Main Layout

```
┌─────────────────────────────────────────────────┐
│  Search bar   [Filter ▼]  [Sort ▼]   [Import +] │  ← Top bar
├─────────────────────────────────────────────────┤
│                                                  │
│  Continue Reading                          ›  ›  │  ← Shelf row
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │cover │  │cover │  │cover │  │cover │        │
│  └──────┘  └──────┘  └──────┘  └──────┘        │
│                                                  │
│  The Expanse Series                        ›  ›  │
│  ┌──────┐  ┌──────┐  ...                        │
│                                                  │
│  By Author: N.K. Jemisin                   ›  ›  │
│  ┌──────┐  ...                                   │
│                                                  │
│  Science Fiction                           ›  ›  │
│  ┌──────┐  ...                                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Book Cards

Each book card displays the cover image, title, author, a reading progress bar (if in progress), and a "Finished" badge (if complete). On hover, the card scales up slightly (via framer-motion) and reveals a quick-action overlay with Edit Metadata and Open Reader buttons. Double-clicking the card opens the reader immediately.

### Book Detail Panel

Clicking (single-click) a book card opens a slide-in detail panel from the right — analogous to a Netflix title page. It shows the full cover, title, authors, series position, description, genres, ISBN, and reading progress. Action buttons: Read, Edit Metadata, Fetch Metadata, Remove from Library.

### Metadata Editor

A modal dialog triggered from the detail panel. Editable fields: Title, Authors (tag input), Series Name, Series Number, Genres (tag input), Publisher, Published Date, Description, ISBN, Language. A "Search for Metadata" button in the modal opens a sub-panel with provider search results; selecting a result populates the fields. The user can then selectively accept or discard individual fields before saving.

### EPUB Reader View

The reader occupies the full window — it slides in over the library view as a full-screen overlay. It contains: a reading progress bar at the top, the epub.js rendered content, Previous/Next page buttons, a table of contents sidebar toggle, font size controls, and a Close button. The Close button saves the current CFI position before dismissing the overlay.

```
┌─────────────────────────────────────────────────┐
│  [☰ TOC]  Title — Chapter Name      [Aa] [✕]   │  ← Reader chrome
├─────────────────────────────────────────────────┤
│                                                  │
│  [<]           EPUB content area           [>]  │
│                                                  │
│  Page 47 of 312 ────────████░░░░░░░── 32%       │
└─────────────────────────────────────────────────┘
```

### Native OS Integration

| Feature | API Endpoint | WPF Implementation |
|---|---|---|
| Open EPUB file(s) | `POST /api/shell/open-file-dialog` | `OpenFileDialog` (filter: `*.epub`) |
| Open folder for import | `POST /api/shell/open-folder-dialog` | `FolderBrowserDialog` |
| Reveal in Explorer | `POST /api/shell/reveal` | `Process.Start("explorer.exe", path)` |

---

## 10. MVP Scope

The MVP focuses on a complete end-to-end workflow: import → browse → read → resume.

| **Included in MVP** | **Excluded from MVP** |
|---|---|
| EPUB import (file and folder) | Custom user-defined shelves |
| Netflix-style library shelves | Reading statistics dashboard |
| Continue Reading shelf | Cloud sync / backup |
| Author / Series / Genre shelves | Annotations and highlights |
| Book detail panel | Dictionary / lookup |
| EPUB reader with epub.js | Night mode / custom themes |
| Reading position persistence (CFI) | Reading goals and streaks |
| Basic metadata editing | Bulk metadata operations |
| External metadata fetch (Open Library + Google Books) | EPUB export or format conversion |
| Cover fetch and cache | Plugin system |
| Remove book from library | Social / sharing features |
| File not found detection and relinking | Multi-device sync |

### MVP Acceptance Criteria

A user can import EPUB files individually or by folder scan. Imported books appear in the library organized into shelves by author, series, and genre. Clicking a book opens a detail panel; the metadata editor allows editing all fields and fetching from external APIs. Double-clicking a book opens the EPUB reader. The reader displays the book content correctly. Closing and reopening the reader for the same book resumes at the exact same position. A "Continue Reading" shelf shows all books with in-progress status, sorted by most recently read.

---

## 11. Key Workflows

### Import Workflow

1. User clicks Import or drags an `.epub` file onto the window.
2. React calls `POST /api/shell/open-file-dialog` or `POST /api/library/import` with a file path.
3. `LibraryService.ImportAsync()` invokes `EpubParser.ExtractMetadataAsync()` to read OPF metadata from the EPUB.
4. The cover is extracted via `EpubParser.ExtractCoverAsync()` and saved to `covers/{id}.jpg`.
5. A new `EpubBook` record is written to SQLite.
6. The React library view refetches shelves and the new book appears immediately.

### Metadata Fetch Workflow

1. User opens the metadata editor and clicks "Search for Metadata."
2. React calls `POST /api/metadata/search` with the current title and author.
3. `MetadataService` queries Open Library and Google Books in parallel.
4. Results are returned as a ranked list of `ExternalBookMetadata` DTOs.
5. User selects a result; the editor populates fields from the selection.
6. User saves; React calls `PUT /api/books/{id}/metadata`.
7. If the selected result includes a cover URL, `MetadataService` downloads and caches it.

### Reading Position Persistence

Position is saved at three points to ensure nothing is lost:

1. **On every page turn** — epub.js fires a `locationChanged` event; the React reader component POSTs the CFI to `/api/books/{id}/progress` debounced to 2 seconds.
2. **On reader close** — the Close button handler saves the current CFI before dismissing the reader overlay, using `useEffect` cleanup.
3. **On application close** — the WPF shell sends a `WM_CLOSE` and the React `beforeunload` handler fires a synchronous `fetch` save as a last resort.

On reader open, the progress is fetched immediately and `rendition.display(cfi)` is called before first render to prevent a visible jump from page 1.

### File Relinking

If a book's file path no longer resolves on disk, `LibraryService` sets `EpubBook.FileFound = false` on startup scan. In the UI, missing-file books are shown with a warning indicator. Clicking "Relink" opens a file dialog; selecting the new location updates the stored path and clears the warning.

### Error Handling

All API errors return a structured JSON envelope:

```json
{ "error": { "code": "FILE_NOT_FOUND", "message": "The EPUB file could not be located at the stored path." } }
```

The React frontend catches these in a global error handler and displays them in a toast notification. Epub parse errors, metadata fetch failures, and cover download failures are handled individually — a failure in one step does not abort the others.

---

## 12. Coding Standards

Inherits all standards from the TextForge coding standards document. Additional Libris-specific conventions:

### Domain / API Boundary

- `EpubBook` and related domain types live in `Libris.Core` and are never serialized directly to the API response.
- API controllers return named DTO types (e.g., `BookSummaryDto`, `ShelfDto`). Mapping is done in the application service, not the controller.
- The EF Core entity types in `Libris.Storage` are separate from the domain models in `Libris.Core`. They are mapped by `LibraryRepository`.

### Async Throughout

All storage operations, epub parsing, and metadata HTTP calls are async. No `.Result` or `.Wait()` calls anywhere in the stack.

### Cover Image Pipeline

Cover images pass through a consistent pipeline: `byte[] → resize to 400×600 → save as JPEG 85% quality → cache to disk → return local path`. All cover serving goes through the `/api/books/{id}/cover` endpoint; the React frontend never constructs a raw filesystem path.

### epub.js Integration

The epub.js book URL is constructed as `/api/epub/{id}/content/` (the base path), and epub.js resolves individual resource requests against it. The `EpubController` serves all resources by looking them up in the EPUB archive via VersOne.Epub. This keeps the reader origin-consistent and avoids any file:// protocol issues in WebView2.

---

## 13. Recommended Build Order

| # | Step | Detail |
|---|---|---|
| **1** | **Solution setup** | Create all projects, configure nullable, analyzers, EF Core tools |
| **2** | **Domain models** | `EpubBook`, `BookMetadata`, `ReadingProgress`, all interfaces in `Libris.Core` |
| **3** | **Database setup** | EF Core context, entity configs, initial migration, `ILibraryRepository` implementation |
| **4** | **EPUB parser** | Wrap VersOne.Epub: metadata extraction, cover extraction, resource serving, spine |
| **5** | **Storage tests** | Cover repository CRUD and epub parse against test fixture files |
| **6** | **WPF shell + WebView2** | Main window, Kestrel in-process bootstrap identical to TextForge pattern |
| **7** | **React scaffold** | Vite + React + TypeScript + TanStack Query + Zustand, Vite proxy to Kestrel `/api` |
| **8** | **Library API** | Import, list, remove, cover endpoints wired to storage services |
| **9** | **Library UI** | Netflix shelf view, book cards, cover display |
| **10** | **EPUB reader** | epub.js integration, resource endpoint, spine endpoint, basic navigation |
| **11** | **Progress persistence** | CFI save/load, Continue Reading shelf, progress bar on cards |
| **12** | **Metadata editor** | Edit form, external API fetch, cover update |
| **13** | **Native shell endpoints** | File/folder dialogs, reveal in Explorer |
| **14** | **MVP polish** | File-not-found detection, error toasts, keyboard shortcuts, window state persistence |

---

## 14. Future Systems

### 14.1  Custom Shelves

Allow users to create named shelves with custom filter rules (e.g., "To Read", "Favourites", "Read in 2026"). Shelves persist as rows in a `CustomShelves` table.

### 14.2  Annotations and Highlights

Store CFI-range-keyed highlights and text notes in SQLite. Display as colored overlays in the reader. Export annotations to Markdown or JSON.

### 14.3  Reading Statistics

Track daily reading sessions in a `ReadingSessions` table. Expose a statistics view: books read this year, average reading speed (words/minute), reading streak, total hours. Session tracking begins on reader open and ends on reader close.

### 14.4  OPDS Catalog Support

Allow importing books from OPDS catalog feeds (standard library/bookstore protocol). Useful for Calibre-server integration and public library systems.

### 14.5  Themes and Typography

User-configurable reader theme (light, dark, sepia), font family, font size, line height, margin width. Preferences stored in `settings.json` and applied as CSS custom properties injected into the epub.js iframe.

### 14.6  Calibre Integration

Optional import from an existing Calibre library: read `metadata.db`, import cover images, and import metadata without moving files. Calibre integration is read-only — Libris never writes to the Calibre database.

---

## 15. Guidance for Coding Agents

When generating code for this project, follow these rules:

- Keep all EPUB parsing out of controllers and the frontend — it belongs exclusively in `Libris.Epub`
- Keep metadata HTTP calls out of controllers — they go through `MetadataService` in `Libris.Api`
- Keep EF Core entities separate from domain models — mapping happens in repositories
- The React frontend never constructs file paths, calls external APIs, or touches epub.js internals outside the dedicated `EpubReader` component
- All cover images are served through the API — never expose a `file://` path to the frontend
- Reading progress saves must be resilient: catch network errors silently and retry on the next page turn
- epub.js CFI strings are opaque tokens — never parse, modify, or construct them manually
- Prefer `IReadOnlyList<T>` for all service return types; mutation goes through explicit commands
- Never block the WPF UI thread waiting for a Kestrel response — shell services use `Dispatcher.InvokeAsync`
- When in doubt, favor simple, maintainable, local-first design

> **Remember:** The MVP only needs to prove the core loop: Import EPUB → Browse library → Open reader → Read → Close → Reopen at same position. Everything else comes after this foundation is solid.

---

*Confidential — Internal Use Only*
