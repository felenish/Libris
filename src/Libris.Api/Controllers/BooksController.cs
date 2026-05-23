using Libris.Api.Services;
using Libris.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Libris.Api.Controllers;

[ApiController]
[Route("api/books")]
public sealed class BooksController(LibraryService library, ICoverCacheManager covers) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBook(Guid id, CancellationToken ct)
    {
        var book = await library.GetBookAsync(id, ct);
        if (book is null) return NotFound();
        return Ok(book);
    }

    [HttpPut("{id:guid}/metadata")]
    public async Task<IActionResult> UpdateMetadata(
        Guid id, [FromBody] UpdateMetadataRequest request, CancellationToken ct)
    {
        try
        {
            await library.UpdateMetadataAsync(id, request, ct);
            var updated = await library.GetBookAsync(id, ct);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id:guid}/cover")]
    public IActionResult GetCover(Guid id)
    {
        var path = covers.GetCoverPath(id);
        if (path is null || !System.IO.File.Exists(path))
            return NotFound();
        return PhysicalFile(path, "image/jpeg");
    }

    [HttpPut("{id:guid}/cover")]
    public async Task<IActionResult> UpdateCover(Guid id, IFormFile file, CancellationToken ct)
    {
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);
        await covers.SaveCoverAsync(id, ms.ToArray(), ct);
        return NoContent();
    }
}
