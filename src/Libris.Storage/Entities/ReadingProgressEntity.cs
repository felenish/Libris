using Libris.Core.Models;

namespace Libris.Storage.Entities;

public sealed class ReadingProgressEntity
{
    public Guid BookId { get; set; }
    public ReadingStatus Status { get; set; } = ReadingStatus.NotStarted;
    public string? CurrentCfi { get; set; }
    public double Percentage { get; set; }
    public DateTimeOffset? LastReadUtc { get; set; }
    public DateTimeOffset? StartedUtc { get; set; }
    public DateTimeOffset? FinishedUtc { get; set; }
    public int TotalReadingMinutes { get; set; }

    public EpubBookEntity? Book { get; set; }
}
