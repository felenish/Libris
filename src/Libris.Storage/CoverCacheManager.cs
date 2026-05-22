using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using Libris.Core.Interfaces;

namespace Libris.Storage;

public sealed class CoverCacheManager : ICoverCacheManager
{
    private const int TargetWidth = 400;
    private const int TargetHeight = 600;
    private const long JpegQuality = 85L;

    public Task<string> SaveCoverAsync(Guid bookId, byte[] imageBytes, CancellationToken ct = default)
    {
        LibrisDataPaths.EnsureDirectoriesExist();
        var path = CoverFilePath(bookId);

        using var src = new Bitmap(new MemoryStream(imageBytes));
        var scale = Math.Min((double)TargetWidth / src.Width, (double)TargetHeight / src.Height);
        var destW = Math.Max(1, (int)(src.Width * scale));
        var destH = Math.Max(1, (int)(src.Height * scale));

        using var dest = new Bitmap(destW, destH);
        using (var g = Graphics.FromImage(dest))
        {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.DrawImage(src, 0, 0, destW, destH);
        }

        var encoder = GetJpegEncoder();
        using var encoderParams = new EncoderParameters(1);
        encoderParams.Param[0] = new EncoderParameter(Encoder.Quality, JpegQuality);
        dest.Save(path, encoder, encoderParams);

        return Task.FromResult(path);
    }

    public string? GetCoverPath(Guid bookId)
    {
        var path = CoverFilePath(bookId);
        return File.Exists(path) ? path : null;
    }

    public void DeleteCover(Guid bookId)
    {
        var path = CoverFilePath(bookId);
        if (File.Exists(path))
            File.Delete(path);
    }

    private static string CoverFilePath(Guid bookId) =>
        Path.Combine(LibrisDataPaths.CoversDirectory, $"{bookId}.jpg");

    private static ImageCodecInfo GetJpegEncoder() =>
        ImageCodecInfo.GetImageEncoders().First(e => e.MimeType == "image/jpeg");
}
