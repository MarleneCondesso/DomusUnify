using DomusUnify.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Infrastructure.Persistence;

public class DomusUnifyDbContext : DbContext
{
    public DomusUnifyDbContext(DbContextOptions<DomusUnifyDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Family> Families => Set<Family>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<SharedList> Lists => Set<SharedList>();
    public DbSet<ListItem> ListItems => Set<ListItem>();
    public DbSet<Expense> Expenses => Set<Expense>();

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

        // CALENDAR EVENT
        modelBuilder.Entity<CalendarEvent>(b =>
        {
            b.ToTable("CalendarEvents");
            b.HasKey(x => x.Id);

            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.Property(x => x.Description).HasMaxLength(1000);

            b.Property(x => x.StartUtc).IsRequired();
            b.Property(x => x.EndUtc).IsRequired();

            b.HasIndex(x => new { x.FamilyId, x.StartUtc });

            b.HasOne(x => x.Family)
                .WithMany(x => x.CalendarEvents)
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.CreatedByUser)
                .WithMany(x => x.CreatedEvents)
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
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
        });

        // EXPENSE
        modelBuilder.Entity<Expense>(b =>
        {
            b.ToTable("Expenses");
            b.HasKey(x => x.Id);

            b.Property(x => x.Amount)
                .HasPrecision(18, 2)
                .IsRequired();

            b.Property(x => x.Category).IsRequired();
            b.Property(x => x.Description).HasMaxLength(500);
            b.Property(x => x.DateUtc).IsRequired();

            b.HasIndex(x => new { x.FamilyId, x.DateUtc });

            b.HasOne(x => x.Family)
                .WithMany(x => x.Expenses)
                .HasForeignKey(x => x.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.CreatedByUser)
                .WithMany(x => x.CreatedExpenses)
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
