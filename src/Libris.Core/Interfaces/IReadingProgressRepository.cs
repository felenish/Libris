using Libris.Core.Models;

namespace Libris.Core.Interfaces;

public interface IReadingProgressRepository
{
    Task<ReadingProgress?> GetProgressAsync(Guid bookId, CancellationToken ct = default);
    Task SaveProgressAsync(Guid bookId, ReadingProgress progress, CancellationToken ct = default);
}
