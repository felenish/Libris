using Libris.Storage.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Libris.Storage.Data.Configurations;

public sealed class ReadingProgressEntityConfiguration : IEntityTypeConfiguration<ReadingProgressEntity>
{
    public void Configure(EntityTypeBuilder<ReadingProgressEntity> builder)
    {
        builder.HasKey(p => p.BookId);
        builder.Property(p => p.Status).IsRequired();
    }
}
