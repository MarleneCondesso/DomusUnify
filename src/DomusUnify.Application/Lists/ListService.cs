using DomusUnify.Application.Activity;
using DomusUnify.Application.Activity.Models;
using DomusUnify.Application.Common.Covers;
using DomusUnify.Application.Lists.Models;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Common.Realtime;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace DomusUnify.Application.Lists;

/// <summary>
/// Implementação do serviço de listas e itens.
/// </summary>
public sealed class ListService : IListService
{
    private readonly IAppDbContext _db;
    private readonly IRealtimeNotifier _rt;
    private readonly IActivityService _activity;
    private readonly IStockPhotoProvider _stockPhotos;

    /// <summary>
    /// Inicializa uma nova instância de <see cref="ListService"/>.
    /// </summary>
    /// <param name="db">Contexto de base de dados.</param>
    /// <param name="rt">Notificador em tempo real.</param>
    /// <param name="activity">Serviço de feed de atividade.</param>
    /// <param name="stockPhotos">Provider de fotos stock (opcional / best-effort).</param>
    public ListService(IAppDbContext db, IRealtimeNotifier rt, IActivityService activity, IStockPhotoProvider stockPhotos)
    {
        _db = db;
        _rt = rt;
        _activity = activity;
        _stockPhotos = stockPhotos;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ListSummary>> GetListsAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        var familyMembers = await _db.FamilyMembers
            .AsNoTracking()
            .Where(m => m.FamilyId == familyId)
            .Select(m => new { m.UserId, m.User.Name })
            .ToListAsync(ct);

        var memberNameById = familyMembers
            .GroupBy(m => m.UserId)
            .ToDictionary(g => g.Key, g => g.Last().Name);

        var allMemberIds = familyMembers.Select(m => m.UserId).Distinct().ToList();

        var rows = await _db.Lists
            .AsNoTracking()
            .Where(l => l.FamilyId == familyId)
            .Where(l =>
                l.VisibilityMode == ListVisibilityMode.AllMembers ||
                l.OwnerUserId == userId ||
                (l.VisibilityMode == ListVisibilityMode.SpecificMembers && l.AllowedUsers.Any(a => a.UserId == userId)))
            .Select(l => new
            {
                l.Id,
                l.Name,
                l.ColorHex,
                l.Type, // enum (fica como int no SQL)
                l.CoverImageUrl,
                l.OwnerUserId,
                l.VisibilityMode,
                ItemsCount = l.Items.Count(),
                CompletedCount = l.Items.Count(i => i.IsCompleted)
            })
            .OrderBy(x => x.Name) // ordenar por coluna real
            .ToListAsync(ct);

        var listIds = rows.Select(r => r.Id).ToList();

        var allowedRows = await _db.ListUserAccess
            .AsNoTracking()
            .Where(a => listIds.Contains(a.SharedListId))
            .Select(a => new { a.SharedListId, a.UserId })
            .ToListAsync(ct);

        var allowedByList = allowedRows
            .GroupBy(x => x.SharedListId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.UserId).Distinct().ToList());

        var result = new List<ListSummary>(rows.Count);

