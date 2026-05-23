using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using System.Windows;
using Libris.Api.Services;
using Libris.Core.Interfaces;
using Libris.Epub;
using Libris.Metadata;
using Libris.Storage;
using Libris.Storage.Data;
using Libris.Storage.Repositories;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Libris.Desktop;

public partial class App : Application
{
    private WebApplication? _api;

    protected override async void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        LibrisDataPaths.EnsureDirectoriesExist();

        var port = GetAvailablePort();
        _api = BuildApi(port);

        await using (var scope = _api.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LibrisDbContext>();
            await db.Database.MigrateAsync();
        }

        await _api.StartAsync();
        new MainWindow(port).Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _api?.StopAsync().Wait(TimeSpan.FromSeconds(5));
        base.OnExit(e);
    }

    private static int GetAvailablePort()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    private static WebApplication BuildApi(int port)
    {
        var options = new WebApplicationOptions { ContentRootPath = AppContext.BaseDirectory };
        var builder = WebApplication.CreateBuilder(options);

        builder.WebHost.UseUrls($"http://localhost:{port}");
        builder.Logging.SetMinimumLevel(LogLevel.Warning);
        builder.Logging.AddFilter("System.Net.Http", LogLevel.Warning);

        builder.Services.AddDbContext<LibrisDbContext>(o =>
            o.UseSqlite($"Data Source={LibrisDataPaths.DatabasePath}"));

        builder.Services.AddScoped<ILibraryRepository, LibraryRepository>();
        builder.Services.AddScoped<IReadingProgressRepository, ReadingProgressRepository>();
        builder.Services.AddScoped<ICoverCacheManager, CoverCacheManager>();
        builder.Services.AddSingleton<IEpubParser, EpubParser>();
        builder.Services.AddSingleton<IShellService>(new WpfShellService());

        builder.Services.AddHttpClient<OpenLibraryMetadataProvider>();
        builder.Services.AddHttpClient<GoogleBooksMetadataProvider>();

        builder.Services.AddScoped<LibraryService>();
        builder.Services.AddScoped<ShelfService>();
        builder.Services.AddScoped<ReadingProgressService>();
        builder.Services.AddScoped<MetadataService>();

        builder.Services.AddControllers()
            .AddApplicationPart(typeof(Libris.Api.Controllers.LibraryController).Assembly)
            .AddJsonOptions(o =>
            {
                o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            });

        var app = builder.Build();

        app.UseDefaultFiles();
        app.UseStaticFiles();
        app.MapControllers();
        app.MapFallbackToFile("index.html");

        return app;
    }
}
