using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomusUnify.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIsCancelledToCalendarEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExceptionDateUtc",
                table: "CalendarEvents");

            migrationBuilder.AddColumn<bool>(
                name: "IsCancelled",
                table: "CalendarEvents",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "FamilyCalendarSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CalendarColorHex = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    HolidaysCountryCode = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    CleanupOlderThanMonths = table.Column<int>(type: "int", nullable: true),
                    CleanupOlderThanYears = table.Column<int>(type: "int", nullable: true),
                    DailyReminderEnabled = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FamilyCalendarSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FamilyCalendarSettings_Families_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "Families",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserCalendarSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DailyReminderTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    DailyReminderMode = table.Column<int>(type: "int", nullable: false),
                    DefaultEventReminderMinutes = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCalendarSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCalendarSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FamilyCalendarSettings_FamilyId",
                table: "FamilyCalendarSettings",
                column: "FamilyId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserCalendarSettings_UserId",
                table: "UserCalendarSettings",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FamilyCalendarSettings");

            migrationBuilder.DropTable(
                name: "UserCalendarSettings");

            migrationBuilder.DropColumn(
                name: "IsCancelled",
                table: "CalendarEvents");

            migrationBuilder.AddColumn<DateTime>(
                name: "ExceptionDateUtc",
                table: "CalendarEvents",
                type: "datetime2",
                nullable: true);
        }
    }
}
