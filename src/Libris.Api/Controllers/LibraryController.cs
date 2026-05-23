using Libris.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Libris.Api.Controllers;

[ApiController]
[Route("api/library")]
public sealed class LibraryController(LibraryService library) : ControllerBase
{
    [HttpGet("books")]
    public async Task<IActionResult> GetBooks(CancellationToken ct)
    {
        var books = await library.GetAllBooksAsync(ct);
        return Ok(books);
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportBook([FromBody] ImportBookRequest request, CancellationToken ct)
    {
        var result = await library.ImportAsync(request.FilePath, ct);
        return Ok(result);
    }

    [HttpPost("import-folder")]
    public async Task<IActionResult> ImportFolder([FromBody] ImportFolderRequest request, CancellationToken ct)
    {
        var result = await library.ImportFolderAsync(request.FolderPath, ct);
        return Ok(result);
    }

    [HttpDelete("books/{id:guid}")]
    public async Task<IActionResult> RemoveBook(Guid id, CancellationToken ct)
    {
        await library.RemoveAsync(id, ct);
        return NoContent();
    }
}
