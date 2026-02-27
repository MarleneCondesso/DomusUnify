using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomusUnify.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddItemCategoryType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ItemCategories_FamilyId_Name",
                table: "ItemCategories");

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "ItemCategories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                """
                ;WITH Counts AS (
                    SELECT
                        ic.Id AS CategoryId,
                        SUM(CASE WHEN l.Type = 0 THEN 1 ELSE 0 END) AS ShoppingCount,
                        SUM(CASE WHEN l.Type = 1 THEN 1 ELSE 0 END) AS TasksCount,
                        SUM(CASE WHEN l.Type = 2 THEN 1 ELSE 0 END) AS CustomCount
                    FROM ItemCategories ic
                    INNER JOIN ListItems li ON li.CategoryId = ic.Id
                    INNER JOIN Lists l ON l.Id = li.SharedListId
                    GROUP BY ic.Id
                )
                UPDATE ic
                SET Type = CASE
                    WHEN c.TasksCount > c.ShoppingCount AND c.TasksCount > c.CustomCount THEN 1
                    WHEN c.CustomCount > c.ShoppingCount AND c.CustomCount > c.TasksCount THEN 2
                    ELSE 0
                END
                FROM ItemCategories ic
                INNER JOIN Counts c ON c.CategoryId = ic.Id;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_ItemCategories_FamilyId_Type_Name",
                table: "ItemCategories",
                columns: new[] { "FamilyId", "Type", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ItemCategories_FamilyId_Type_Name",
                table: "ItemCategories");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "ItemCategories");

            migrationBuilder.CreateIndex(
                name: "IX_ItemCategories_FamilyId_Name",
                table: "ItemCategories",
                columns: new[] { "FamilyId", "Name" },
                unique: true);
        }
    }
}