        foreach (var row in rows)
        {
            var allowedUserIds = allowedByList.TryGetValue(row.Id, out var ids) ? ids : new List<Guid>();

            var coverImageUrl = string.IsNullOrWhiteSpace(row.CoverImageUrl) || IsLegacyCoverUrl(row.CoverImageUrl)
                ? GenerateSvgCoverImageUrl(row.Type, row.Name, row.Id, row.ColorHex)
                : row.CoverImageUrl;

            IReadOnlyList<Guid> sharedWithUserIds = row.VisibilityMode switch
            {
                ListVisibilityMode.AllMembers => allMemberIds,
                ListVisibilityMode.Private => new List<Guid> { row.OwnerUserId },
                ListVisibilityMode.SpecificMembers => EnsureOwnerIncluded(row.OwnerUserId, allowedUserIds),
                _ => new List<Guid> { row.OwnerUserId }
            };

            var sharedWithMembers = sharedWithUserIds
                .Distinct()
                .Where(memberNameById.ContainsKey)
                .Select(uid => new ListMemberPreview(uid, memberNameById[uid]))
                .ToList();

            var allowedForResponse = row.VisibilityMode == ListVisibilityMode.SpecificMembers
                ? allowedUserIds.Distinct().ToList()
                : new List<Guid>();

            result.Add(new ListSummary(
                row.Id,
                row.Name,
                row.ColorHex ?? string.Empty,
                coverImageUrl,
                row.Type.ToString(), // conversão já em memória
                row.OwnerUserId,
                row.VisibilityMode.ToString(),
                allowedForResponse,
                sharedWithMembers,
                row.ItemsCount,
                row.CompletedCount
            ));
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<ListSummary> CreateListAsync(Guid userId, Guid familyId, ListCreateInput input, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var now = DateTime.UtcNow;

        if (!Enum.TryParse<ListType>(input.Type, true, out var listType))
            throw new ArgumentException("Tipo inválido. Use: Shopping, Tasks, Custom.");

        if (!Enum.TryParse<ListVisibilityMode>(input.VisibilityMode, true, out var visibilityMode))
            throw new ArgumentException("Visibilidade inválida. Use: Private, AllMembers, SpecificMembers.");

        var trimmed = input.Name.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Nome da lista é obrigatório.");

        var list = new SharedList
        {
            FamilyId = familyId,
            OwnerUserId = userId,
            Name = trimmed,
            Type = listType,
            ColorHex = input.ColorHex.Trim(),
            VisibilityMode = visibilityMode,
            CreatedAtUtc = now
        };

        list.CoverImageUrl = await ResolveCoverImageUrlAsync(list.Type, list.Name, list.Id, list.ColorHex, ct);

        // Specific members
        if (visibilityMode == ListVisibilityMode.SpecificMembers)
        {
            var allowed = (input.AllowedUserIds ?? Array.Empty<Guid>()).Distinct().ToList();
            if (allowed.Count == 0)
                throw new ArgumentException("Escolhe pelo menos 1 membro para a visibilidade SpecificMembers.");

            if (!allowed.Contains(userId))
                allowed.Add(userId);

            await EnsureAllUsersAreFamilyMembersAsync(familyId, allowed, ct);

            foreach (var uid in allowed)
            {
                list.AllowedUsers.Add(new SharedListUserAccess
                {
                    Id = Guid.NewGuid(),
                    SharedListId = list.Id,
                    UserId = uid,
                    CreatedAtUtc = now
                });
            }
        }

        _db.Lists.Add(list);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "lists:changed", new
        {
            action = "created",
            list = new
            {
                id = list.Id,
                name = list.Name,
                type = list.Type.ToString(),
                colorHex = list.ColorHex,
                ownerUserId = list.OwnerUserId,
                visibilityMode = list.VisibilityMode.ToString()
            }
        }, ct);

        await _activity.LogAsync(
            familyId,
            userId,
            new ActivityLogInput(
                Kind: "lists:created",
                Message: $"created list: {list.Name}",
                ListId: list.Id),
            ct);

        var allowedUserIds = visibilityMode == ListVisibilityMode.SpecificMembers
            ? list.AllowedUsers.Select(x => x.UserId).Distinct().ToList()
            : new List<Guid>();

        var sharedWithMembers = await GetMemberPreviewsAsync(
            familyId,
            visibilityMode switch
            {
                ListVisibilityMode.AllMembers => null,
                ListVisibilityMode.Private => new List<Guid> { list.OwnerUserId },
                ListVisibilityMode.SpecificMembers => EnsureOwnerIncluded(list.OwnerUserId, allowedUserIds).ToList(),
                _ => new List<Guid> { list.OwnerUserId }
            },
            ct);

        return new ListSummary(
            list.Id,
            list.Name,
            list.ColorHex ?? string.Empty,
            list.CoverImageUrl ?? string.Empty,
            list.Type.ToString(),
            list.OwnerUserId,
            list.VisibilityMode.ToString(),
            allowedUserIds,
            sharedWithMembers,
            ItemsCount: 0,
            CompletedCount: 0);
    }

