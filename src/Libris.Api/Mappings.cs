using Libris.Core.Models;

namespace Libris.Api;

internal static class Mappings
{
    internal static BookSummaryDto ToSummary(this EpubBook b) => new(
        b.Id,
        b.Metadata.Title,
        b.Metadata.Authors,
        $"/api/books/{b.Id}/cover",
        b.Metadata.SeriesName,
        b.Metadata.SeriesIndex,
        b.Progress.Status.ToString(),
        b.Progress.Percentage,
        b.Progress.LastReadUtc,
        b.FileFound);

    internal static BookDetailDto ToDetail(this EpubBook b) => new(
        b.Id,
        b.Metadata.Title,
        b.Metadata.Authors,
        $"/api/books/{b.Id}/cover",
        b.Metadata.SeriesName,
        b.Metadata.SeriesIndex,
        b.Progress.Status.ToString(),
        b.Progress.Percentage,
        b.Progress.LastReadUtc,
        b.FileFound,
        b.Metadata.Description,
        b.Metadata.Genres,
        b.Metadata.Publisher,
        b.Metadata.PublishedDate,
        b.Metadata.Isbn,
        b.Metadata.Language,
        b.ImportedUtc);
}
