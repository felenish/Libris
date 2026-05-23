using System.ComponentModel;
using System.IO;
using System.Text.Json;
using System.Windows;
using Libris.Storage;

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
        await WebView.EnsureCoreWebView2Async();
#if DEBUG
        WebView.Source = new Uri("http://localhost:5173");
#else
        WebView.Source = new Uri($"http://localhost:{_port}");
#endif
    }

    private void RestoreWindowState()
    {
        try
        {
            if (!File.Exists(LibrisDataPaths.SettingsPath)) return;
            var settings = JsonSerializer.Deserialize<WindowSettings>(
                File.ReadAllText(LibrisDataPaths.SettingsPath));
            if (settings is null) return;

            Left = settings.Left;
            Top = settings.Top;
            Width = settings.Width;
            Height = settings.Height;
            WindowState = settings.State;
        }
        catch { }
    }

    private void OnClosing(object? sender, CancelEventArgs e)
    {
        try
        {
            // Always save normal bounds so restore works correctly after maximized sessions
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
