using System.Drawing;
using System.Drawing.Imaging;
using Libris.Storage.Tests.Helpers;

namespace Libris.Storage.Tests;

public sealed class CoverCacheManagerTests : IDisposable
{
    private readonly CoverCacheManager _manager = new();
    private readonly List<Guid> _createdCovers = [];

    private static byte[] MakeTestImageBytes(int width = 800, int height = 1200)
    {
        using var bmp = new Bitmap(width, height);
        using var g = Graphics.FromImage(bmp);
        g.Clear(Color.CornflowerBlue);
        using var ms = new MemoryStream();
        bmp.Save(ms, ImageFormat.Jpeg);
        return ms.ToArray();
    }

    [Fact]
    public async Task SaveCover_CreatesFileAtExpectedPath()
    {
        var id = Guid.NewGuid();
        _createdCovers.Add(id);

        var imageBytes = MakeTestImageBytes();
        var path = await _manager.SaveCoverAsync(id, imageBytes);

        Assert.True(File.Exists(path));
        Assert.Equal(id.ToString() + ".jpg", Path.GetFileName(path));
    }

    [Fact]
    public async Task SaveCover_ProducesValidJpegFile()
    {
        var id = Guid.NewGuid();
        _createdCovers.Add(id);

        var path = await _manager.SaveCoverAsync(id, MakeTestImageBytes());

        // Verify the output is a readable JPEG
        using var result = new Bitmap(path);
        Assert.Equal(ImageFormat.Jpeg, result.RawFormat);
    }

    [Fact]
    public async Task SaveCover_ResizesLargeImageToFitWithin400x600()
    {
        var id = Guid.NewGuid();
        _createdCovers.Add(id);

        // Source is 800×1200 — should scale to 400×600
        var path = await _manager.SaveCoverAsync(id, MakeTestImageBytes(800, 1200));

        using var result = new Bitmap(path);
        Assert.True(result.Width <= 400);
        Assert.True(result.Height <= 600);
    }

    [Fact]
    public async Task SaveCover_DoesNotUpscaleSmallImage()
    {
        var id = Guid.NewGuid();
        _createdCovers.Add(id);

        // Source is 100×150 — fits within 400×600, should not be upscaled
        var path = await _manager.SaveCoverAsync(id, MakeTestImageBytes(100, 150));

        using var result = new Bitmap(path);
        Assert.True(result.Width <= 400);
        Assert.True(result.Height <= 600);
    }

    [Fact]
    public async Task GetCoverPath_ReturnsPath_AfterSave()
    {
        var id = Guid.NewGuid();
        _createdCovers.Add(id);

        await _manager.SaveCoverAsync(id, MakeTestImageBytes());

        var path = _manager.GetCoverPath(id);
        Assert.NotNull(path);
        Assert.True(File.Exists(path));
    }

    [Fact]
    public void GetCoverPath_ReturnsNull_WhenCoverNotSaved()
    {
        var path = _manager.GetCoverPath(Guid.NewGuid());
        Assert.Null(path);
    }

    [Fact]
    public async Task DeleteCover_RemovesFile()
    {
        var id = Guid.NewGuid();
        await _manager.SaveCoverAsync(id, MakeTestImageBytes());

        _manager.DeleteCover(id);

        Assert.Null(_manager.GetCoverPath(id));
    }

    public void Dispose()
    {
        foreach (var id in _createdCovers)
            _manager.DeleteCover(id);
    }
}
