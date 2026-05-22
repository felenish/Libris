using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Libris.Storage.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Books",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    FilePath = table.Column<string>(type: "TEXT", nullable: false),
                    FileFound = table.Column<bool>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    AuthorsJson = table.Column<string>(type: "TEXT", nullable: false, defaultValue: "[]"),
                    SeriesName = table.Column<string>(type: "TEXT", nullable: true),
                    SeriesIndex = table.Column<decimal>(type: "TEXT", nullable: true),
                    GenresJson = table.Column<string>(type: "TEXT", nullable: false, defaultValue: "[]"),
                    Publisher = table.Column<string>(type: "TEXT", nullable: true),
                    PublishedDate = table.Column<string>(type: "TEXT", nullable: true),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Isbn = table.Column<string>(type: "TEXT", nullable: true),
                    Language = table.Column<string>(type: "TEXT", nullable: true),
                    CoverPath = table.Column<string>(type: "TEXT", nullable: true),
                    ImportedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    LastModifiedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Books", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReadingProgress",
                columns: table => new
                {
                    BookId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CurrentCfi = table.Column<string>(type: "TEXT", nullable: true),
                    Percentage = table.Column<double>(type: "REAL", nullable: false),
                    LastReadUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    StartedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    FinishedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    TotalReadingMinutes = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReadingProgress", x => x.BookId);
                    table.ForeignKey(
                        name: "FK_ReadingProgress_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Books_FilePath",
                table: "Books",
                column: "FilePath",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReadingProgress");

            migrationBuilder.DropTable(
                name: "Books");
        }
    }
}
