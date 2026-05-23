using Libris.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Libris.Api.Controllers;

[ApiController]
[Route("api/books/{id:guid}/progress")]
public sealed class ProgressController(ReadingProgressService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var dto = await service.GetProgressAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPut]
    public async Task<IActionResult> Save(Guid id, [FromBody] SaveProgressRequest req, CancellationToken ct)
    {
        await service.SaveProgressAsync(id, req.Cfi, req.Percentage, ct);
        return NoContent();
    }
}
