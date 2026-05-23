using Libris.Core.Interfaces;
using Libris.Core.Models;
using Libris.Metadata;

namespace Libris.Api.Services;

public sealed class MetadataService(
    OpenLibraryMetadataProvider openLibrary,
    GoogleBooksMetadataProvider googleBooks,
    ILibraryRepository library,
    ICoverCacheManager covers,
    IHttpClientFactory httpFactory)
{
    public async Task<IReadOnlyList<ExternalBookMetadata>> SearchAsync(
        string title, string? author, CancellationToken ct = default)
    {
        var results = await Task.WhenAll(
            openLibrary.SearchAsync(title, author, ct),
            googleBooks.SearchAsync(title, author, ct));
        return [..results[0], ..results[1]];
    }

    public async Task FetchAndApplyAsync(
        Guid id, ExternalBookMetadata selected, CancellationToken ct = default)
    {
        var book = await library.GetBookAsync(id, ct)
            ?? throw new KeyNotFoundException($"Book {id} not found.");

        if (!string.IsNullOrWhiteSpace(selected.Title))
            book.Metadata.Title = selected.Title;
        if (selected.Authors.Count > 0)
            book.Metadata.Authors = selected.Authors;
        if (!string.IsNullOrWhiteSpace(selected.Publisher))
            book.Metadata.Publisher = selected.Publisher;
        if (!string.IsNullOrWhiteSpace(selected.PublishedDate))
            book.Metadata.PublishedDate = selected.PublishedDate;
        if (!string.IsNullOrWhiteSpace(selected.Description))
            book.Metadata.Description = selected.Description;
        if (!string.IsNullOrWhiteSpace(selected.Isbn))
            book.Metadata.Isbn = selected.Isbn;
        if (!string.IsNullOrWhiteSpace(selected.Language))
            book.Metadata.Language = selected.Language;
        if (selected.Genres.Count > 0)
            book.Metadata.Genres = selected.Genres;

        if (!string.IsNullOrWhiteSpace(selected.CoverUrl))
        {
            try
            {
                using var http = httpFactory.CreateClient();
                var bytes = await http.GetByteArrayAsync(selected.CoverUrl, ct);
                book.Metadata.CoverPath = await covers.SaveCoverAsync(book.Id, bytes, ct);
            }
            catch { }
        }

        book.LastModifiedUtc = DateTimeOffset.UtcNow;
        await library.UpdateBookAsync(book, ct);
    }
}
