using DomusUnify.Application.Lists.Models;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Common.Realtime;

namespace DomusUnify.Application.Lists;

public sealed class ListService : IListService
{
    private readonly IAppDbContext _db;
    private readonly IRealtimeNotifier _rt;

    public ListService(IAppDbContext db, IRealtimeNotifier rt)
    {
        _db = db;
        _rt = rt;
    }

    public async Task<IReadOnlyList<ListSummary>> GetListsAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        var rows = await _db.Lists
            .AsNoTracking()
            .Where(l => l.FamilyId == familyId)
            .Select(l => new
            {
                l.Id,
                l.Name,
                l.Type, // enum (fica como int no SQL)
                ItemsCount = l.Items.Count(),
                CompletedCount = l.Items.Count(i => i.IsCompleted)
            })
            .OrderBy(x => x.Name) // ordenar por coluna real
            .ToListAsync(ct);

        return rows
            .Select(x => new ListSummary(
                x.Id,
                x.Name,
                x.Type.ToString(), // conversão já em memória
                x.ItemsCount,
                x.CompletedCount
            ))
            .ToList();
    }

    public async Task<ListSummary> CreateListAsync(Guid userId, Guid familyId, string name, string type, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        if (!Enum.TryParse<ListType>(type, true, out var listType))
            throw new ArgumentException("Tipo inválido. Use: Shopping, Tasks, Custom.");

        var trimmed = name.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Nome da lista é obrigatório.");

        var list = new SharedList
        {
            FamilyId = familyId,
            Name = trimmed,
            Type = listType
        };

        _db.Lists.Add(list);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "lists:changed", new
        {
            action = "created",
            list = new
            {
                id = list.Id,
                name = list.Name,
                type = list.Type.ToString()
            }
        }, ct);

        return new ListSummary(list.Id, list.Name, list.Type.ToString(), 0, 0);
    }

    public async Task RenameListAsync(Guid userId, Guid familyId, Guid listId, string newName, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var trimmed = newName.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Nome da lista é obrigatório.");

        var list = await _db.Lists.FirstOrDefaultAsync(l => l.Id == listId && l.FamilyId == familyId, ct);
        if (list is null)
            throw new KeyNotFoundException("Lista não encontrada.");

        list.Name = trimmed;
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "lists:changed", new
        {
            action = "renamed",
            list = new
            {
                id = list.Id,
                name = list.Name,
                type = list.Type.ToString()
            }
        }, ct);
    }

    public async Task DeleteListAsync(Guid userId, Guid familyId, Guid listId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var list = await _db.Lists
            .FirstOrDefaultAsync(l => l.Id == listId && l.FamilyId == familyId, ct);

        if (list is null)
            throw new KeyNotFoundException("Lista não encontrada.");

        _db.Lists.Remove(list);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "lists:changed", new
        {
            action = "deleted",
            listId
        }, ct);
    }


    public async Task<IReadOnlyList<ListItemModel>> GetItemsAsync(Guid userId, Guid familyId, Guid listId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        var listExists = await _db.Lists.AsNoTracking()
            .AnyAsync(l => l.Id == listId && l.FamilyId == familyId, ct);

        if (!listExists)
            throw new KeyNotFoundException("Lista não encontrada.");

        return await _db.ListItems
            .AsNoTracking()
            .Where(i => i.SharedListId == listId)
            .OrderBy(i => i.IsCompleted)
            .ThenBy(i => i.Name)
            .Select(i => new ListItemModel(
                i.Id,
                i.SharedListId,
                i.Name,
                i.CategoryId,
                i.IsCompleted,
                i.CompletedAtUtc,
                i.CompletedByUserId
            ))
            .ToListAsync(ct);
    }

    public async Task<ListItemModel> AddItemAsync(Guid userId, Guid familyId, Guid listId, string name, Guid? categoryId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var list = await _db.Lists.FirstOrDefaultAsync(l => l.Id == listId && l.FamilyId == familyId, ct);
        if (list is null) throw new KeyNotFoundException("Lista não encontrada.");

        Guid? finalCategoryId = null;

        if (categoryId is not null)
        {
            var exists = await _db.ItemCategories
                .AsNoTracking()
                .AnyAsync(c => c.Id == categoryId && c.FamilyId == familyId, ct);

            if (!exists) throw new ArgumentException("Categoria inválida para esta família.");

            finalCategoryId = categoryId;
        }

        var trimmed = name.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Nome do item é obrigatório.");

        var item = new ListItem
        {
            SharedListId = listId,
            Name = trimmed,
            CategoryId = finalCategoryId,
            IsCompleted = false
        };

        _db.ListItems.Add(item);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "listitems:added", new
        {
            listId,
            item = new
            {
                id = item.Id,
                name = item.Name,
                categoryId = item.CategoryId,
                isCompleted = item.IsCompleted,
                completedAtUtc = item.CompletedAtUtc,
                completedByUserId = item.CompletedByUserId
            }
        }, ct);

        return new ListItemModel(item.Id, item.SharedListId, item.Name, item.CategoryId, item.IsCompleted, item.CompletedAtUtc, item.CompletedByUserId);
    }

    public async Task UpdateItemAsync(
      Guid userId,
      Guid familyId,
      Guid itemId,
      string? name,
      bool? isCompleted,
      bool categoryChangeRequested,
      Guid? categoryId,
      CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var item = await _db.ListItems
            .Include(i => i.SharedList)
            .FirstOrDefaultAsync(i => i.Id == itemId, ct);

        if (item is null || item.SharedList.FamilyId != familyId)
            throw new KeyNotFoundException("Item não encontrado.");

        // Nome
        if (name is not null)
        {
            var trimmed = name.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                throw new ArgumentException("Nome do item inválido.");
            item.Name = trimmed;
        }

        // Categoria (PATCH profissional)
        if (categoryChangeRequested)
        {
            if (categoryId is null)
            {
                item.CategoryId = null; // remover
            }
            else
            {
                var exists = await _db.ItemCategories
                    .AsNoTracking()
                    .AnyAsync(c => c.Id == categoryId && c.FamilyId == familyId, ct);

                if (!exists)
                    throw new ArgumentException("Categoria inválida para esta família.");

                item.CategoryId = categoryId;
            }
        }

        // Completed
        if (isCompleted.HasValue)
        {
            item.IsCompleted = isCompleted.Value;

            if (isCompleted.Value)
            {
                item.CompletedAtUtc = DateTime.UtcNow;
                item.CompletedByUserId = userId;
            }
            else
            {
                item.CompletedAtUtc = null;
                item.CompletedByUserId = null;
            }
        }

        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "listitems:updated", new
        {
            listId = item.SharedListId,
            item = new
            {
                id = item.Id,
                name = item.Name,
                categoryId = item.CategoryId,
                isCompleted = item.IsCompleted,
                completedAtUtc = item.CompletedAtUtc,
                completedByUserId = item.CompletedByUserId
            }
        }, ct);
    }

    public async Task DeleteItemAsync(Guid userId, Guid familyId, Guid itemId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var item = await _db.ListItems
            .Include(i => i.SharedList)
            .FirstOrDefaultAsync(i => i.Id == itemId, ct);

        if (item is null || item.SharedList.FamilyId != familyId)
            throw new KeyNotFoundException("Item não encontrado.");

        _db.ListItems.Remove(item);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "listitems:deleted", new
        {
            itemId
        }, ct);

    }

    private async Task<FamilyRole> EnsureMemberAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        var role = await _db.FamilyMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.FamilyId == familyId)
            .Select(m => (FamilyRole?)m.Role)
            .FirstOrDefaultAsync(ct);

        if (role is null)
            throw new UnauthorizedAccessException("Não és membro desta família.");

        return role.Value;
    }

    private static void EnsureNotViewer(FamilyRole role)
    {
        if (role == FamilyRole.Viewer)
            throw new UnauthorizedAccessException("Sem permissões para editar.");
    }
}
