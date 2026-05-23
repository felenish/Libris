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

public sealed record ReadingProgressDto(
    Guid BookId,
    string? CurrentCfi,
    double Percentage,
    string Status,
    DateTimeOffset? LastReadUtc,
    int TotalReadingMinutes);

public sealed record ExternalBookMetadataDto(
    string? Title,
    IReadOnlyList<string> Authors,
    string? Publisher,
    string? PublishedDate,
    string? Description,
    string? Isbn,
    string? Language,
    IReadOnlyList<string> Genres,
    string? CoverUrl);

// Request bodies
public sealed record ImportBookRequest(string FilePath);
public sealed record ImportFolderRequest(string FolderPath);
public sealed record RevealRequest(string Path);

public sealed record SaveProgressRequest(string Cfi, double Percentage);
public sealed record MetadataSearchRequest(string Title, string? Author);

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
