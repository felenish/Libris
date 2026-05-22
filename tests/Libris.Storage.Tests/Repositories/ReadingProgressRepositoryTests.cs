using Libris.Core.Models;
using Libris.Storage.Entities;
using Libris.Storage.Repositories;
using Libris.Storage.Tests.Helpers;

namespace Libris.Storage.Tests.Repositories;

public sealed class ReadingProgressRepositoryTests : IDisposable
{
    private readonly Microsoft.Data.Sqlite.SqliteConnection _connection;
    private readonly Storage.Data.LibrisDbContext _db;
    private readonly ReadingProgressRepository _repo;

    public ReadingProgressRepositoryTests()
    {
        (_db, _connection) = DbContextFactory.Create();
        _repo = new ReadingProgressRepository(_db);
    }

    private async Task<Guid> SeedBookAsync()
    {
        var id = Guid.NewGuid();
        _db.Books.Add(new EpubBookEntity
        {
            Id = id,
            FilePath = $"/books/{id}.epub",
            Title = "Seed Book",
            ImportedUtc = DateTimeOffset.UtcNow,
            LastModifiedUtc = DateTimeOffset.UtcNow,
        });
        await _db.SaveChangesAsync();
        return id;
    }

    [Fact]
    public async Task GetProgress_ReturnsNull_WhenNoProgressExists()
    {
        var bookId = await SeedBookAsync();
        var result = await _repo.GetProgressAsync(bookId);
        Assert.Null(result);
    }

    [Fact]
    public async Task SaveProgress_ThenGet_RoundTripsCfiAndPercentage()
    {
        var bookId = await SeedBookAsync();
        var progress = new ReadingProgress
        {
            Status = ReadingStatus.Reading,
            CurrentCfi = "epubcfi(/6/4[chapter1]!/4/2/1:0)",
            Percentage = 42.5,
            LastReadUtc = DateTimeOffset.UtcNow,
        };

        await _repo.SaveProgressAsync(bookId, progress);
        var result = await _repo.GetProgressAsync(bookId);

        Assert.NotNull(result);
        Assert.Equal(ReadingStatus.Reading, result.Status);
        Assert.Equal("epubcfi(/6/4[chapter1]!/4/2/1:0)", result.CurrentCfi);
        Assert.Equal(42.5, result.Percentage);
    }

    [Fact]
    public async Task SaveProgress_Upsert_SecondSaveOverwritesFirst()
    {
        var bookId = await SeedBookAsync();

        await _repo.SaveProgressAsync(bookId, new ReadingProgress
        {
            Status = ReadingStatus.Reading,
            CurrentCfi = "epubcfi(/6/4!/4/2/1:0)",
            Percentage = 10.0,
        });

        await _repo.SaveProgressAsync(bookId, new ReadingProgress
        {
            Status = ReadingStatus.Reading,
            CurrentCfi = "epubcfi(/6/8!/4/2/1:0)",
            Percentage = 55.0,
        });

        var result = await _repo.GetProgressAsync(bookId);
        Assert.NotNull(result);
        Assert.Equal(55.0, result.Percentage);
        Assert.Equal("epubcfi(/6/8!/4/2/1:0)", result.CurrentCfi);
    }

    [Fact]
    public async Task SaveProgress_CanMarkFinished()
    {
        var bookId = await SeedBookAsync();

        await _repo.SaveProgressAsync(bookId, new ReadingProgress
        {
            Status = ReadingStatus.Finished,
            Percentage = 100.0,
            FinishedUtc = DateTimeOffset.UtcNow,
        });

        var result = await _repo.GetProgressAsync(bookId);
        Assert.NotNull(result);
        Assert.Equal(ReadingStatus.Finished, result.Status);
        Assert.NotNull(result.FinishedUtc);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
