using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomusUnify.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceTransactionRepeatSourceTransactionId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RepeatSourceTransactionId",
                table: "FinanceTransactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_FinanceTransactions_RepeatSourceTransactionId_Date",
                table: "FinanceTransactions",
                columns: new[] { "RepeatSourceTransactionId", "Date" },
                unique: true,
                filter: "[RepeatSourceTransactionId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FinanceTransactions_RepeatSourceTransactionId_Date",
                table: "FinanceTransactions");

            migrationBuilder.DropColumn(
                name: "RepeatSourceTransactionId",
                table: "FinanceTransactions");
        }
    }
}
