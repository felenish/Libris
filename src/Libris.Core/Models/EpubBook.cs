namespace Libris.Core.Models;

public sealed class EpubBook
{
    public Guid Id { get; init; }
    public string FilePath { get; set; } = string.Empty;
    public bool FileFound { get; set; } = true;
    public BookMetadata Metadata { get; set; } = new();
    public ReadingProgress Progress { get; set; } = new();
    public DateTimeOffset ImportedUtc { get; init; }
    public DateTimeOffset LastModifiedUtc { get; set; }
}

public sealed class BookMetadata
{
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = [];
    public string? SeriesName { get; set; }
    public decimal? SeriesIndex { get; set; }
    public List<string> Genres { get; set; } = [];
    public string? Publisher { get; set; }
    public string? PublishedDate { get; set; }
    public string? Description { get; set; }
    public string? Isbn { get; set; }
    public string? Language { get; set; }
    public string? CoverPath { get; set; }
}

public sealed class ReadingProgress
{
    public ReadingStatus Status { get; set; } = ReadingStatus.NotStarted;
    public string? CurrentCfi { get; set; }
    public double Percentage { get; set; }
    public DateTimeOffset? LastReadUtc { get; set; }
    public DateTimeOffset? StartedUtc { get; set; }
    public DateTimeOffset? FinishedUtc { get; set; }
    public int TotalReadingMinutes { get; set; }
}

public enum ReadingStatus { NotStarted, Reading, Finished }
