using BCrypt.Net;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Infrastructure.Persistence;

/// <summary>
/// Utilitário para semear dados iniciais na base de dados.
/// </summary>
public static class DbSeeder
{
    /// <summary>
    /// Aplica migrações e cria um conjunto mínimo de dados (se a base de dados estiver vazia).
    /// </summary>
    /// <remarks>
    /// Cria um utilizador administrador e uma família por defeito, para facilitar ambientes de desenvolvimento.
    /// </remarks>
    /// <param name="db">Contexto de base de dados.</param>
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
