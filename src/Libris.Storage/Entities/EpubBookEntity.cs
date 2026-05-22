namespace Libris.Storage.Entities;

public sealed class EpubBookEntity
{
    public Guid Id { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public bool FileFound { get; set; } = true;

    // Metadata columns
    public string Title { get; set; } = string.Empty;
    public string AuthorsJson { get; set; } = "[]";
    public string? SeriesName { get; set; }
    public decimal? SeriesIndex { get; set; }
    public string GenresJson { get; set; } = "[]";
    public string? Publisher { get; set; }
    public string? PublishedDate { get; set; }
    public string? Description { get; set; }
    public string? Isbn { get; set; }
    public string? Language { get; set; }
    public string? CoverPath { get; set; }

    public DateTimeOffset ImportedUtc { get; set; }
    public DateTimeOffset LastModifiedUtc { get; set; }

    public ReadingProgressEntity? Progress { get; set; }
}
