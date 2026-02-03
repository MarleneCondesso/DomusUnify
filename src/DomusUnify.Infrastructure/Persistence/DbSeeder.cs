using BCrypt.Net;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(DomusUnifyDbContext db)
    {
        // garante migrations aplicadas (opcional se já corres "database update")
        await db.Database.MigrateAsync();

        if (await db.Users.AnyAsync())
            return; // já há dados, não semear

        var adminUser = new User
        {
            Name = "Domus Admin",
            Email = "admin@domusunify.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!")
        };


        var family = new Family
        {
            Name = "DomusUnify Family"
        };

        db.Users.Add(adminUser);
        db.Families.Add(family);

        await db.SaveChangesAsync();

        var membership = new FamilyMember
        {
            FamilyId = family.Id,
            UserId = adminUser.Id,
            Role = FamilyRole.Admin
        };

        db.FamilyMembers.Add(membership);
        adminUser.CurrentFamilyId = family.Id;

        await db.SaveChangesAsync();
    }
}
