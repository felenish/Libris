using Libris.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Libris.Api.Controllers;

[ApiController]
[Route("api/shell")]
public sealed class ShellController(IShellService shell) : ControllerBase
{
    [HttpPost("open-file-dialog")]
    public async Task<IActionResult> OpenFileDialog(CancellationToken ct)
    {
        var paths = await shell.OpenFileDialogAsync(ct);
        return Ok(paths);
    }

    [HttpPost("open-folder-dialog")]
    public async Task<IActionResult> OpenFolderDialog(CancellationToken ct)
    {
        var path = await shell.OpenFolderDialogAsync(ct);
        return Ok(path);
    }

    [HttpPost("reveal")]
    public async Task<IActionResult> RevealInExplorer([FromBody] RevealRequest request, CancellationToken ct)
    {
        await shell.RevealInExplorerAsync(request.Path, ct);
        return NoContent();
    }
}
