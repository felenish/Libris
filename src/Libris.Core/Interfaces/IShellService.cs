namespace Libris.Core.Interfaces;

public interface IShellService
{
    Task<IReadOnlyList<string>> OpenFileDialogAsync(CancellationToken ct = default);
    Task<string?> OpenFolderDialogAsync(CancellationToken ct = default);
    Task RevealInExplorerAsync(string path, CancellationToken ct = default);
}
