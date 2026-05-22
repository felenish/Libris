using System.Text;
using Libris.Core.Interfaces;
using Libris.Core.Models;
using VersOne.Epub;

namespace Libris.Epub;

public sealed class EpubParser : IEpubParser
{
    public async Task<BookMetadata> ExtractMetadataAsync(string filePath, CancellationToken ct = default)
    {
        try
        {
            using var bookRef = await EpubReader.OpenBookAsync(filePath);
            var meta = bookRef.Schema.Package.Metadata;

            var isbn = meta.Identifiers.FirstOrDefault(i =>
                string.Equals(i.Scheme, "isbn", StringComparison.OrdinalIgnoreCase) ||
                (i.Identifier?.StartsWith("978", StringComparison.Ordinal) == true) ||
                (i.Identifier?.StartsWith("979", StringComparison.Ordinal) == true))?.Identifier;

            var seriesName = meta.MetaItems
                .FirstOrDefault(m => m.Name == "calibre:series")?.Content;
            var seriesIndexStr = meta.MetaItems
                .FirstOrDefault(m => m.Name == "calibre:series_index")?.Content;
            decimal? seriesIndex = decimal.TryParse(seriesIndexStr,
                System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var idx) ? idx : null;

            return new BookMetadata
            {
                Title = bookRef.Title ?? string.Empty,
                Authors = bookRef.AuthorList?.ToList() ?? [],
                SeriesName = string.IsNullOrWhiteSpace(seriesName) ? null : seriesName,
                SeriesIndex = seriesIndex,
                Genres = meta.Subjects.Select(s => s.Subject).Where(s => !string.IsNullOrWhiteSpace(s)).ToList()!,
                Publisher = meta.Publishers.FirstOrDefault()?.Publisher,
                PublishedDate = meta.Dates.FirstOrDefault()?.Date,
                Description = meta.Descriptions.FirstOrDefault()?.Description,
                Isbn = isbn,
                Language = meta.Languages.FirstOrDefault()?.Language,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return new BookMetadata();
        }
    }

    public async Task<byte[]?> ExtractCoverAsync(string filePath, CancellationToken ct = default)
    {
        try
        {
            using var bookRef = await EpubReader.OpenBookAsync(filePath);
            var coverRef = bookRef.Content.Cover;
            if (coverRef is null) return null;
            return await coverRef.ReadContentAsync();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return null;
        }
    }

    public async Task<EpubResourceResult?> GetResourceAsync(
        string filePath, string resourcePath, CancellationToken ct = default)
    {
        try
        {
            using var bookRef = await EpubReader.OpenBookAsync(filePath);
            var allFiles = bookRef.Content.AllFiles;

            if (!allFiles.TryGetLocalFileRefByFilePath(resourcePath, out var fileRef))
            {
                fileRef = allFiles.Local.FirstOrDefault(f =>
                    f.FilePath.Equals(resourcePath, StringComparison.OrdinalIgnoreCase));
            }

            if (fileRef is null) return null;

            var mimeType = fileRef.ContentMimeType ?? "application/octet-stream";
            var content = await fileRef.ReadContentAsBytesAsync();
            return new EpubResourceResult(content ?? [], mimeType);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return null;
        }
    }

    public async Task<IReadOnlyList<SpineItem>> GetSpineAsync(
        string filePath, CancellationToken ct = default)
    {
        try
        {
            using var bookRef = await EpubReader.OpenBookAsync(filePath);
            var readingOrder = await bookRef.GetReadingOrderAsync();
            return readingOrder
                .Select(item => new SpineItem(
                    Href: item.FilePath,
                    MediaType: item.ContentMimeType ?? "application/xhtml+xml",
                    Title: null))
                .ToList();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return [];
        }
    }
}
