using System.Diagnostics;
using System.Windows;
using Libris.Core.Interfaces;
using Microsoft.Win32;

namespace Libris.Desktop;

internal sealed class WpfShellService : IShellService
{
    public Task<IReadOnlyList<string>> OpenFileDialogAsync(CancellationToken ct = default)
    {
        var tcs = new TaskCompletionSource<IReadOnlyList<string>>();
        Application.Current.Dispatcher.InvokeAsync(() =>
        {
            var dialog = new OpenFileDialog
            {
                Filter = "EPUB files (*.epub)|*.epub",
                Multiselect = true,
                Title = "Import EPUB files",
            };
            tcs.SetResult(dialog.ShowDialog() == true ? dialog.FileNames : []);
        });
        return tcs.Task;
    }

    public Task<string?> OpenFolderDialogAsync(CancellationToken ct = default)
    {
        var tcs = new TaskCompletionSource<string?>();
        Application.Current.Dispatcher.InvokeAsync(() =>
        {
            var dialog = new OpenFolderDialog { Title = "Select folder to import" };
            tcs.SetResult(dialog.ShowDialog() == true ? dialog.FolderName : null);
        });
        return tcs.Task;
    }

    public Task RevealInExplorerAsync(string path, CancellationToken ct = default)
    {
        Process.Start("explorer.exe", $"/select,\"{path}\"");
        return Task.CompletedTask;
    }
}
