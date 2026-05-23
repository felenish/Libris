using Libris.Epub.Tests.Fixtures;

namespace Libris.Epub.Tests;

public sealed class EpubParserTests : IDisposable
{
    private readonly EpubParser _parser = new();

    // Real EPUB: The Agartha Loop: Loop 2 by Ravensdagger (Mango Media LLC, 2024)
    private static readonly string RealEpubPath =
        Path.Combine(AppContext.BaseDirectory, "Fixtures", "AgarthaLoop2.epub");

    private readonly string _noCoverPath = TestEpubBuilder.CreateNoCoverBook();

    // ── Metadata extraction ──────────────────────────────────────────────────

    [Fact]
    public async Task ExtractMetadata_ReturnsTitle()
    {
        var metadata = await _parser.ExtractMetadataAsync(RealEpubPath);
        Assert.Equal("The Agartha Loop: Loop 2", metadata.Title);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsAuthor()
    {
        var metadata = await _parser.ExtractMetadataAsync(RealEpubPath);
        Assert.Contains("Ravensdagger", metadata.Authors);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsLanguage()
    {
        var metadata = await _parser.ExtractMetadataAsync(RealEpubPath);
        Assert.Equal("en", metadata.Language);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsPublisher()
    {
        var metadata = await _parser.ExtractMetadataAsync(RealEpubPath);
        Assert.Equal("Mango Media LLC", metadata.Publisher);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsNullIsbn_WhenOnlyAsinPresent()
    {
        // Book has MOBI-ASIN (B0D7Q7CNF2) and UUID, but no ISBN-13
        var metadata = await _parser.ExtractMetadataAsync(RealEpubPath);
        Assert.Null(metadata.Isbn);
    }

    // ── Cover extraction ─────────────────────────────────────────────────────

    [Fact]
    public async Task ExtractCover_ReturnsNonNullBytesWhenCoverPresent()
    {
        var bytes = await _parser.ExtractCoverAsync(RealEpubPath);
        Assert.NotNull(bytes);
        Assert.NotEmpty(bytes);
    }

    [Fact]
    public async Task ExtractCover_ReturnsNullWhenNoCoverInManifest()
    {
        var bytes = await _parser.ExtractCoverAsync(_noCoverPath);
        Assert.Null(bytes);
    }

    // ── Resource serving ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetResource_ReturnsBytesAndMimeTypeForCssFile()
    {
        var result = await _parser.GetResourceAsync(RealEpubPath, "stylesheet.css");
        Assert.NotNull(result);
        Assert.Equal("text/css", result.MediaType);
        Assert.NotEmpty(result.Content);
    }

    [Fact]
    public async Task GetResource_ReturnsNullForUnknownPath()
    {
        var result = await _parser.GetResourceAsync(RealEpubPath, "OEBPS/doesnotexist.xhtml");
        Assert.Null(result);
    }

    [Fact]
    public async Task GetResource_ReturnsCoverImageBytes()
    {
        var result = await _parser.GetResourceAsync(RealEpubPath, "cover.jpeg");
        Assert.NotNull(result);
        Assert.Equal("image/jpeg", result.MediaType);
        Assert.NotEmpty(result.Content);
    }

    // ── Spine ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetSpine_ReturnsExpectedItemCount()
    {
        var spine = await _parser.GetSpineAsync(RealEpubPath);
        // titlepage + 43 chapter files
        Assert.Equal(44, spine.Count);
    }

    [Fact]
    public async Task GetSpine_ReturnsXhtmlMimeType()
    {
        var spine = await _parser.GetSpineAsync(RealEpubPath);
        Assert.All(spine, item => Assert.Equal("application/xhtml+xml", item.MediaType));
    }

    // ── Error resilience ─────────────────────────────────────────────────────

    [Fact]
    public async Task ExtractMetadata_ReturnsEmptyMetadataForNonExistentFile()
    {
        var metadata = await _parser.ExtractMetadataAsync("C:\\does\\not\\exist.epub");
        Assert.NotNull(metadata);
        Assert.Equal(string.Empty, metadata.Title);
    }

    [Fact]
    public async Task ExtractCover_ReturnsNullForNonExistentFile()
    {
        var result = await _parser.ExtractCoverAsync("C:\\does\\not\\exist.epub");
        Assert.Null(result);
    }

    public void Dispose()
    {
        try { if (File.Exists(_noCoverPath)) File.Delete(_noCoverPath); }
        catch (IOException) { }
    }
}
