using Libris.Core.Models;
using Libris.Storage.Repositories;
using Libris.Storage.Tests.Helpers;

namespace Libris.Storage.Tests.Repositories;

public sealed class LibraryRepositoryTests : IDisposable
{
    private readonly Microsoft.Data.Sqlite.SqliteConnection _connection;
    private readonly Storage.Data.LibrisDbContext _db;
    private readonly LibraryRepository _repo;

    public LibraryRepositoryTests()
    {
        (_db, _connection) = DbContextFactory.Create();
        _repo = new LibraryRepository(_db);
    }

    private static EpubBook MakeBook(string title = "Test Book", string path = "/books/test.epub") => new()
    {
        Id = Guid.NewGuid(),
        FilePath = path,
        FileFound = true,
        ImportedUtc = DateTimeOffset.UtcNow,
        LastModifiedUtc = DateTimeOffset.UtcNow,
        Metadata = new BookMetadata
        {
            Title = title,
            Authors = ["Author One", "Author Two"],
            Genres = ["Fiction", "Adventure"],
            Publisher = "Test Press",
            Isbn = "9780000000001",
            Language = "en",
        },
        Progress = new ReadingProgress { Status = ReadingStatus.NotStarted },
    };

    [Fact]
    public async Task AddBook_ThenGetById_ReturnsBook()
    {
        var book = MakeBook();
        await _repo.AddBookAsync(book);

        var result = await _repo.GetBookAsync(book.Id);

        Assert.NotNull(result);
        Assert.Equal(book.Id, result.Id);
        Assert.Equal("Test Book", result.Metadata.Title);
    }

    [Fact]
    public async Task AddBook_ThenGetByPath_ReturnsBook()
    {
        var book = MakeBook(path: "/unique/path.epub");
        await _repo.AddBookAsync(book);

        var result = await _repo.GetBookByPathAsync("/unique/path.epub");

        Assert.NotNull(result);
        Assert.Equal(book.Id, result.Id);
    }

    [Fact]
    public async Task GetAllBooks_ReturnsAllInserted()
    {
        await _repo.AddBookAsync(MakeBook("Book A", "/a.epub"));
        await _repo.AddBookAsync(MakeBook("Book B", "/b.epub"));
        await _repo.AddBookAsync(MakeBook("Book C", "/c.epub"));

        var all = await _repo.GetAllBooksAsync();

        Assert.Equal(3, all.Count);
    }

    [Fact]
    public async Task AddBook_RoundTripsAuthorsAndGenres()
    {
        var book = MakeBook();
        await _repo.AddBookAsync(book);

        var result = await _repo.GetBookAsync(book.Id);

        Assert.NotNull(result);
        Assert.Equal(["Author One", "Author Two"], result.Metadata.Authors);
        Assert.Equal(["Fiction", "Adventure"], result.Metadata.Genres);
    }

    [Fact]
    public async Task UpdateBook_PersistsMetadataChanges()
    {
        var book = MakeBook();
        await _repo.AddBookAsync(book);

        book.Metadata.Title = "Updated Title";
        book.Metadata.Publisher = "New Press";
        book.LastModifiedUtc = DateTimeOffset.UtcNow;
        await _repo.UpdateBookAsync(book);

        var result = await _repo.GetBookAsync(book.Id);
        Assert.NotNull(result);
        Assert.Equal("Updated Title", result.Metadata.Title);
        Assert.Equal("New Press", result.Metadata.Publisher);
    }

    [Fact]
    public async Task RemoveBook_ThenGetById_ReturnsNull()
    {
        var book = MakeBook();
        await _repo.AddBookAsync(book);

        await _repo.RemoveBookAsync(book.Id);

        var result = await _repo.GetBookAsync(book.Id);
        Assert.Null(result);
    }

    [Fact]
    public async Task GetById_ReturnsNull_WhenNotFound()
    {
        var result = await _repo.GetBookAsync(Guid.NewGuid());
        Assert.Null(result);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
