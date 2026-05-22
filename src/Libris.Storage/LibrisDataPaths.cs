namespace Libris.Storage;

public static class LibrisDataPaths
{
    private static readonly string _appData =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Libris");

    public static string DatabasePath => Path.Combine(_appData, "library.db");
    public static string CoversDirectory => Path.Combine(_appData, "covers");
    public static string SettingsPath => Path.Combine(_appData, "settings.json");

    public static void EnsureDirectoriesExist()
    {
        Directory.CreateDirectory(_appData);
        Directory.CreateDirectory(CoversDirectory);
    }
}
