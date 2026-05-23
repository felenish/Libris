using System.Text.Json;
using Libris.Core.Interfaces;
using Libris.Core.Models;

namespace Libris.Metadata;

public sealed class OpenLibraryMetadataProvider(HttpClient http) : IMetadataProvider
{
    public string ProviderName => "Open Library";

    public async Task<ExternalBookMetadata?> FetchByIsbnAsync(string isbn, CancellationToken ct = default)
    {
        var url = $"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data";
        try
        {
            var json = await http.GetStringAsync(url, ct);
            using var doc = JsonDocument.Parse(json);
            var key = $"ISBN:{isbn}";
            if (!doc.RootElement.TryGetProperty(key, out var entry)) return null;
            return ParseDataEntry(entry);
        }
        catch
        {
            return null;
        }
    }

    public async Task<IReadOnlyList<ExternalBookMetadata>> SearchAsync(
        string title, string? author, CancellationToken ct = default)
    {
        var url = $"https://openlibrary.org/search.json?title={Uri.EscapeDataString(title)}&limit=10";
        if (!string.IsNullOrWhiteSpace(author))
            url += $"&author={Uri.EscapeDataString(author)}";
        try
        {
            var json = await http.GetStringAsync(url, ct);
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("docs", out var docs)
                || docs.ValueKind != JsonValueKind.Array)
                return [];

            var results = new List<ExternalBookMetadata>();
            foreach (var item in docs.EnumerateArray())
            {
                if (results.Count >= 10) break;
                try
                {
                    var parsed = ParseSearchDoc(item);
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

    private ExternalBookMetadata? ParseDataEntry(JsonElement e)
    {
        var title = GetString(e, "title");
        var authors = GetStringArray(e, "authors", "name");
        var publisher = e.TryGetProperty("publishers", out var pp)
            && pp.ValueKind == JsonValueKind.Array && pp.GetArrayLength() > 0
            && pp[0].TryGetProperty("name", out var pn) ? pn.GetString() : null;
        var publishDate = GetString(e, "publish_date");
        var subjects = GetStringArrayFlat(e, "subjects", "name");
        var cover = e.TryGetProperty("cover", out var cv) && cv.ValueKind == JsonValueKind.Object
            ? cv.TryGetProperty("large", out var cl) ? cl.GetString()
              : cv.TryGetProperty("medium", out var cm) ? cm.GetString() : null
            : null;

        return new ExternalBookMetadata
        {
            ProviderName = ProviderName,
            Title = title,
            Authors = authors,
            Publisher = publisher,
            PublishedDate = publishDate,
            Genres = subjects.Take(5).ToList(),
            CoverUrl = cover,
        };
    }

    private ExternalBookMetadata? ParseSearchDoc(JsonElement e)
    {
        var title = GetString(e, "title");
        if (string.IsNullOrWhiteSpace(title)) return null;

        var authors = GetStringArrayFlat(e, "author_name");
        var isbn = GetFirstIsbn13(e);
        var publisher = e.TryGetProperty("publisher", out var pp)
            && pp.ValueKind == JsonValueKind.Array && pp.GetArrayLength() > 0
            ? pp[0].GetString() : null;
        var subjects = GetStringArrayFlat(e, "subject").Take(5).ToList();
        string? year = null;
        if (e.TryGetProperty("first_publish_year", out var fy)
            && fy.ValueKind == JsonValueKind.Number)
            year = fy.GetInt32().ToString();

        string? coverUrl = null;
        if (e.TryGetProperty("cover_i", out var coverId) && coverId.ValueKind == JsonValueKind.Number)
            coverUrl = $"https://covers.openlibrary.org/b/id/{coverId.GetInt32()}-M.jpg";

        return new ExternalBookMetadata
        {
            ProviderName = ProviderName,
            Title = title,
            Authors = authors,
            Isbn = isbn,
            Publisher = publisher,
            PublishedDate = year,
            Genres = subjects,
            CoverUrl = coverUrl,
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

    private static List<string> GetStringArray(JsonElement e, string prop, string subProp)
    {
        if (!e.TryGetProperty(prop, out var arr) || arr.ValueKind != JsonValueKind.Array)
            return [];
        var result = new List<string>();
        foreach (var item in arr.EnumerateArray())
        {
            if (item.TryGetProperty(subProp, out var v) && v.ValueKind == JsonValueKind.String)
            {
                var s = v.GetString();
                if (s is not null) result.Add(s);
            }
        }
        return result;
    }

    private static List<string> GetStringArrayFlat(JsonElement e, string prop, string subProp)
    {
        if (!e.TryGetProperty(prop, out var arr) || arr.ValueKind != JsonValueKind.Array)
            return [];
        var result = new List<string>();
        foreach (var item in arr.EnumerateArray())
        {
            if (item.TryGetProperty(subProp, out var v) && v.ValueKind == JsonValueKind.String)
            {
                var s = v.GetString();
                if (s is not null) result.Add(s);
            }
        }
        return result;
    }

    private static string? GetFirstIsbn13(JsonElement e)
    {
        if (!e.TryGetProperty("isbn", out var isbns)
            || isbns.ValueKind != JsonValueKind.Array) return null;
        foreach (var item in isbns.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.String) continue;
            var s = item.GetString() ?? "";
            if (s.Length == 13) return s;
        }
        return null;
    }
}
