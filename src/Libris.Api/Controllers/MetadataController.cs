using Libris.Api.Services;
using Libris.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace Libris.Api.Controllers;

[ApiController]
public sealed class MetadataController(MetadataService service) : ControllerBase
{
    [HttpPost("api/metadata/search")]
    public async Task<IActionResult> Search([FromBody] MetadataSearchRequest req, CancellationToken ct)
    {
        var results = await service.SearchAsync(req.Title, req.Author, ct);
        return Ok(results.Select(ToDto).ToList());
    }

    [HttpPost("api/books/{id:guid}/metadata/fetch")]
    public async Task<IActionResult> FetchAndApply(
        Guid id, [FromBody] ExternalBookMetadataDto dto, CancellationToken ct)
    {
        var model = new ExternalBookMetadata
        {
            ProviderName = string.Empty,
            Title = dto.Title,
            Authors = dto.Authors.ToList(),
            Publisher = dto.Publisher,
            PublishedDate = dto.PublishedDate,
            Description = dto.Description,
            Isbn = dto.Isbn,
            Language = dto.Language,
            Genres = dto.Genres.ToList(),
            CoverUrl = dto.CoverUrl,
        };
        try
        {
            await service.FetchAndApplyAsync(id, model, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private static ExternalBookMetadataDto ToDto(ExternalBookMetadata m) => new(
        m.Title,
        m.Authors,
        m.Publisher,
        m.PublishedDate,
        m.Description,
        m.Isbn,
        m.Language,
        m.Genres,
        m.CoverUrl);
}
