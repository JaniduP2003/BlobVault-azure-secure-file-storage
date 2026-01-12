using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddStorageQuotaFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "StorageQuotaBytes",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "StorageUsedBytes",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<int>(
                name: "UserId1",
                table: "FileMetadata",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_FileMetadata_UserId_IsDeleted",
                table: "FileMetadata",
                columns: new[] { "UserId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_FileMetadata_UserId1",
                table: "FileMetadata",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_FileMetadata_Users_UserId1",
                table: "FileMetadata",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FileMetadata_Users_UserId1",
                table: "FileMetadata");

            migrationBuilder.DropIndex(
                name: "IX_FileMetadata_UserId_IsDeleted",
                table: "FileMetadata");

            migrationBuilder.DropIndex(
                name: "IX_FileMetadata_UserId1",
                table: "FileMetadata");

            migrationBuilder.DropColumn(
                name: "StorageQuotaBytes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "StorageUsedBytes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "FileMetadata");
        }
    }
}
