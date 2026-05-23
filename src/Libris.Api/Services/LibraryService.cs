using Libris.Core.Interfaces;
using Libris.Core.Models;

namespace Libris.Api.Services;

public sealed class LibraryService(
    ILibraryRepository library,
    IEpubParser parser,
    ICoverCacheManager covers)
{
    public async Task<IReadOnlyList<BookSummaryDto>> GetAllBooksAsync(CancellationToken ct = default)
    {
        var books = await library.GetAllBooksAsync(ct);
        return books.Select(b => b.ToSummary()).ToList();
    }

    public async Task<BookDetailDto?> GetBookAsync(Guid id, CancellationToken ct = default)
    {
        var book = await library.GetBookAsync(id, ct);
        return book?.ToDetail();
    }

    public async Task<ImportResultDto> ImportAsync(string filePath, CancellationToken ct = default)
    {
        if (!File.Exists(filePath))
            return new ImportResultDto(0, 0, [$"File not found: {filePath}"]);

        if (await library.GetBookByPathAsync(filePath, ct) is not null)
            return new ImportResultDto(0, 1, []);

        var metadata = await parser.ExtractMetadataAsync(filePath, ct);
        var book = new EpubBook
        {
            Id = Guid.NewGuid(),
            FilePath = filePath,
            FileFound = true,
            Metadata = metadata,
            ImportedUtc = DateTimeOffset.UtcNow,
            LastModifiedUtc = DateTimeOffset.UtcNow,
        };

        var coverBytes = await parser.ExtractCoverAsync(filePath, ct);
        if (coverBytes is not null)
            book.Metadata.CoverPath = await covers.SaveCoverAsync(book.Id, coverBytes, ct);

        await library.AddBookAsync(book, ct);
        return new ImportResultDto(1, 0, []);
    }

    public async Task<ImportResultDto> ImportFolderAsync(string folderPath, CancellationToken ct = default)
    {
        if (!Directory.Exists(folderPath))
            return new ImportResultDto(0, 0, [$"Folder not found: {folderPath}"]);

        var files = Directory.GetFiles(folderPath, "*.epub", SearchOption.AllDirectories);
        var imported = 0;
        var skipped = 0;
        var errors = new List<string>();

        foreach (var file in files)
        {
            try
            {
                var result = await ImportAsync(file, ct);
                imported += result.ImportedCount;
                skipped += result.SkippedCount;
                errors.AddRange(result.Errors);
            }
            catch (Exception ex)
            {
                errors.Add($"{Path.GetFileName(file)}: {ex.Message}");
            }
        }

        return new ImportResultDto(imported, skipped, errors);
    }

    public async Task UpdateMetadataAsync(Guid id, UpdateMetadataRequest req, CancellationToken ct = default)
    {
        var book = await library.GetBookAsync(id, ct)
            ?? throw new KeyNotFoundException($"Book {id} not found.");

        if (req.Title is not null) book.Metadata.Title = req.Title;
        if (req.Authors is not null) book.Metadata.Authors = req.Authors;
        if (req.SeriesName is not null) book.Metadata.SeriesName = req.SeriesName;
        if (req.SeriesIndex is not null) book.Metadata.SeriesIndex = req.SeriesIndex;
        if (req.Genres is not null) book.Metadata.Genres = req.Genres;
        if (req.Publisher is not null) book.Metadata.Publisher = req.Publisher;
        if (req.PublishedDate is not null) book.Metadata.PublishedDate = req.PublishedDate;
        if (req.Description is not null) book.Metadata.Description = req.Description;
        if (req.Isbn is not null) book.Metadata.Isbn = req.Isbn;
        if (req.Language is not null) book.Metadata.Language = req.Language;
        if (req.FilePath is not null) book.FilePath = req.FilePath;

        book.LastModifiedUtc = DateTimeOffset.UtcNow;
        await library.UpdateBookAsync(book, ct);
    }

    public async Task RemoveAsync(Guid id, CancellationToken ct = default)
    {
        covers.DeleteCover(id);
        await library.RemoveBookAsync(id, ct);
    }
}
