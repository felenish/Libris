using Libris.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Libris.Api.Controllers;

[ApiController]
[Route("api/shelves")]
public sealed class ShelvesController(ShelfService shelves) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetShelves(CancellationToken ct)
    {
        var result = await shelves.GetAllShelvesAsync(ct);
        return Ok(result);
    }

    [HttpGet("continue-reading")]
    public async Task<IActionResult> GetContinueReading(CancellationToken ct)
    {
        var result = await shelves.GetContinueReadingAsync(ct);
        return Ok(result);
    }
}
