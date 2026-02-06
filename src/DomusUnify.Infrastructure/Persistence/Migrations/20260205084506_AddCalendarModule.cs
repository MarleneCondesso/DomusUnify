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
            migrationBuilder.CreateTable(
                name: "CalendarEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    IsAllDay = table.Column<bool>(type: "bit", nullable: false),
                    StartUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ColorHex = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    RecurrenceRule = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    RecurrenceUntilUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RecurrenceCount = table.Column<int>(type: "int", nullable: true),
                    TimezoneId = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    ParentEventId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExceptionDateUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarEvents_CalendarEvents_ParentEventId",
                        column: x => x.ParentEventId,
                        principalTable: "CalendarEvents",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CalendarEvents_Families_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "Families",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CalendarEvents_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

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
                name: "IX_CalendarEvents_CreatedByUserId",
                table: "CalendarEvents",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_FamilyId_EndUtc",
                table: "CalendarEvents",
                columns: new[] { "FamilyId", "EndUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_FamilyId_StartUtc",
                table: "CalendarEvents",
                columns: new[] { "FamilyId", "StartUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_ParentEventId",
                table: "CalendarEvents",
                column: "ParentEventId");

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

            migrationBuilder.DropTable(
                name: "CalendarEvents");
        }
    }
}
