using Libris.Storage.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Libris.Storage.Data.Configurations;

public sealed class EpubBookEntityConfiguration : IEntityTypeConfiguration<EpubBookEntity>
{
    public void Configure(EntityTypeBuilder<EpubBookEntity> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.FilePath).IsRequired();
        builder.Property(b => b.Title).IsRequired();
        builder.Property(b => b.AuthorsJson).IsRequired().HasDefaultValue("[]");
        builder.Property(b => b.GenresJson).IsRequired().HasDefaultValue("[]");

        builder.HasIndex(b => b.FilePath).IsUnique();

        builder.HasOne(b => b.Progress)
               .WithOne(p => p.Book)
               .HasForeignKey<ReadingProgressEntity>(p => p.BookId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
