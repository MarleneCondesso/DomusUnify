using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomusUnify.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddManagedCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "Lists",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "ListItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ItemCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    IconKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorHex = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemCategories_Families_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "Families",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ListCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    IconKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorHex = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ListCategories_Families_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "Families",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Lists_CategoryId",
                table: "Lists",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Lists_FamilyId_CategoryId",
                table: "Lists",
                columns: new[] { "FamilyId", "CategoryId" });

            migrationBuilder.CreateIndex(
                name: "IX_ListItems_CategoryId",
                table: "ListItems",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ListItems_SharedListId_CategoryId",
                table: "ListItems",
                columns: new[] { "SharedListId", "CategoryId" });

            migrationBuilder.CreateIndex(
                name: "IX_ItemCategories_FamilyId_Name",
                table: "ItemCategories",
                columns: new[] { "FamilyId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ListCategories_FamilyId_Name",
                table: "ListCategories",
                columns: new[] { "FamilyId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ListItems_ItemCategories_CategoryId",
                table: "ListItems",
                column: "CategoryId",
                principalTable: "ItemCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Lists_ListCategories_CategoryId",
                table: "Lists",
                column: "CategoryId",
                principalTable: "ListCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ListItems_ItemCategories_CategoryId",
                table: "ListItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Lists_ListCategories_CategoryId",
                table: "Lists");

            migrationBuilder.DropTable(
                name: "ItemCategories");

            migrationBuilder.DropTable(
                name: "ListCategories");

            migrationBuilder.DropIndex(
                name: "IX_Lists_CategoryId",
                table: "Lists");

            migrationBuilder.DropIndex(
                name: "IX_Lists_FamilyId_CategoryId",
                table: "Lists");

            migrationBuilder.DropIndex(
                name: "IX_ListItems_CategoryId",
                table: "ListItems");

            migrationBuilder.DropIndex(
                name: "IX_ListItems_SharedListId_CategoryId",
                table: "ListItems");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Lists");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "ListItems");
        }
    }
}
