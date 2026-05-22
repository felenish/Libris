using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Libris.Storage.Data;

// Used only by dotnet-ef tooling for migrations — not referenced at runtime.
public sealed class LibrisDesignTimeDbContextFactory : IDesignTimeDbContextFactory<LibrisDbContext>
{
    public LibrisDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<LibrisDbContext>()
            .UseSqlite("Data Source=design-time-placeholder.db")
            .Options;
        return new LibrisDbContext(options);
    }
}
