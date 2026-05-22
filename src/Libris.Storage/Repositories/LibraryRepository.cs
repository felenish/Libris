using System.Text.Json;
using Libris.Core.Interfaces;
using Libris.Core.Models;
using Libris.Storage.Data;
using Libris.Storage.Entities;
using Microsoft.EntityFrameworkCore;

namespace Libris.Storage.Repositories;

public sealed class LibraryRepository : ILibraryRepository
{
    private readonly LibrisDbContext _db;

    public LibraryRepository(LibrisDbContext db) => _db = db;

    public async Task<IReadOnlyList<EpubBook>> GetAllBooksAsync(CancellationToken ct = default)
    {
        var entities = await _db.Books
            .Include(b => b.Progress)
            .AsNoTracking()
            .ToListAsync(ct);

        return entities.Select(ToDomain).ToList();
    }

    public async Task<EpubBook?> GetBookAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Books
            .Include(b => b.Progress)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, ct);

        return entity is null ? null : ToDomain(entity);
    }

    public async Task<EpubBook?> GetBookByPathAsync(string filePath, CancellationToken ct = default)
    {
        var entity = await _db.Books
            .Include(b => b.Progress)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.FilePath == filePath, ct);

        return entity is null ? null : ToDomain(entity);
    }

    public async Task AddBookAsync(EpubBook book, CancellationToken ct = default)
    {
        var entity = ToEntity(book);
        _db.Books.Add(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateBookAsync(EpubBook book, CancellationToken ct = default)
    {
        var entity = await _db.Books.FindAsync([book.Id], ct)
            ?? throw new InvalidOperationException($"Book {book.Id} not found.");

        ApplyMetadataToEntity(book, entity);
        entity.FileFound = book.FileFound;
        entity.LastModifiedUtc = book.LastModifiedUtc;
        await _db.SaveChangesAsync(ct);
    }

    public async Task RemoveBookAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Books.FindAsync([id], ct);
        if (entity is not null)
        {
            _db.Books.Remove(entity);
            await _db.SaveChangesAsync(ct);
        }
    }

    private static EpubBook ToDomain(EpubBookEntity e) => new()
    {
        Id = e.Id,
        FilePath = e.FilePath,
        FileFound = e.FileFound,
        ImportedUtc = e.ImportedUtc,
        LastModifiedUtc = e.LastModifiedUtc,
        Metadata = new BookMetadata
        {
            Title = e.Title,
            Authors = Deserialize(e.AuthorsJson),
            SeriesName = e.SeriesName,
            SeriesIndex = e.SeriesIndex,
            Genres = Deserialize(e.GenresJson),
            Publisher = e.Publisher,
            PublishedDate = e.PublishedDate,
            Description = e.Description,
            Isbn = e.Isbn,
            Language = e.Language,
            CoverPath = e.CoverPath,
        },
        Progress = e.Progress is null ? new ReadingProgress() : new ReadingProgress
        {
            Status = e.Progress.Status,
            CurrentCfi = e.Progress.CurrentCfi,
            Percentage = e.Progress.Percentage,
            LastReadUtc = e.Progress.LastReadUtc,
            StartedUtc = e.Progress.StartedUtc,
            FinishedUtc = e.Progress.FinishedUtc,
            TotalReadingMinutes = e.Progress.TotalReadingMinutes,
        },
    };

    private static EpubBookEntity ToEntity(EpubBook book)
    {
        var entity = new EpubBookEntity
        {
            Id = book.Id,
            FilePath = book.FilePath,
            FileFound = book.FileFound,
            ImportedUtc = book.ImportedUtc,
            LastModifiedUtc = book.LastModifiedUtc,
        };
        ApplyMetadataToEntity(book, entity);
        return entity;
    }

    private static void ApplyMetadataToEntity(EpubBook book, EpubBookEntity entity)
    {
        var m = book.Metadata;
        entity.Title = m.Title;
        entity.AuthorsJson = Serialize(m.Authors);
        entity.SeriesName = m.SeriesName;
        entity.SeriesIndex = m.SeriesIndex;
        entity.GenresJson = Serialize(m.Genres);
        entity.Publisher = m.Publisher;
        entity.PublishedDate = m.PublishedDate;
        entity.Description = m.Description;
        entity.Isbn = m.Isbn;
        entity.Language = m.Language;
        entity.CoverPath = m.CoverPath;
    }

    private static List<string> Deserialize(string json) =>
        JsonSerializer.Deserialize<List<string>>(json) ?? [];

    private static string Serialize(List<string> list) =>
        JsonSerializer.Serialize(list);
}
