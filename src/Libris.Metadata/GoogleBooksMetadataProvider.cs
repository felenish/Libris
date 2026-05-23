using System.Text.Json;
using Libris.Core.Interfaces;
using Libris.Core.Models;

namespace Libris.Metadata;

public sealed class GoogleBooksMetadataProvider(HttpClient http) : IMetadataProvider
{
    public string ProviderName => "Google Books";

    public async Task<ExternalBookMetadata?> FetchByIsbnAsync(string isbn, CancellationToken ct = default)
    {
        var url = $"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}";
        return await FetchFirstItem(url, ct);
    }

    public async Task<IReadOnlyList<ExternalBookMetadata>> SearchAsync(
        string title, string? author, CancellationToken ct = default)
    {
        var query = Uri.EscapeDataString(title);
        if (!string.IsNullOrWhiteSpace(author))
            query += $"+inauthor:{Uri.EscapeDataString(author)}";
        var url = $"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=10";
        try
        {
            var json = await http.GetStringAsync(url, ct);
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("items", out var items)
                || items.ValueKind != JsonValueKind.Array)
                return [];

            var results = new List<ExternalBookMetadata>();
            foreach (var item in items.EnumerateArray())
            {
                try
                {
                    var parsed = ParseItem(item);
                    if (parsed is not null) results.Add(parsed);
                }
                catch { }
            }
            return results;
        }
        catch
        {
            return [];
        }
    }

    private async Task<ExternalBookMetadata?> FetchFirstItem(string url, CancellationToken ct)
    {
        try
        {
            var json = await http.GetStringAsync(url, ct);
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("items", out var items)
                || items.ValueKind != JsonValueKind.Array
                || items.GetArrayLength() == 0)
                return null;
            return ParseItem(items[0]);
        }
        catch
        {
            return null;
        }
    }

    private ExternalBookMetadata? ParseItem(JsonElement item)
    {
        if (!item.TryGetProperty("volumeInfo", out var vi)
            || vi.ValueKind != JsonValueKind.Object) return null;

        var title = GetString(vi, "title");
        if (string.IsNullOrWhiteSpace(title)) return null;

        var authors = GetStringArrayFlat(vi, "authors");
        var publisher = GetString(vi, "publisher");
        var publishedDate = GetString(vi, "publishedDate");
        var description = GetString(vi, "description");
        var genres = GetStringArrayFlat(vi, "categories");
        var coverUrl = vi.TryGetProperty("imageLinks", out var il)
            && il.ValueKind == JsonValueKind.Object
            && il.TryGetProperty("thumbnail", out var th)
            && th.ValueKind == JsonValueKind.String
            ? th.GetString()?.Replace("http://", "https://") : null;
        var isbn = GetIsbn13(vi);

        return new ExternalBookMetadata
        {
            ProviderName = ProviderName,
            Title = title,
            Authors = authors,
            Publisher = publisher,
            PublishedDate = publishedDate,
            Description = description,
            Genres = genres,
            CoverUrl = coverUrl,
            Isbn = isbn,
        };
    }

    private static string? GetString(JsonElement e, string prop) =>
        e.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String
            ? v.GetString() : null;

    private static List<string> GetStringArrayFlat(JsonElement e, string prop)
    {
        if (!e.TryGetProperty(prop, out var arr) || arr.ValueKind != JsonValueKind.Array)
            return [];
        return arr.EnumerateArray()
            .Where(x => x.ValueKind == JsonValueKind.String)
            .Select(x => x.GetString()!)
            .ToList();
    }

    private static string? GetIsbn13(JsonElement vi)
    {
        if (!vi.TryGetProperty("industryIdentifiers", out var ids)
            || ids.ValueKind != JsonValueKind.Array) return null;
        foreach (var id in ids.EnumerateArray())
        {
            if (id.ValueKind != JsonValueKind.Object) continue;
            if (id.TryGetProperty("type", out var type)
                && type.ValueKind == JsonValueKind.String
                && type.GetString() == "ISBN_13"
                && id.TryGetProperty("identifier", out var ident)
                && ident.ValueKind == JsonValueKind.String)
                return ident.GetString();
        }
        return null;
    }
}
