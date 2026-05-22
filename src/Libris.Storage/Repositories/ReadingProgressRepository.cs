using Libris.Core.Interfaces;
using Libris.Core.Models;
using Libris.Storage.Data;
using Libris.Storage.Entities;
using Microsoft.EntityFrameworkCore;

namespace Libris.Storage.Repositories;

public sealed class ReadingProgressRepository : IReadingProgressRepository
{
    private readonly LibrisDbContext _db;

    public ReadingProgressRepository(LibrisDbContext db) => _db = db;

    public async Task<ReadingProgress?> GetProgressAsync(Guid bookId, CancellationToken ct = default)
    {
        var entity = await _db.ReadingProgress
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.BookId == bookId, ct);

        return entity is null ? null : ToDomain(entity);
    }

    public async Task SaveProgressAsync(Guid bookId, ReadingProgress progress, CancellationToken ct = default)
    {
        var entity = await _db.ReadingProgress.FindAsync([bookId], ct);

        if (entity is null)
        {
            entity = new ReadingProgressEntity { BookId = bookId };
            _db.ReadingProgress.Add(entity);
        }

        entity.Status = progress.Status;
        entity.CurrentCfi = progress.CurrentCfi;
        entity.Percentage = progress.Percentage;
        entity.LastReadUtc = progress.LastReadUtc;
        entity.StartedUtc = progress.StartedUtc;
        entity.FinishedUtc = progress.FinishedUtc;
        entity.TotalReadingMinutes = progress.TotalReadingMinutes;

        await _db.SaveChangesAsync(ct);
    }

    private static ReadingProgress ToDomain(ReadingProgressEntity e) => new()
    {
        Status = e.Status,
        CurrentCfi = e.CurrentCfi,
        Percentage = e.Percentage,
        LastReadUtc = e.LastReadUtc,
        StartedUtc = e.StartedUtc,
        FinishedUtc = e.FinishedUtc,
        TotalReadingMinutes = e.TotalReadingMinutes,
    };
}
