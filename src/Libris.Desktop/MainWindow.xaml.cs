using System.ComponentModel;
using System.IO;
using System.Text.Json;
using System.Windows;
using Libris.Storage;
using Microsoft.Web.WebView2.Core;

namespace Libris.Desktop;

public partial class MainWindow : Window
{
    private readonly int _port;

    public MainWindow(int port)
    {
        _port = port;
        InitializeComponent();
        RestoreWindowState();
        Loaded += OnLoaded;
        Closing += OnClosing;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        string userDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Libris", "WebView2");
        CoreWebView2Environment env = await CoreWebView2Environment.CreateAsync(userDataFolder: userDataFolder);
        await WebView.EnsureCoreWebView2Async(env);

        WebView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
        WebView.CoreWebView2.Settings.IsNonClientRegionSupportEnabled = true;
        WebView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
        WebView.CoreWebView2.NavigationCompleted += OnNavigationCompleted;
#if DEBUG
        WebView.CoreWebView2.Settings.AreDevToolsEnabled = true;
#else
        WebView.CoreWebView2.Settings.AreDevToolsEnabled = false;
#endif

        WebView.Source = new Uri($"http://localhost:{_port}");
    }

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
    }

    private void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
    }

    private void RestoreWindowState()
    {
        try
        {
            if (!File.Exists(LibrisDataPaths.SettingsPath)) { return; }
            var settings = JsonSerializer.Deserialize<WindowSettings>(
                File.ReadAllText(LibrisDataPaths.SettingsPath));
            if (settings is null) return;

            Left = settings.Left;
            Top = settings.Top;
            Width = settings.Width;
            Height = settings.Height;
            WindowState = settings.State;
        }
        catch (Exception) { }
    }

    private void OnClosing(object? sender, CancelEventArgs e)
    {
        try
        {
            var (l, t, w, h) = WindowState == WindowState.Normal
                ? (Left, Top, Width, Height)
                : (RestoreBounds.Left, RestoreBounds.Top, RestoreBounds.Width, RestoreBounds.Height);

            File.WriteAllText(LibrisDataPaths.SettingsPath,
                JsonSerializer.Serialize(new WindowSettings(l, t, w, h, WindowState)));
        }
        catch { }
    }
}

internal sealed record WindowSettings(
    double Left, double Top, double Width, double Height, WindowState State);