    /// <inheritdoc />
    public async Task<int> RegenerateListCoversAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var lists = await _db.Lists
            .Where(l => l.FamilyId == familyId)
            .Where(l =>
                l.VisibilityMode == ListVisibilityMode.AllMembers ||
                l.OwnerUserId == userId ||
                (l.VisibilityMode == ListVisibilityMode.SpecificMembers && l.AllowedUsers.Any(a => a.UserId == userId)))
            .ToListAsync(ct);

        if (lists.Count == 0)
            return 0;

        var inputs = lists
            .Select(l => new { l.Id, l.Type, l.Name, l.ColorHex })
            .ToList();

        const int maxParallel = 3;
        using var sem = new SemaphoreSlim(maxParallel, maxParallel);

        var tasks = inputs.Select(async x =>
        {
            await sem.WaitAsync(ct);
            try
            {
                var url = await ResolveCoverImageUrlAsync(x.Type, x.Name, x.Id, x.ColorHex, ct);
                return (x.Id, Url: url);
            }
            finally
            {
                sem.Release();
            }
        }).ToArray();

        var results = await Task.WhenAll(tasks);
        var byId = results.ToDictionary(x => x.Id, x => x.Url);

        var now = DateTime.UtcNow;

        foreach (var list in lists)
        {
            if (!byId.TryGetValue(list.Id, out var url))
                continue;

            list.CoverImageUrl = url;
            list.UpdatedAtUtc = now;
        }

        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "lists:changed", new
        {
            action = "covers:regenerated"
        }, ct);

        return lists.Count;
    }

    /// <inheritdoc />
    public async Task UpdateListAsync(Guid userId, Guid familyId, Guid listId, ListUpdateInput input, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var trimmed = input.Name.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Nome da lista é obrigatório.");

        if (!Enum.TryParse<ListType>(input.Type, true, out var listType))
            throw new ArgumentException("Tipo inválido. Use: Shopping, Tasks, Custom.");

        var list = await _db.Lists
            .Include(l => l.AllowedUsers)
            .FirstOrDefaultAsync(l => l.Id == listId && l.FamilyId == familyId, ct);

        if (list is null)
            throw new KeyNotFoundException("Lista não encontrada.");

        EnsureListAccess(userId, list);

        var oldName = list.Name;
        var oldType = list.Type;
        var oldColorHex = list.ColorHex;

        list.Name = trimmed;
        list.ColorHex = input.ColorHex.Trim();
        list.Type = listType;

        var shouldRegenerateCover =
            string.IsNullOrWhiteSpace(list.CoverImageUrl) ||
            !string.Equals(oldName, list.Name, StringComparison.Ordinal) ||
            oldType != list.Type ||
            !string.Equals(oldColorHex, list.ColorHex, StringComparison.Ordinal);

        if (shouldRegenerateCover)
            list.CoverImageUrl = await ResolveCoverImageUrlAsync(list.Type, list.Name, list.Id, list.ColorHex, ct);

        var sharingChangeRequested = input.VisibilityMode is not null || input.AllowedUserIds is not null;

        if (sharingChangeRequested)
        {
            if (list.OwnerUserId != userId)
                throw new UnauthorizedAccessException("Sem permissões para alterar a visibilidade desta lista.");

            if (input.VisibilityMode is not null)
            {
                if (!Enum.TryParse<ListVisibilityMode>(input.VisibilityMode, true, out var parsedVisibility))
                    throw new ArgumentException("Visibilidade inválida. Use: Private, AllMembers, SpecificMembers.");

                list.VisibilityMode = parsedVisibility;
            }

            if (list.VisibilityMode == ListVisibilityMode.SpecificMembers)
            {
                var allowed = (input.AllowedUserIds ?? list.AllowedUsers.Select(x => x.UserId).ToList())
                    .Distinct()
                    .ToList();

                if (allowed.Count == 0)
                    throw new ArgumentException("Escolhe pelo menos 1 membro para a visibilidade SpecificMembers.");

                if (!allowed.Contains(list.OwnerUserId))
                    allowed.Add(list.OwnerUserId);

                await EnsureAllUsersAreFamilyMembersAsync(familyId, allowed, ct);

                _db.ListUserAccess.RemoveRange(list.AllowedUsers);
                list.AllowedUsers.Clear();

                var now = DateTime.UtcNow;

                foreach (var uid in allowed)
                {
                    list.AllowedUsers.Add(new SharedListUserAccess
                    {
                        Id = Guid.NewGuid(),
                        SharedListId = list.Id,
                        UserId = uid,
                        CreatedAtUtc = now
                    });
                }
            }
            else
            {
                if (list.AllowedUsers.Count > 0)
                {
                    _db.ListUserAccess.RemoveRange(list.AllowedUsers);
                    list.AllowedUsers.Clear();
                }
            }
        }

        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "lists:changed", new
        {
            action = "updated",
            list = new
            {
                id = list.Id,
                name = list.Name,
                colorHex = list.ColorHex,
                type = list.Type.ToString(),
                ownerUserId = list.OwnerUserId,
                visibilityMode = list.VisibilityMode.ToString()
            }
        }, ct);

        await _activity.LogAsync(
            familyId,
            userId,
            new ActivityLogInput(
                Kind: "lists:updated",
                Message: $"updated list: {list.Name}",
                ListId: list.Id),
            ct);
    }

    /// <inheritdoc />
    public async Task DeleteListAsync(Guid userId, Guid familyId, Guid listId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var list = await _db.Lists
            .Include(l => l.AllowedUsers)
            .FirstOrDefaultAsync(l => l.Id == listId && l.FamilyId == familyId, ct);

        if (list is null)
            throw new KeyNotFoundException("Lista não encontrada.");

        EnsureListAccess(userId, list);

        var listName = list.Name;

        _db.Lists.Remove(list);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "lists:changed", new
        {
            action = "deleted",
            listId
        }, ct);

        await _activity.LogAsync(
            familyId,
            userId,
            new ActivityLogInput(
                Kind: "lists:deleted",
                Message: $"deleted list: {listName}",
                ListId: null,
                EntityId: listId),
            ct);
    }


    /// <inheritdoc />
    public async Task<IReadOnlyList<ListItemModel>> GetItemsAsync(Guid userId, Guid familyId, Guid listId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        var listExists = await _db.Lists
            .AsNoTracking()
            .Where(l => l.Id == listId && l.FamilyId == familyId)
            .Where(l =>
                l.VisibilityMode == ListVisibilityMode.AllMembers ||
                l.OwnerUserId == userId ||
                (l.VisibilityMode == ListVisibilityMode.SpecificMembers && l.AllowedUsers.Any(a => a.UserId == userId)))
            .AnyAsync(ct);

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
                i.AssigneeUserId,
                i.Note,
                i.PhotoUrl,
                i.IsCompleted,
                i.CompletedAtUtc,
                i.CompletedByUserId
            ))
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<ListItemModel> AddItemAsync(
        Guid userId,
        Guid familyId,
        Guid listId,
        string name,
        Guid? categoryId,
        Guid? assigneeUserId,
        string? note,
        string? photoUrl,
        CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var list = await _db.Lists
            .Include(l => l.AllowedUsers)
            .FirstOrDefaultAsync(l => l.Id == listId && l.FamilyId == familyId, ct);
        if (list is null) throw new KeyNotFoundException("Lista não encontrada.");

        EnsureListAccess(userId, list);

        Guid? finalCategoryId = null;

        if (categoryId is not null)
        {
            var exists = await _db.ItemCategories
                .AsNoTracking()
                .AnyAsync(c => c.Id == categoryId && c.FamilyId == familyId && c.Type == list.Type, ct);

            if (!exists) throw new ArgumentException("Categoria inválida para esta família.");

            finalCategoryId = categoryId;
        }

        var trimmed = name.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Nome do item é obrigatório.");

        Guid? finalAssigneeUserId = null;
        if (assigneeUserId is not null)
        {
            var isMember = await _db.FamilyMembers
                .AsNoTracking()
                .AnyAsync(m => m.FamilyId == familyId && m.UserId == assigneeUserId, ct);

            if (!isMember) throw new ArgumentException("AtribuiÃ§Ã£o invÃ¡lida para esta famÃ­lia.");
            finalAssigneeUserId = assigneeUserId;
        }

        string? finalNote = null;
        if (note is not null)
        {
            var noteTrimmed = note.Trim();
            if (noteTrimmed.Length > 2000)
                throw new ArgumentException("Nota demasiado longa (max 2000 caracteres).");

            finalNote = string.IsNullOrWhiteSpace(noteTrimmed) ? null : noteTrimmed;
        }

        string? finalPhotoUrl = null;
        if (photoUrl is not null)
        {
            var photoTrimmed = photoUrl.Trim();
            if (photoTrimmed.Length > 2_000_000)
                throw new ArgumentException("Foto demasiado grande.");

            finalPhotoUrl = string.IsNullOrWhiteSpace(photoTrimmed) ? null : photoTrimmed;
        }

        var item = new ListItem
        {
            SharedListId = listId,
            Name = trimmed,
            CategoryId = finalCategoryId,
            AssigneeUserId = finalAssigneeUserId,
            Note = finalNote,
            PhotoUrl = finalPhotoUrl,
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
                assigneeUserId = item.AssigneeUserId,
                note = item.Note,
                photoUrl = item.PhotoUrl,
                isCompleted = item.IsCompleted,
                completedAtUtc = item.CompletedAtUtc,
                completedByUserId = item.CompletedByUserId
            }
        }, ct);

        await _activity.LogAsync(
            familyId,
            userId,
            new ActivityLogInput(
                Kind: "listitems:added",
                Message: $"added item \"{item.Name}\" to {list.Name}",
                ListId: listId,
                EntityId: item.Id),
            ct);

        return new ListItemModel(
            item.Id,
            item.SharedListId,
            item.Name,
            item.CategoryId,
            item.AssigneeUserId,
            item.Note,
            item.PhotoUrl,
            item.IsCompleted,
            item.CompletedAtUtc,
            item.CompletedByUserId);
    }

    /// <inheritdoc />
    public async Task UpdateItemAsync(
      Guid userId,
      Guid familyId,
      Guid itemId,
      string? name,
      bool? isCompleted,
      bool categoryChangeRequested,
      Guid? categoryId,
      bool assigneeChangeRequested,
      Guid? assigneeUserId,
      bool noteChangeRequested,
      string? note,
      bool photoChangeRequested,
      string? photoUrl,
      CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var item = await _db.ListItems
            .Include(i => i.SharedList)
            .ThenInclude(l => l.AllowedUsers)
            .FirstOrDefaultAsync(i => i.Id == itemId, ct);

        if (item is null || item.SharedList.FamilyId != familyId)
            throw new KeyNotFoundException("Item não encontrado.");

        EnsureListAccess(userId, item.SharedList);

        var wasCompleted = item.IsCompleted;
        var beforeName = item.Name;

        // Nome
        if (name is not null)
        {
            var trimmed = name.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                throw new ArgumentException("Nome do item inválido.");
            item.Name = trimmed;
        }

        // Categoria 
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
                    .AnyAsync(c => c.Id == categoryId && c.FamilyId == familyId && c.Type == item.SharedList.Type, ct);

                if (!exists)
                    throw new ArgumentException("Categoria inválida para esta família.");

                item.CategoryId = categoryId; // definir
            }
        }

        // AtribuiÃ§Ã£o
        if (assigneeChangeRequested)
        {
            if (assigneeUserId is null)
            {
                item.AssigneeUserId = null;
            }
            else
            {
                var isMember = await _db.FamilyMembers
                    .AsNoTracking()
                    .AnyAsync(m => m.FamilyId == familyId && m.UserId == assigneeUserId, ct);

                if (!isMember)
                    throw new ArgumentException("AtribuiÃ§Ã£o invÃ¡lida para esta famÃ­lia.");

                item.AssigneeUserId = assigneeUserId;
            }
        }

        // Nota
        if (noteChangeRequested)
        {
            if (note is null)
            {
                item.Note = null;
            }
            else
            {
                var noteTrimmed = note.Trim();
                if (noteTrimmed.Length > 2000)
                    throw new ArgumentException("Nota demasiado longa (max 2000 caracteres).");

                item.Note = string.IsNullOrWhiteSpace(noteTrimmed) ? null : noteTrimmed;
            }
        }

        // Foto
        if (photoChangeRequested)
        {
            if (photoUrl is null)
            {
                item.PhotoUrl = null;
            }
            else
            {
                var photoTrimmed = photoUrl.Trim();
                if (photoTrimmed.Length > 2_000_000)
                    throw new ArgumentException("Foto demasiado grande.");

                item.PhotoUrl = string.IsNullOrWhiteSpace(photoTrimmed) ? null : photoTrimmed;
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
                assigneeUserId = item.AssigneeUserId,
                note = item.Note,
                photoUrl = item.PhotoUrl,
                isCompleted = item.IsCompleted,
                completedAtUtc = item.CompletedAtUtc,
                completedByUserId = item.CompletedByUserId
            }
        }, ct);

        // Activity (só para alterações relevantes para o feed)
        if (isCompleted.HasValue && item.IsCompleted != wasCompleted)
        {
            var kind = item.IsCompleted ? "listitems:completed" : "listitems:uncompleted";
            var message = item.IsCompleted
                ? $"completed \"{item.Name}\" in {item.SharedList.Name}"
                : $"marked \"{item.Name}\" as incomplete in {item.SharedList.Name}";

            await _activity.LogAsync(
                familyId,
                userId,
                new ActivityLogInput(kind, message, ListId: item.SharedListId, EntityId: item.Id),
                ct);
        }
        else if (name is not null && item.Name != beforeName)
        {
            await _activity.LogAsync(
                familyId,
                userId,
                new ActivityLogInput(
                    Kind: "listitems:renamed",
                    Message: $"renamed item to \"{item.Name}\" in {item.SharedList.Name}",
                    ListId: item.SharedListId,
                    EntityId: item.Id),
                ct);
        }
    }

    /// <inheritdoc />
    public async Task DeleteItemAsync(Guid userId, Guid familyId, Guid itemId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var item = await _db.ListItems
            .Include(i => i.SharedList)
            .ThenInclude(l => l.AllowedUsers)
            .FirstOrDefaultAsync(i => i.Id == itemId, ct);

        if (item is null || item.SharedList.FamilyId != familyId)
            throw new KeyNotFoundException("Item não encontrado.");

        EnsureListAccess(userId, item.SharedList);

        var listName = item.SharedList.Name;
        var itemName = item.Name;
        var listId = item.SharedListId;

        _db.ListItems.Remove(item);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "listitems:deleted", new
        {
            itemId
        }, ct);

        await _activity.LogAsync(
            familyId,
            userId,
            new ActivityLogInput(
                Kind: "listitems:deleted",
                Message: $"deleted item \"{itemName}\" from {listName}",
                ListId: listId,
                EntityId: itemId),
            ct);

    }

    private static IReadOnlyList<Guid> EnsureOwnerIncluded(Guid ownerUserId, IReadOnlyList<Guid> userIds)
    {
        if (userIds.Contains(ownerUserId))
            return userIds;

        var copy = userIds.ToList();
        copy.Add(ownerUserId);
        return copy;
    }

    private static void EnsureListAccess(Guid userId, SharedList list)
    {
        switch (list.VisibilityMode)
        {
            case ListVisibilityMode.AllMembers:
                return;
            case ListVisibilityMode.Private:
                if (list.OwnerUserId != userId)
                    throw new UnauthorizedAccessException("Sem permissões para aceder a esta lista.");
                return;
            case ListVisibilityMode.SpecificMembers:
                if (list.OwnerUserId == userId) return;
                if (list.AllowedUsers.Any(a => a.UserId == userId)) return;
                throw new UnauthorizedAccessException("Sem permissões para aceder a esta lista.");
            default:
                throw new InvalidOperationException("Visibilidade inválida.");
        }
    }

    private async Task<string> ResolveCoverImageUrlAsync(
        ListType type,
        string name,
        Guid listId,
        string? colorHex,
        CancellationToken ct)
    {
        var category = GetCoverCategory(type, name);
        var seed = CreateStableLockValue(listId, name, category);
        var query = BuildStockPhotoQuery(category, name);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(6));

        var photoUrl = await _stockPhotos.TryGetPhotoUrlAsync(query, seed, cts.Token);
        if (!string.IsNullOrWhiteSpace(photoUrl))
            return photoUrl;

        // Fallback sempre disponível (SVG local).
        return GenerateSvgCoverImageUrl(type, name, listId, colorHex);
    }

    private static string GetCoverCategory(ListType type, string name)
    {
        // Preferimos inferir pelo título para que listas "Tasks" como "Festa de Aniversário"
        // possam ter capa de festa (balões), e não ficar presas ao tipo.
        var inferred = InferCoverCategoryFromTitle(name);
        if (!string.Equals(inferred, "generic", StringComparison.Ordinal))
            return inferred;

        return type switch
        {
            ListType.Shopping => "grocery",
            ListType.Tasks => "cleaning",
            _ => "generic"
        };
    }

    private static string BuildStockPhotoQuery(string category, string name)
    {
        var title = NormalizeForMatch(name);
        title = string.Join(' ', title.Split(' ', StringSplitOptions.RemoveEmptyEntries));

        // Queries curadas por categoria para aumentar a probabilidade de corresponder ao que o utilizador espera
        // (ex.: party -> balões; school -> secretária com lápis).
        var q = category switch
        {
            "grocery" => "grocery store produce aisle vegetables empty no people",
            "cleaning" => "clean living room home interior no people",
            "school" => "school supplies desk pencils notebook flat lay no people",
            "cooking" => "meal prep vegetables kitchen counter still life no people",
            "party" => "birthday balloons party decoration still life no people",
            "gift" => "gift box present wrapping paper no people",
            "diy" => "home improvement tools on workbench still life no people",
            "travel" => "travel suitcase map no people",
            "finance" => "budget planning notebook desk flat lay no people",
            "fitness" => "gym workout equipment dumbbells still life no people",
            _ => string.IsNullOrWhiteSpace(title) ? "abstract background" : title
        };

        return q.Length > 100 ? q[..100] : q;
    }

    private static string GenerateSvgCoverImageUrl(ListType type, string name, Guid listId, string? colorHex)
    {
        var category = GetCoverCategory(type, name);

        var seed = CreateStableLockValue(listId, name, category);

        var accent = TryNormalizeHexColor(colorHex);
        var accentParam = accent is null ? string.Empty : $"&accent={Uri.EscapeDataString(accent)}";

        // Endpoint público (sem auth) que devolve um SVG. É determinístico por `category` + `seed`.
        // Guardamos a URL na lista para o frontend usar diretamente como background-image.
        return $"/api/v1/list-covers/svg?category={Uri.EscapeDataString(category)}&seed={seed}{accentParam}";
    }

    private static int CreateStableLockValue(Guid listId, string name, string tags)
    {
        using var sha = SHA256.Create();
        var input = $"{listId}:{name}:{tags}";
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
        var value = BitConverter.ToUInt32(hash, 0);
        return (int)(value % int.MaxValue);
    }

    private static string InferCoverCategoryFromTitle(string title)
    {
        var text = NormalizeForMatch(title);

        // Groceries / compras
        if (ContainsAny(text, "grocery", "groceries", "shopping", "compras", "supermercado", "mercado", "mercearia", "food"))
            return "grocery";

        // Cleaning / casa / tarefas
        if (ContainsAny(text, "clean", "cleaning", "limpeza", "limpar", "arrumar", "faxina", "casa", "house", "chores", "tarefas"))
            return "cleaning";

        // School / estudo
        if (ContainsAny(text, "school", "escola", "study", "estudo", "universidade", "college", "homework", "material"))
            return "school";

        // Cooking / meal planning
        if (ContainsAny(text, "meal", "meals", "mealprep", "cozinha", "receita", "recipe", "cook", "cooking", "refeicao", "refeicoes"))
            return "cooking";

        // Party / aniversário
        if (ContainsAny(text, "birthday", "aniversario", "festa", "party", "evento"))
            return "party";

        // Gifts / presentes
        if (ContainsAny(text, "gift", "present", "presente", "presentes", "prenda", "prendas"))
            return "gift";

        // Home improvement / DIY
        if (ContainsAny(text, "diy", "bricolage", "obras", "reparos", "renovacao", "renovar", "tools", "improvement"))
            return "diy";

        // Travel
        if (ContainsAny(text, "travel", "viagem", "ferias", "trip", "vacation"))
            return "travel";

        // Finance
        if (ContainsAny(text, "budget", "orcamento", "financas", "finance", "contas", "bills", "pagamentos"))
            return "finance";

        // Fitness
        if (ContainsAny(text, "fitness", "gym", "treino", "workout", "corrida", "yoga"))
            return "fitness";

        return "generic";
    }

    private static bool IsLegacyCoverUrl(string? coverImageUrl)
    {
        if (string.IsNullOrWhiteSpace(coverImageUrl))
            return true;

        // Já é o nosso gerador atual (pode vir como URL absoluto em alguns ambientes).
        if (coverImageUrl.Contains("/api/v1/list-covers/svg", StringComparison.OrdinalIgnoreCase))
            return false;

        // URLs antigos que vinham do provider externo.
        if (coverImageUrl.StartsWith("https://loremflickr.com/", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static string? TryNormalizeHexColor(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var raw = value.Trim();
        if (!raw.StartsWith('#'))
            raw = $"#{raw}";

        if (raw.Length != 7)
            return null;

        for (var i = 1; i < raw.Length; i++)
        {
            var c = raw[i];
            var isHex = (c >= '0' && c <= '9') ||
                        (c >= 'a' && c <= 'f') ||
                        (c >= 'A' && c <= 'F');
            if (!isHex) return null;
        }

        return raw.ToUpperInvariant();
    }

    private static bool ContainsAny(string text, params string[] terms)
    {
        foreach (var term in terms)
        {
            if (text.Contains(term, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static string NormalizeForMatch(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var lowered = value.Trim().ToLowerInvariant();

        // Remove acentos/diacríticos (ex.: "aniversário" -> "aniversario")
        var normalized = lowered.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);

        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                sb.Append(ch);
        }

        return sb.ToString().Normalize(NormalizationForm.FormC);
    }

    private async Task<IReadOnlyList<ListMemberPreview>> GetMemberPreviewsAsync(
        Guid familyId,
        IReadOnlyList<Guid>? userIds,
        CancellationToken ct)
    {
        var query = _db.FamilyMembers
            .AsNoTracking()
            .Where(m => m.FamilyId == familyId);

        if (userIds is not null)
            query = query.Where(m => userIds.Contains(m.UserId));

        return await query
            .Select(m => new ListMemberPreview(m.UserId, m.User.Name))
            .ToListAsync(ct);
    }

    private async Task EnsureAllUsersAreFamilyMembersAsync(Guid familyId, IReadOnlyList<Guid> userIds, CancellationToken ct)
    {
        var members = await _db.FamilyMembers
            .AsNoTracking()
            .Where(m => m.FamilyId == familyId && userIds.Contains(m.UserId))
            .Select(m => m.UserId)
            .ToListAsync(ct);

        var set = members.ToHashSet();
        var missing = userIds.Where(id => !set.Contains(id)).ToList();
        if (missing.Count > 0)
            throw new ArgumentException("Lista de membros inválida para esta família.");
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
