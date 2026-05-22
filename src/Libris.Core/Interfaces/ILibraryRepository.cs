using Libris.Core.Models;

namespace Libris.Core.Interfaces;

public interface ILibraryRepository
{
    Task<IReadOnlyList<EpubBook>> GetAllBooksAsync(CancellationToken ct = default);
    Task<EpubBook?> GetBookAsync(Guid id, CancellationToken ct = default);
    Task<EpubBook?> GetBookByPathAsync(string filePath, CancellationToken ct = default);
    Task AddBookAsync(EpubBook book, CancellationToken ct = default);
    Task UpdateBookAsync(EpubBook book, CancellationToken ct = default);
    Task RemoveBookAsync(Guid id, CancellationToken ct = default);
}
