namespace Libris.Core.Interfaces;

public interface ICoverCacheManager
{
    Task<string> SaveCoverAsync(Guid bookId, byte[] imageBytes, CancellationToken ct = default);
    string? GetCoverPath(Guid bookId);
    void DeleteCover(Guid bookId);
}
