using DomusUnify.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using DomusUnify.Application.Common.Interfaces;

namespace DomusUnify.Infrastructure.Persistence;

public class DomusUnifyDbContext : DbContext, IAppDbContext
{
    public DomusUnifyDbContext(DbContextOptions<DomusUnifyDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Family> Families => Set<Family>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<SharedList> Lists => Set<SharedList>();
    public DbSet<ListItem> ListItems => Set<ListItem>();
    public DbSet<ItemCategory> ItemCategories => Set<ItemCategory>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<CalendarEventParticipant> CalendarEventParticipants => Set<CalendarEventParticipant>();
    public DbSet<CalendarEventVisibility> CalendarEventVisibilities => Set<CalendarEventVisibility>();
    public DbSet<CalendarEventReminder> CalendarEventReminders => Set<CalendarEventReminder>();
    public DbSet<FamilyCalendarSettings> FamilyCalendarSettings => Set<FamilyCalendarSettings>();
    public DbSet<UserCalendarSettings> UserCalendarSettings => Set<UserCalendarSettings>();

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

            // ✅ 1 relação clara CalendarEvent -> Family usando FamilyId
            b.HasOne(x => x.Family)
                .WithMany(f => f.CalendarEvents)       // ✅ agora existe na entity Family
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ 1 relação clara CalendarEvent -> User (CreatedBy)
            b.HasOne(x => x.CreatedByUser)
                .WithMany(u => u.CreatedEvents)        // ✅ agora existe na entity User
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasOne(x => x.ParentEvent)
                .WithMany()
                .HasForeignKey(x => x.ParentEventId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => new { x.FamilyId, x.StartUtc });
            b.HasIndex(x => new { x.FamilyId, x.EndUtc });
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

        // EXPENSE
    }
}
