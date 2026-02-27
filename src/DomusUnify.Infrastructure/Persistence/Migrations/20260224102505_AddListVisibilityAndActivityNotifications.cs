using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomusUnify.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddListVisibilityAndActivityNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // LIST: owner + visibility
            migrationBuilder.AddColumn<Guid>(
                name: "OwnerUserId",
                table: "Lists",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VisibilityMode",
                table: "Lists",
                type: "int",
                nullable: false,
                defaultValue: 1); // AllMembers

            // ACTIVITY
            migrationBuilder.CreateTable(
                name: "ActivityEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Kind = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ListId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityEntries_Families_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "Families",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_ActivityEntries_Lists_ListId",
                        column: x => x.ListId,
                        principalTable: "Lists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ActivityEntries_Users_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            // LIST USER ACCESS (SpecificMembers)
            migrationBuilder.CreateTable(
                name: "ListUserAccess",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SharedListId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListUserAccess", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ListUserAccess_Lists_SharedListId",
                        column: x => x.SharedListId,
                        principalTable: "Lists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ListUserAccess_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            // NOTIFICATION STATE (unread marker)
            migrationBuilder.CreateTable(
                name: "UserNotificationStates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LastSeenAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotificationStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserNotificationStates_Families_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "Families",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserNotificationStates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            // Indexes
            migrationBuilder.CreateIndex(
                name: "IX_ActivityEntries_ActorUserId",
                table: "ActivityEntries",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityEntries_FamilyId_CreatedAtUtc",
                table: "ActivityEntries",
                columns: new[] { "FamilyId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityEntries_ListId",
                table: "ActivityEntries",
                column: "ListId");

            migrationBuilder.CreateIndex(
                name: "IX_ListUserAccess_SharedListId_UserId",
                table: "ListUserAccess",
                columns: new[] { "SharedListId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ListUserAccess_UserId",
                table: "ListUserAccess",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationStates_FamilyId",
                table: "UserNotificationStates",
                column: "FamilyId");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationStates_UserId",
                table: "UserNotificationStates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationStates_UserId_FamilyId",
                table: "UserNotificationStates",
                columns: new[] { "UserId", "FamilyId" },
                unique: true);

            // Backfill owner for existing lists (prefer Admin, then oldest member)
            migrationBuilder.Sql(@"
UPDATE L
SET OwnerUserId = FM.UserId
FROM Lists L
CROSS APPLY (
    SELECT TOP 1 UserId
    FROM FamilyMembers
    WHERE FamilyId = L.FamilyId
    ORDER BY Role ASC, CreatedAtUtc ASC
) FM
WHERE L.OwnerUserId IS NULL;
");

            // Make OwnerUserId required after backfill
            migrationBuilder.AlterColumn<Guid>(
                name: "OwnerUserId",
                table: "Lists",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Lists_OwnerUserId",
                table: "Lists",
                column: "OwnerUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Lists_Users_OwnerUserId",
                table: "Lists",
                column: "OwnerUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lists_Users_OwnerUserId",
                table: "Lists");

            migrationBuilder.DropTable(
                name: "ActivityEntries");

            migrationBuilder.DropTable(
                name: "ListUserAccess");

            migrationBuilder.DropTable(
                name: "UserNotificationStates");

            migrationBuilder.DropIndex(
                name: "IX_Lists_OwnerUserId",
                table: "Lists");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "Lists");

            migrationBuilder.DropColumn(
                name: "VisibilityMode",
                table: "Lists");
        }
    }
}
