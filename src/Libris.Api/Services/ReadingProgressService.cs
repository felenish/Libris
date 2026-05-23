using Libris.Core.Interfaces;
using Libris.Core.Models;

namespace Libris.Api.Services;

public sealed class ReadingProgressService(IReadingProgressRepository progressRepo)
{
    public async Task<ReadingProgressDto?> GetProgressAsync(Guid id, CancellationToken ct = default)
    {
        var progress = await progressRepo.GetProgressAsync(id, ct);
        return progress is null ? null : ToDto(id, progress);
    }

    public async Task SaveProgressAsync(Guid id, string cfi, double percentage, CancellationToken ct = default)
    {
        var existing = await progressRepo.GetProgressAsync(id, ct);
        var progress = new ReadingProgress
        {
            Status = existing?.Status == ReadingStatus.Finished
                ? ReadingStatus.Finished
                : ReadingStatus.Reading,
            CurrentCfi = cfi,
            Percentage = percentage,
            LastReadUtc = DateTimeOffset.UtcNow,
            StartedUtc = existing?.StartedUtc ?? DateTimeOffset.UtcNow,
            FinishedUtc = existing?.FinishedUtc,
            TotalReadingMinutes = existing?.TotalReadingMinutes ?? 0,
        };
        await progressRepo.SaveProgressAsync(id, progress, ct);
    }

    private static ReadingProgressDto ToDto(Guid id, ReadingProgress p) => new(
        id,
        p.CurrentCfi,
        p.Percentage,
        p.Status.ToString(),
        p.LastReadUtc,
        p.TotalReadingMinutes);
}
