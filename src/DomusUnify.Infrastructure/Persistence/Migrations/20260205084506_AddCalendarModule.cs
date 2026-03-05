using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomusUnify.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE:
            // - `CalendarEvents` was introduced in `20260202120140_InitialCreate` with a smaller schema
            //   (incl. `Description`).
            // - This migration expands the schema and adds supporting tables.
            // - We *must not* recreate the table, otherwise new DBs fail with "There is already an object named 'CalendarEvents'".

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "CalendarEvents",
                newName: "Note");

            migrationBuilder.AlterColumn<string>(
                name: "Note",
                table: "CalendarEvents",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "CalendarEvents",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAllDay",
                table: "CalendarEvents",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ColorHex",
                table: "CalendarEvents",
                type: "nvarchar(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecurrenceRule",
                table: "CalendarEvents",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecurrenceUntilUtc",
                table: "CalendarEvents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceCount",
                table: "CalendarEvents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimezoneId",
                table: "CalendarEvents",
                type: "nvarchar(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentEventId",
                table: "CalendarEvents",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExceptionDateUtc",
                table: "CalendarEvents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_FamilyId_EndUtc",
                table: "CalendarEvents",
                columns: new[] { "FamilyId", "EndUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_ParentEventId",
                table: "CalendarEvents",
                column: "ParentEventId");

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvents_CalendarEvents_ParentEventId",
                table: "CalendarEvents",
                column: "ParentEventId",
                principalTable: "CalendarEvents",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.CreateTable(
                name: "CalendarEventParticipants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEventParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarEventParticipants_CalendarEvents_EventId",
                        column: x => x.EventId,
                        principalTable: "CalendarEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CalendarEventParticipants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CalendarEventReminders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OffsetMinutes = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEventReminders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarEventReminders_CalendarEvents_EventId",
                        column: x => x.EventId,
                        principalTable: "CalendarEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CalendarEventVisibilities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEventVisibilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarEventVisibilities_CalendarEvents_EventId",
                        column: x => x.EventId,
                        principalTable: "CalendarEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CalendarEventVisibilities_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEventParticipants_EventId_UserId",
                table: "CalendarEventParticipants",
                columns: new[] { "EventId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEventParticipants_UserId",
                table: "CalendarEventParticipants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEventReminders_EventId",
                table: "CalendarEventReminders",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEventVisibilities_EventId_UserId",
                table: "CalendarEventVisibilities",
                columns: new[] { "EventId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEventVisibilities_UserId",
                table: "CalendarEventVisibilities",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalendarEventParticipants");

            migrationBuilder.DropTable(
                name: "CalendarEventReminders");

            migrationBuilder.DropTable(
                name: "CalendarEventVisibilities");

            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvents_CalendarEvents_ParentEventId",
                table: "CalendarEvents");

            migrationBuilder.DropIndex(
                name: "IX_CalendarEvents_FamilyId_EndUtc",
                table: "CalendarEvents");

            migrationBuilder.DropIndex(
                name: "IX_CalendarEvents_ParentEventId",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "ColorHex",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "ExceptionDateUtc",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "IsAllDay",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "ParentEventId",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "RecurrenceCount",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "RecurrenceRule",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "RecurrenceUntilUtc",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "TimezoneId",
                table: "CalendarEvents");

            migrationBuilder.RenameColumn(
                name: "Note",
                table: "CalendarEvents",
                newName: "Description");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "CalendarEvents",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000,
                oldNullable: true);
        }
    }
}
