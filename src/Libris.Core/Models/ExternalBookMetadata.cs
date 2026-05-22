namespace Libris.Core.Models;

public sealed class ExternalBookMetadata
{
    public string ProviderName { get; init; } = string.Empty;
    public string? Title { get; init; }
    public List<string> Authors { get; init; } = [];
    public string? SeriesName { get; init; }
    public List<string> Genres { get; init; } = [];
    public string? Publisher { get; init; }
    public string? PublishedDate { get; init; }
    public string? Description { get; init; }
    public string? Isbn { get; init; }
    public string? Language { get; init; }
    public string? CoverUrl { get; init; }
    public double MatchConfidence { get; init; }
}
