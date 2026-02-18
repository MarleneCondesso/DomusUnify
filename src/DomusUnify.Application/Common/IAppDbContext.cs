using DomusUnify.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Domain.Entities.Family> Families { get; }
    DbSet<FamilyMember> FamilyMembers { get; }
    DbSet<FamilyInvite> FamilyInvites { get; }
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

    // BUDGET / FINANCE
    DbSet<Budget> Budgets { get; }
    DbSet<BudgetUserAccess> BudgetUserAccess { get; }
    DbSet<BudgetUserSettings> BudgetUserSettings { get; }
    DbSet<BudgetCategoryLimit> BudgetCategoryLimits { get; }
    DbSet<FinanceCategory> FinanceCategories { get; }
    DbSet<FinanceAccount> FinanceAccounts { get; }
    DbSet<FinanceTransaction> FinanceTransactions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
