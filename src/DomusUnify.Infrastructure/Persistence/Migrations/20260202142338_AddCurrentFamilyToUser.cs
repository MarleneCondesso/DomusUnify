using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomusUnify.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrentFamilyToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CurrentFamilyId",
                table: "Users",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_CurrentFamilyId",
                table: "Users",
                column: "CurrentFamilyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Families_CurrentFamilyId",
                table: "Users",
                column: "CurrentFamilyId",
                principalTable: "Families",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Families_CurrentFamilyId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_CurrentFamilyId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CurrentFamilyId",
                table: "Users");
        }
    }
}
