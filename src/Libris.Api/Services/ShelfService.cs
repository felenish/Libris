using Libris.Core.Interfaces;
using Libris.Core.Models;

namespace Libris.Api.Services;

public sealed class ShelfService(ILibraryRepository library)
{
    public async Task<IReadOnlyList<ShelfDto>> GetAllShelvesAsync(CancellationToken ct = default)
    {
        var books = await library.GetAllBooksAsync(ct);
        var shelves = new List<ShelfDto>();

        var reading = books
            .Where(b => b.Progress.Status == ReadingStatus.Reading)
            .OrderByDescending(b => b.Progress.LastReadUtc)
            .ToList();
        if (reading.Count > 0)
            shelves.Add(Shelf("continue-reading", "Continue Reading", reading));

        var recent = books.OrderByDescending(b => b.ImportedUtc).Take(20).ToList();
        if (recent.Count > 0)
            shelves.Add(Shelf("recently-added", "Recently Added", recent));

        foreach (var group in books
            .SelectMany(b => b.Metadata.Authors.Select(a => (Author: a, Book: b)))
            .GroupBy(x => x.Author, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key))
        {
            shelves.Add(Shelf(
                $"author-{Slugify(group.Key)}",
                group.Key,
                group.OrderBy(x => x.Book.Metadata.Title).Select(x => x.Book).ToList()));
        }

        foreach (var group in books
            .Where(b => b.Metadata.SeriesName is not null)
            .GroupBy(b => b.Metadata.SeriesName!, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key))
        {
            shelves.Add(Shelf(
                $"series-{Slugify(group.Key)}",
                group.Key,
                group.OrderBy(b => b.Metadata.SeriesIndex ?? 0).ToList()));
        }

        foreach (var group in books
            .SelectMany(b => b.Metadata.Genres.Select(g => (Genre: g, Book: b)))
            .GroupBy(x => x.Genre, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key))
        {
            shelves.Add(Shelf(
                $"genre-{Slugify(group.Key)}",
                group.Key,
                group.OrderBy(x => x.Book.Metadata.Title).Select(x => x.Book).ToList()));
        }

        return shelves;
    }

    public async Task<ShelfDto> GetContinueReadingAsync(CancellationToken ct = default)
    {
        var books = await library.GetAllBooksAsync(ct);
        var reading = books
            .Where(b => b.Progress.Status == ReadingStatus.Reading)
            .OrderByDescending(b => b.Progress.LastReadUtc)
            .ToList();
        return Shelf("continue-reading", "Continue Reading", reading);
    }

    private static ShelfDto Shelf(string id, string label, IEnumerable<EpubBook> books) =>
        new(id, label, books.Select(b => b.ToSummary()).ToList());

    private static string Slugify(string s) =>
        new string(s.ToLowerInvariant().Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());
}
