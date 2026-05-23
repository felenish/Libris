using Libris.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Libris.Api.Controllers;

[ApiController]
[Route("api/epub")]
public sealed class EpubController(ILibraryRepository library, IEpubParser parser) : ControllerBase
{
    [HttpGet("{id:guid}/spine")]
    public async Task<IActionResult> GetSpine(Guid id, CancellationToken ct)
    {
        var book = await library.GetBookAsync(id, ct);
        if (book is null) return NotFound();
        var spine = await parser.GetSpineAsync(book.FilePath, ct);
        return Ok(spine);
    }

    [HttpGet("{id:guid}/content/{**resourcePath}")]
    public async Task<IActionResult> GetResource(Guid id, string resourcePath, CancellationToken ct)
    {
        var book = await library.GetBookAsync(id, ct);
        if (book is null) return NotFound();

        var result = await parser.GetResourceAsync(book.FilePath, resourcePath, ct);
        if (result is null) return NotFound();

        return File(result.Content, result.MediaType);
    }
}
