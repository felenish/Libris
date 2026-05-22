using Libris.Epub.Tests.Fixtures;

namespace Libris.Epub.Tests;

public sealed class EpubParserTests : IDisposable
{
    private readonly EpubParser _parser = new();
    private readonly string _fullBookPath;
    private readonly string _noCoverPath;

    public EpubParserTests()
    {
        _fullBookPath = TestEpubBuilder.CreateFullBook();
        _noCoverPath = TestEpubBuilder.CreateNoCoverBook();
    }

    // ── Metadata extraction ──────────────────────────────────────────────────

    [Fact]
    public async Task ExtractMetadata_ReturnsTitle()
    {
        var metadata = await _parser.ExtractMetadataAsync(_fullBookPath);
        Assert.Equal("Test Book Title", metadata.Title);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsAuthors()
    {
        var metadata = await _parser.ExtractMetadataAsync(_fullBookPath);
        Assert.Contains("Test Author", metadata.Authors);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsIsbn()
    {
        var metadata = await _parser.ExtractMetadataAsync(_fullBookPath);
        Assert.Equal("9780000000001", metadata.Isbn);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsLanguage()
    {
        var metadata = await _parser.ExtractMetadataAsync(_fullBookPath);
        Assert.Equal("en", metadata.Language);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsPublisher()
    {
        var metadata = await _parser.ExtractMetadataAsync(_fullBookPath);
        Assert.Equal("Test Publisher", metadata.Publisher);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsDescription()
    {
        var metadata = await _parser.ExtractMetadataAsync(_fullBookPath);
        Assert.Equal("A test book description.", metadata.Description);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsCalibreSeriesName()
    {
        var metadata = await _parser.ExtractMetadataAsync(_fullBookPath);
        Assert.Equal("Test Series", metadata.SeriesName);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsCalibreSeriesIndex()
    {
        var metadata = await _parser.ExtractMetadataAsync(_fullBookPath);
        Assert.Equal(1m, metadata.SeriesIndex);
    }

    [Fact]
    public async Task ExtractMetadata_ReturnsGenres()
    {
        var metadata = await _parser.ExtractMetadataAsync(_fullBookPath);
        Assert.Contains("Fiction", metadata.Genres);
    }

    // ── Cover extraction ─────────────────────────────────────────────────────

    [Fact]
    public async Task ExtractCover_ReturnsNonNullBytesWhenCoverPresent()
    {
        var bytes = await _parser.ExtractCoverAsync(_fullBookPath);
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
    public async Task GetResource_ReturnsBytesAndMimeTypeForKnownFile()
    {
        var result = await _parser.GetResourceAsync(_fullBookPath, "OEBPS/style.css");
        Assert.NotNull(result);
        Assert.Equal("text/css", result.MediaType);
        Assert.NotEmpty(result.Content);
    }

    [Fact]
    public async Task GetResource_ReturnsNullForUnknownPath()
    {
        var result = await _parser.GetResourceAsync(_fullBookPath, "OEBPS/doesnotexist.xhtml");
        Assert.Null(result);
    }

    [Fact]
    public async Task GetResource_ReturnsCoverImageBytes()
    {
        var result = await _parser.GetResourceAsync(_fullBookPath, "OEBPS/cover.jpg");
        Assert.NotNull(result);
        Assert.Equal("image/jpeg", result.MediaType);
        Assert.NotEmpty(result.Content);
    }

    // ── Spine ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetSpine_ReturnsItemsInOrder()
    {
        var spine = await _parser.GetSpineAsync(_fullBookPath);
        Assert.Equal(2, spine.Count);
        Assert.Contains("chapter1.xhtml", spine[0].Href);
        Assert.Contains("chapter2.xhtml", spine[1].Href);
    }

    [Fact]
    public async Task GetSpine_ReturnsXhtmlMimeType()
    {
        var spine = await _parser.GetSpineAsync(_fullBookPath);
        Assert.All(spine, item => Assert.Equal("application/xhtml+xml", item.MediaType));
    }

    // ── Diagnostic (remove once all tests pass) ──────────────────────────────

    [Fact]
    public async Task Diag_DumpRawSchema()
    {
        using var bookRef = await VersOne.Epub.EpubReader.OpenBookAsync(_fullBookPath);
        var meta = bookRef.Schema.Package.Metadata;
        Assert.True(false,
            $"Title='{bookRef.Title}' Author='{bookRef.Author}' " +
            $"AuthorList.Count={bookRef.AuthorList?.Count} " +
            $"Creators.Count={meta.Creators.Count} " +
            $"Subjects.Count={meta.Subjects.Count} " +
            $"MetaItems.Count={meta.MetaItems.Count} " +
            $"MetaItem[0]={meta.MetaItems.FirstOrDefault()?.Name}={meta.MetaItems.FirstOrDefault()?.Content}");
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
        // VersOne.Epub may hold the file handle briefly after disposal on Windows;
        // swallow the IOException and let the OS clean temp files on next boot.
        TryDelete(_fullBookPath);
        TryDelete(_noCoverPath);

        static void TryDelete(string path)
        {
            try { if (File.Exists(path)) File.Delete(path); }
            catch (IOException) { }
        }
    }
}
