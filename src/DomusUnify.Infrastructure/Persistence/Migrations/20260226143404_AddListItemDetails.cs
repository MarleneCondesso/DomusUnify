using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomusUnify.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddListItemDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssigneeUserId",
                table: "ListItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "ListItems",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "ListItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ListItems_AssigneeUserId",
                table: "ListItems",
                column: "AssigneeUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ListItems_Users_AssigneeUserId",
                table: "ListItems",
                column: "AssigneeUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ListItems_Users_AssigneeUserId",
                table: "ListItems");

            migrationBuilder.DropIndex(
                name: "IX_ListItems_AssigneeUserId",
                table: "ListItems");

            migrationBuilder.DropColumn(
                name: "AssigneeUserId",
                table: "ListItems");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "ListItems");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "ListItems");
        }
    }
}
