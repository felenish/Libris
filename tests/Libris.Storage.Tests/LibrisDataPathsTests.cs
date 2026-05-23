namespace Libris.Storage.Tests;

public sealed class LibrisDataPathsTests
{
    [Fact]
    public void DatabasePath_EndsWithExpectedFileName()
    {
        Assert.EndsWith("library.db", LibrisDataPaths.DatabasePath, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CoversDirectory_IsInsideAppDataLibris()
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        Assert.StartsWith(appData, LibrisDataPaths.CoversDirectory, StringComparison.OrdinalIgnoreCase);
        Assert.EndsWith("covers", LibrisDataPaths.CoversDirectory, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void SettingsPath_EndsWithExpectedFileName()
    {
        Assert.EndsWith("settings.json", LibrisDataPaths.SettingsPath, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void AllPaths_ShareSameParentDirectory()
    {
        var dbParent = Path.GetDirectoryName(LibrisDataPaths.DatabasePath)!;
        var settingsParent = Path.GetDirectoryName(LibrisDataPaths.SettingsPath)!;
        var coversParent = Path.GetDirectoryName(LibrisDataPaths.CoversDirectory)!;

        Assert.Equal(dbParent, settingsParent, StringComparer.OrdinalIgnoreCase);
        Assert.Equal(dbParent, coversParent, StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public void EnsureDirectoriesExist_CreatesDirectories()
    {
        LibrisDataPaths.EnsureDirectoriesExist();

        Assert.True(Directory.Exists(Path.GetDirectoryName(LibrisDataPaths.DatabasePath)));
        Assert.True(Directory.Exists(LibrisDataPaths.CoversDirectory));
    }
}
