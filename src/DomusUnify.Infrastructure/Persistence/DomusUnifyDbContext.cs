using DomusUnify.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using DomusUnify.Application.Common.Interfaces;

namespace DomusUnify.Infrastructure.Persistence;

/// <summary>
/// Contexto EF Core (SQL Server) da aplicação.
/// </summary>
/// <remarks>
/// Implementa <see cref="IAppDbContext"/> para ser consumido pela camada de aplicação.
/// </remarks>
public class DomusUnifyDbContext : DbContext, IAppDbContext
{
    /// <summary>
    /// Inicializa uma nova instância do contexto.
    /// </summary>
    /// <param name="options">Opções de configuração do EF Core.</param>
    public DomusUnifyDbContext(DbContextOptions<DomusUnifyDbContext> options)
        : base(options) { }

    /// <inheritdoc />
    public DbSet<User> Users => Set<User>();

    /// <inheritdoc />
    public DbSet<Family> Families => Set<Family>();

    /// <inheritdoc />
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();

    /// <inheritdoc />
    public DbSet<FamilyInvite> FamilyInvites => Set<FamilyInvite>();

    /// <inheritdoc />
    public DbSet<SharedList> Lists => Set<SharedList>();

    /// <inheritdoc />
    public DbSet<ListItem> ListItems => Set<ListItem>();

    /// <inheritdoc />
    public DbSet<ItemCategory> ItemCategories => Set<ItemCategory>();

    /// <inheritdoc />
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();

    /// <inheritdoc />
    public DbSet<CalendarEventParticipant> CalendarEventParticipants => Set<CalendarEventParticipant>();

    /// <inheritdoc />
    public DbSet<CalendarEventVisibility> CalendarEventVisibilities => Set<CalendarEventVisibility>();

    /// <inheritdoc />
    public DbSet<CalendarEventReminder> CalendarEventReminders => Set<CalendarEventReminder>();

    /// <inheritdoc />
    public DbSet<FamilyCalendarSettings> FamilyCalendarSettings => Set<FamilyCalendarSettings>();

    /// <inheritdoc />
    public DbSet<UserCalendarSettings> UserCalendarSettings => Set<UserCalendarSettings>();

    // BUDGET / FINANCE
    /// <inheritdoc />
    public DbSet<Budget> Budgets => Set<Budget>();

    /// <inheritdoc />
    public DbSet<BudgetUserAccess> BudgetUserAccess => Set<BudgetUserAccess>();

    /// <inheritdoc />
    public DbSet<BudgetUserSettings> BudgetUserSettings => Set<BudgetUserSettings>();

    /// <inheritdoc />
    public DbSet<BudgetCategoryLimit> BudgetCategoryLimits => Set<BudgetCategoryLimit>();

    /// <inheritdoc />
    public DbSet<FinanceCategory> FinanceCategories => Set<FinanceCategory>();

    /// <inheritdoc />
    public DbSet<FinanceAccount> FinanceAccounts => Set<FinanceAccount>();

    /// <inheritdoc />
    public DbSet<FinanceTransaction> FinanceTransactions => Set<FinanceTransaction>();

