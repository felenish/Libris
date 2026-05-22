using Libris.Core.Models;

namespace Libris.Core.Interfaces;

public interface IMetadataProvider
{
    string ProviderName { get; }
    Task<ExternalBookMetadata?> FetchByIsbnAsync(string isbn, CancellationToken ct = default);
    Task<IReadOnlyList<ExternalBookMetadata>> SearchAsync(string title, string? author, CancellationToken ct = default);
}
