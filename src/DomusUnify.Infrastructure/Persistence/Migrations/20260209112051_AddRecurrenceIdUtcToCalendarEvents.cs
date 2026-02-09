using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomusUnify.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurrenceIdUtcToCalendarEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CalendarEvents_ParentEventId",
                table: "CalendarEvents");

            migrationBuilder.AddColumn<DateTime>(
                name: "RecurrenceIdUtc",
                table: "CalendarEvents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_ParentEventId_RecurrenceIdUtc",
                table: "CalendarEvents",
                columns: new[] { "ParentEventId", "RecurrenceIdUtc" },
                unique: true,
                filter: "[ParentEventId] IS NOT NULL AND [RecurrenceIdUtc] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CalendarEvents_ParentEventId_RecurrenceIdUtc",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "RecurrenceIdUtc",
                table: "CalendarEvents");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_ParentEventId",
                table: "CalendarEvents",
                column: "ParentEventId");
        }
    }
}