    /// <summary>
    /// Configura o mapeamento das entidades (tabelas, chaves, índices e relações).
    /// </summary>
    /// <param name="modelBuilder">Construtor de modelo EF Core.</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // USER
        modelBuilder.Entity<User>(b =>
        {
            b.ToTable("Users");
            b.HasKey(x => x.Id);

            b.Property(x => x.Name).HasMaxLength(120).IsRequired();
            b.Property(x => x.Email).HasMaxLength(200).IsRequired();
            b.HasIndex(x => x.Email).IsUnique();

            b.Property(x => x.PasswordHash).IsRequired();

            b.Property(x => x.CreatedAtUtc).IsRequired();
            b.Property(x => x.UpdatedAtUtc);

            b.HasOne(x => x.CurrentFamily)
                .WithMany()
                .HasForeignKey(x => x.CurrentFamilyId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Property(x => x.CurrentFamilyId);
        });

        // FAMILY
        modelBuilder.Entity<Family>(b =>
        {
            b.ToTable("Families");
            b.HasKey(x => x.Id);

            b.Property(x => x.Name).HasMaxLength(120).IsRequired();

            b.Property(x => x.CreatedAtUtc).IsRequired();
            b.Property(x => x.UpdatedAtUtc);
        });



        // FAMILY MEMBER (Membership)
        modelBuilder.Entity<FamilyMember>(b =>
        {
            b.ToTable("FamilyMembers");
            b.HasKey(x => x.Id);

            b.Property(x => x.Role).IsRequired();

            b.HasIndex(x => new { x.FamilyId, x.UserId }).IsUnique(); // evita duplicados

            b.HasOne(x => x.Family)
                .WithMany(x => x.Members)
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.User)
                .WithMany(x => x.FamilyMemberships)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // FAMILY INVITE
        modelBuilder.Entity<FamilyInvite>(b =>
        {
            b.ToTable("FamilyInvites");
            b.HasKey(x => x.Id);

            b.Property(x => x.TokenHash).IsRequired();
            b.HasIndex(x => x.TokenHash).IsUnique();

            b.HasOne(x => x.Family)
                .WithMany()
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.InvitedByUser)
                .WithMany()
                .HasForeignKey(x => x.InvitedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => new { x.FamilyId, x.ExpiresAtUtc });
        });


        // ITEM CATEGORY
        modelBuilder.Entity<ItemCategory>(b =>
        {
            b.ToTable("ItemCategories");
            b.HasKey(x => x.Id);

            b.Property(x => x.Name).HasMaxLength(80).IsRequired();
            b.Property(x => x.SortOrder).IsRequired();

            b.HasIndex(x => new { x.FamilyId, x.Name }).IsUnique();

            b.HasOne(x => x.Family)
                .WithMany()
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CALENDAR EVENT
        modelBuilder.Entity<CalendarEvent>(b =>
        {
            b.ToTable("CalendarEvents");
            b.HasKey(x => x.Id);

            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.Property(x => x.Note).HasMaxLength(2000);
            b.Property(x => x.Location).HasMaxLength(300);

            b.Property(x => x.ColorHex).HasMaxLength(7);
            b.Property(x => x.RecurrenceRule).HasMaxLength(300);
            b.Property(x => x.TimezoneId).HasMaxLength(60);

            b.Property(x => x.RecurrenceIdUtc);

            b.HasIndex(x => new { x.ParentEventId, x.RecurrenceIdUtc });

            // 1 relação clara CalendarEvent -> Family usando FamilyId
            b.HasOne(x => x.Family)
                .WithMany(f => f.CalendarEvents)       // agora existe na entity Family
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

            // 1 relação clara CalendarEvent -> User (CreatedBy)
            b.HasOne(x => x.CreatedByUser)
                .WithMany(u => u.CreatedEvents)        // agora existe na entity User
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasOne(x => x.ParentEvent)
                .WithMany()
                .HasForeignKey(x => x.ParentEventId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => new { x.FamilyId, x.StartUtc });
            b.HasIndex(x => new { x.FamilyId, x.EndUtc });

            b.HasIndex(x => new { x.ParentEventId, x.RecurrenceIdUtc })
                .IsUnique()
                .HasFilter("[ParentEventId] IS NOT NULL AND [RecurrenceIdUtc] IS NOT NULL");

        });


        modelBuilder.Entity<CalendarEventParticipant>(b =>
        {
            b.ToTable("CalendarEventParticipants");
            b.HasKey(x => x.Id);

            b.HasOne(x => x.Event)
                .WithMany(e => e.Participants)
                .HasForeignKey(x => x.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => new { x.EventId, x.UserId }).IsUnique();
        });

        modelBuilder.Entity<CalendarEventVisibility>(b =>
        {
            b.ToTable("CalendarEventVisibilities");
            b.HasKey(x => x.Id);

            b.HasOne(x => x.Event)
                .WithMany(e => e.VisibleTo)
                .HasForeignKey(x => x.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => new { x.EventId, x.UserId }).IsUnique();
            b.HasIndex(x => x.UserId);
        });

        modelBuilder.Entity<CalendarEventReminder>(b =>
        {
            b.ToTable("CalendarEventReminders");
            b.HasKey(x => x.Id);

            b.HasOne(x => x.Event)
                .WithMany(e => e.Reminders)
                .HasForeignKey(x => x.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => x.EventId);
        });

        // FAMILY CALENDAR SETTINGS
        modelBuilder.Entity<FamilyCalendarSettings>(b =>
        {
            b.ToTable("FamilyCalendarSettings");
            b.HasKey(x => x.Id);

            b.HasIndex(x => x.FamilyId).IsUnique();

            b.Property(x => x.HolidaysCountryCode)
                .HasMaxLength(2)
                .IsRequired();

            b.Property(x => x.CalendarColorHex)
                .HasMaxLength(7);

            b.HasOne(x => x.Family)
                .WithOne()
                .HasForeignKey<FamilyCalendarSettings>(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // USER CALENDAR SETTINGS
        modelBuilder.Entity<UserCalendarSettings>(b =>
        {
            b.ToTable("UserCalendarSettings");
            b.HasKey(x => x.Id);

            b.HasIndex(x => x.UserId).IsUnique();

            b.Property(x => x.DailyReminderTime)
                .HasConversion(
                    t => t.ToTimeSpan(),
                    t => TimeOnly.FromTimeSpan(t));

            b.HasOne(x => x.User)
                .WithOne()
                .HasForeignKey<UserCalendarSettings>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // LIST
        modelBuilder.Entity<SharedList>(b =>
        {
            b.ToTable("Lists");
            b.HasKey(x => x.Id);

            b.Property(x => x.Name).HasMaxLength(200).IsRequired();
            b.Property(x => x.Type).IsRequired();

            b.HasIndex(x => new { x.FamilyId, x.Name });

            b.HasOne(x => x.Family)
                .WithMany(x => x.Lists)
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

        });

        // LIST ITEM
        modelBuilder.Entity<ListItem>(b =>
        {
            b.ToTable("ListItems");
            b.HasKey(x => x.Id);

            b.Property(x => x.Name).HasMaxLength(200).IsRequired();
            b.Property(x => x.IsCompleted).IsRequired();

            b.HasIndex(x => new { x.SharedListId, x.IsCompleted });

            b.HasOne(x => x.SharedList)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.SharedListId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.CompletedByUser)
                .WithMany()
                .HasForeignKey(x => x.CompletedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Category)
                .WithMany(c => c.Items)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => new { x.SharedListId, x.CategoryId });

        });

        // FINANCE CATEGORY
        modelBuilder.Entity<FinanceCategory>(b =>
        {
            b.ToTable("FinanceCategories");
            b.HasKey(x => x.Id);

            b.Property(x => x.Name).HasMaxLength(80).IsRequired();
            b.Property(x => x.IconKey).HasMaxLength(40).IsRequired();
            b.Property(x => x.SortOrder).IsRequired();
            b.Property(x => x.Type).IsRequired();

            b.HasIndex(x => new { x.FamilyId, x.Type, x.Name }).IsUnique();

            b.HasOne(x => x.Family)
                .WithMany(x => x.FinanceCategories)
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // FINANCE ACCOUNT
        modelBuilder.Entity<FinanceAccount>(b =>
        {
            b.ToTable("FinanceAccounts");
            b.HasKey(x => x.Id);

            b.Property(x => x.Name).HasMaxLength(120).IsRequired();
            b.Property(x => x.IconKey).HasMaxLength(40).IsRequired();
            b.Property(x => x.SortOrder).IsRequired();
            b.Property(x => x.Type).IsRequired();

            b.HasIndex(x => new { x.FamilyId, x.Name }).IsUnique();

            b.HasOne(x => x.Family)
                .WithMany(x => x.FinanceAccounts)
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // BUDGET
        modelBuilder.Entity<Budget>(b =>
        {
            b.ToTable("Budgets");
            b.HasKey(x => x.Id);

            b.Property(x => x.Name).HasMaxLength(120).IsRequired();
            b.Property(x => x.IconKey).HasMaxLength(40).IsRequired();
            b.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();

            b.Property(x => x.SpendingLimit).HasColumnType("decimal(18,2)");

            b.Property(x => x.Type).IsRequired();
            b.Property(x => x.PeriodType);
            b.Property(x => x.StartDate);
            b.Property(x => x.EndDate);
            b.Property(x => x.SemiMonthlyPattern);

            b.Property(x => x.MainIndicator).IsRequired();
            b.Property(x => x.OnlyPaidInTotals).IsRequired();
            b.Property(x => x.TransactionOrder).IsRequired();
            b.Property(x => x.UpcomingDisplayMode).IsRequired();

            b.Property(x => x.VisibilityMode).IsRequired();

            b.HasIndex(x => new { x.FamilyId, x.Name }).IsUnique();
            b.HasIndex(x => x.FamilyId);

            b.HasOne(x => x.Family)
                .WithMany(x => x.Budgets)
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.OwnerUser)
                .WithMany()
                .HasForeignKey(x => x.OwnerUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // BUDGET USER ACCESS (specific members)
        modelBuilder.Entity<BudgetUserAccess>(b =>
        {
            b.ToTable("BudgetUserAccess");
            b.HasKey(x => x.Id);

            b.Property(x => x.CreatedAtUtc).IsRequired();

            b.HasOne(x => x.Budget)
                .WithMany(e => e.AllowedUsers)
                .HasForeignKey(x => x.BudgetId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => new { x.BudgetId, x.UserId }).IsUnique();
            b.HasIndex(x => x.UserId);
        });

        // BUDGET USER SETTINGS
        modelBuilder.Entity<BudgetUserSettings>(b =>
        {
            b.ToTable("BudgetUserSettings");
            b.HasKey(x => x.Id);

            b.HasIndex(x => new { x.BudgetId, x.UserId }).IsUnique();
            b.HasIndex(x => x.UserId);

            b.Property(x => x.DailyReminderTime)
                .HasConversion(
                    t => t.ToTimeSpan(),
                    t => TimeOnly.FromTimeSpan(t));

            b.HasOne(x => x.Budget)
                .WithMany(x => x.UserSettings)
                .HasForeignKey(x => x.BudgetId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // BUDGET CATEGORY LIMIT
        modelBuilder.Entity<BudgetCategoryLimit>(b =>
        {
            b.ToTable("BudgetCategoryLimits");
            b.HasKey(x => x.Id);

            b.Property(x => x.Amount)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            b.HasIndex(x => new { x.BudgetId, x.CategoryId }).IsUnique();

            b.HasOne(x => x.Budget)
                .WithMany(x => x.CategoryLimits)
                .HasForeignKey(x => x.BudgetId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.Category)
                .WithMany()
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // FINANCE TRANSACTION
        modelBuilder.Entity<FinanceTransaction>(b =>
        {
            b.ToTable("FinanceTransactions");
            b.HasKey(x => x.Id);

            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.Property(x => x.Note).HasMaxLength(2000);

            b.Property(x => x.Amount)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            b.Property(x => x.Date).IsRequired();
            b.Property(x => x.Type).IsRequired();

            b.Property(x => x.IsPaid).IsRequired();

            b.HasIndex(x => new { x.BudgetId, x.Date });
            b.HasIndex(x => new { x.BudgetId, x.Type, x.Date });
            b.HasIndex(x => x.CategoryId);
            b.HasIndex(x => x.AccountId);
            b.HasIndex(x => x.PaidByUserId);

            b.HasOne(x => x.Budget)
                .WithMany(x => x.Transactions)
                .HasForeignKey(x => x.BudgetId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.Category)
                .WithMany()
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasOne(x => x.Account)
                .WithMany()
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasOne(x => x.PaidByUser)
                .WithMany()
                .HasForeignKey(x => x.PaidByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // EXPENSE
    }
}
