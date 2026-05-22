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
            var book = await EpubReader.ReadBookAsync(filePath);
            var meta = book.Schema.Package.Metadata;

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
                Title = book.Title ?? string.Empty,
                Authors = book.AuthorList?.ToList() ?? [],
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
            var book = await EpubReader.ReadBookAsync(filePath);
            return book.Content.Cover?.Content;
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
            var book = await EpubReader.ReadBookAsync(filePath);
            var allFiles = book.Content.AllFiles;

            // Try exact FilePath match first, then case-insensitive fallback
            if (!allFiles.TryGetLocalFileByFilePath(resourcePath, out var file))
            {
                file = allFiles.Local.FirstOrDefault(f =>
                    f.FilePath.Equals(resourcePath, StringComparison.OrdinalIgnoreCase));
            }

            if (file is null) return null;

            var mimeType = file.ContentMimeType ?? "application/octet-stream";

            byte[] content = file switch
            {
                EpubLocalByteContentFile byteFile => byteFile.Content ?? [],
                EpubLocalTextContentFile textFile => Encoding.UTF8.GetBytes(textFile.Content ?? string.Empty),
                _ => [],
            };

            return new EpubResourceResult(content, mimeType);
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
            var book = await EpubReader.ReadBookAsync(filePath);
            return book.ReadingOrder
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
