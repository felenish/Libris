using Libris.Storage.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Libris.Storage.Tests.Helpers;

/// <summary>
/// Creates an in-memory SQLite LibrisDbContext for tests.
/// Caller owns the returned context and connection — dispose both after use.
/// </summary>
public static class DbContextFactory
{
    public static (LibrisDbContext db, SqliteConnection connection) Create()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<LibrisDbContext>()
            .UseSqlite(connection)
            .Options;

        var db = new LibrisDbContext(options);
        db.Database.EnsureCreated();
        return (db, connection);
    }
}
