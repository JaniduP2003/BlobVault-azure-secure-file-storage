using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFolderSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FileMetadata_Users_UserId1",
                table: "FileMetadata");

            migrationBuilder.RenameColumn(
                name: "UserId1",
                table: "FileMetadata",
                newName: "FolderId");

            migrationBuilder.RenameIndex(
                name: "IX_FileMetadata_UserId1",
                table: "FileMetadata",
                newName: "IX_FileMetadata_FolderId");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "FileMetadata",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.CreateTable(
                name: "Folders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ParentFolderId = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Color = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Folders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Folders_Folders_ParentFolderId",
                        column: x => x.ParentFolderId,
                        principalTable: "Folders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Folders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Folders_ParentFolderId",
                table: "Folders",
                column: "ParentFolderId");

            migrationBuilder.CreateIndex(
                name: "IX_Folders_UserId_ParentFolderId",
                table: "Folders",
                columns: new[] { "UserId", "ParentFolderId" });

            migrationBuilder.AddForeignKey(
                name: "FK_FileMetadata_Folders_FolderId",
                table: "FileMetadata",
                column: "FolderId",
                principalTable: "Folders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_FileMetadata_Users_UserId",
                table: "FileMetadata",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FileMetadata_Folders_FolderId",
                table: "FileMetadata");

            migrationBuilder.DropForeignKey(
                name: "FK_FileMetadata_Users_UserId",
                table: "FileMetadata");

            migrationBuilder.DropTable(
                name: "Folders");

            migrationBuilder.RenameColumn(
                name: "FolderId",
                table: "FileMetadata",
                newName: "UserId1");

            migrationBuilder.RenameIndex(
                name: "IX_FileMetadata_FolderId",
                table: "FileMetadata",
                newName: "IX_FileMetadata_UserId1");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "FileMetadata",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddForeignKey(
                name: "FK_FileMetadata_Users_UserId1",
                table: "FileMetadata",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
