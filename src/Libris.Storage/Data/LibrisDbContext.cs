using Libris.Storage.Data.Configurations;
using Libris.Storage.Entities;
using Microsoft.EntityFrameworkCore;

namespace Libris.Storage.Data;

public sealed class LibrisDbContext : DbContext
{
    public DbSet<EpubBookEntity> Books { get; set; } = null!;
    public DbSet<ReadingProgressEntity> ReadingProgress { get; set; } = null!;

    public LibrisDbContext(DbContextOptions<LibrisDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new EpubBookEntityConfiguration());
        modelBuilder.ApplyConfiguration(new ReadingProgressEntityConfiguration());
    }
}
