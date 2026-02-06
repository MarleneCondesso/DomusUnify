using DomusUnify.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Family> Families { get; }
    DbSet<FamilyMember> FamilyMembers { get; }
    DbSet<SharedList> Lists { get; }
    DbSet<ListItem> ListItems { get; }
    DbSet<ItemCategory> ItemCategories { get; }

    // ✅ CALENDAR
    DbSet<CalendarEvent> CalendarEvents { get; }
    DbSet<CalendarEventParticipant> CalendarEventParticipants { get; }
    DbSet<CalendarEventVisibility> CalendarEventVisibilities { get; }
    DbSet<CalendarEventReminder> CalendarEventReminders { get; }
    DbSet<FamilyCalendarSettings> FamilyCalendarSettings { get; }
    DbSet<UserCalendarSettings> UserCalendarSettings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
