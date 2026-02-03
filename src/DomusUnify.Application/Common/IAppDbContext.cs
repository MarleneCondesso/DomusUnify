using DomusUnify.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<ListCategory> ListCategories { get; }
    DbSet<ItemCategory> ItemCategories { get; }
    DbSet<SharedList> Lists { get; }
    DbSet<ListItem> ListItems { get; }
    DbSet<FamilyMember> FamilyMembers { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
