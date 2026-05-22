using Libris.Core.Models;

namespace Libris.Core.Interfaces;

public interface IEpubParser
{
    Task<BookMetadata> ExtractMetadataAsync(string filePath, CancellationToken ct = default);
    Task<byte[]?> ExtractCoverAsync(string filePath, CancellationToken ct = default);
    Task<EpubResourceResult?> GetResourceAsync(string filePath, string resourcePath, CancellationToken ct = default);
    Task<IReadOnlyList<SpineItem>> GetSpineAsync(string filePath, CancellationToken ct = default);
}
