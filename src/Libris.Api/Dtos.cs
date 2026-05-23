namespace Libris.Api;

public sealed record BookSummaryDto(
    Guid Id,
    string Title,
    IReadOnlyList<string> Authors,
    string CoverUrl,
    string? SeriesName,
    decimal? SeriesIndex,
    string ReadingStatus,
    double Percentage,
    DateTimeOffset? LastReadUtc,
    bool FileFound);

public sealed record BookDetailDto(
    Guid Id,
    string Title,
    IReadOnlyList<string> Authors,
    string CoverUrl,
    string? SeriesName,
    decimal? SeriesIndex,
    string ReadingStatus,
    double Percentage,
    DateTimeOffset? LastReadUtc,
    bool FileFound,
    string? Description,
    IReadOnlyList<string> Genres,
    string? Publisher,
    string? PublishedDate,
    string? Isbn,
    string? Language,
    DateTimeOffset ImportedUtc);

public sealed record ImportResultDto(
    int ImportedCount,
    int SkippedCount,
    IReadOnlyList<string> Errors);

public sealed record ShelfDto(
    string Id,
    string Label,
    IReadOnlyList<BookSummaryDto> Books);

// Request bodies
public sealed record ImportBookRequest(string FilePath);
public sealed record ImportFolderRequest(string FolderPath);
public sealed record RevealRequest(string Path);

public sealed record UpdateMetadataRequest(
    string? Title,
    List<string>? Authors,
    string? SeriesName,
    decimal? SeriesIndex,
    List<string>? Genres,
    string? Publisher,
    string? PublishedDate,
    string? Description,
    string? Isbn,
    string? Language,
    string? FilePath);
