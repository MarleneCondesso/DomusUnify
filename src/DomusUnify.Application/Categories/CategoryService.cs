using System.Text.RegularExpressions;
using DomusUnify.Application.Categories.Models;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Common.Realtime;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Categories;

/// <summary>
/// Implementação do serviço de categorias de itens.
/// </summary>
public sealed class CategoryService : ICategoryService
{
    private static readonly Regex IconKeyRegex = new("^[a-z0-9_-]{1,40}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex ColorHexRegex = new("^#[0-9a-fA-F]{6}$", RegexOptions.Compiled);

    private static readonly IReadOnlyList<(ListType Type, string Name, string IconKey, int SortOrder)> DefaultItemCategories =
    [
        // Shopping
        (ListType.Shopping, "Sushi", "emoji_1f363", 0),
        (ListType.Shopping, "Frutas & Legumes", "emoji_1f34e", 1),
        (ListType.Shopping, "Carne & Peixe", "emoji_1f357", 2),
        (ListType.Shopping, "Pão & Confeitaria", "emoji_1f35e", 3),
        (ListType.Shopping, "Laticínios", "emoji_1f95b", 4),
        (ListType.Shopping, "Congelados & Conveniente", "emoji_2744_fe0f", 5),
        (ListType.Shopping, "Cereais & Grãos", "emoji_1f33e", 6),
        (ListType.Shopping, "Bebidas", "emoji_1f9c3", 7),
        (ListType.Shopping, "Ingredientes & Condimentos", "emoji_1f9c2", 8),
        (ListType.Shopping, "Lanches & Doces", "emoji_1f36b", 9),
        (ListType.Shopping, "Artesanato & Jardim", "emoji_1f9f4", 10),
        (ListType.Shopping, "Limpeza & Higiene", "emoji_1f9fc", 11),
        (ListType.Shopping, "Animais", "emoji_1f436", 12),
        (ListType.Shopping, "Cozinha", "emoji_1f37d_fe0f", 13),

        // Tasks
        (ListType.Tasks, "Cozinha", "emoji_1f468_200d_1f373", 0),
        (ListType.Tasks, "Quarto", "emoji_1f6cf_fe0f", 1),
        (ListType.Tasks, "Sala", "emoji_1f6cb_fe0f", 2),
        (ListType.Tasks, "Escritório", "emoji_1f469_200d_1f4bb", 3),
        (ListType.Tasks, "Roupa", "emoji_1f9fa", 4),
        (ListType.Tasks, "Lixo", "emoji_1f6ae", 5),
        (ListType.Tasks, "Casa de banho", "emoji_1f6c1", 6),
        (ListType.Tasks, "Corredor", "emoji_1f6aa", 7),
    ];

    private readonly IAppDbContext _db;
    private readonly IRealtimeNotifier _rt;

    /// <summary>
    /// Inicializa uma nova instância de <see cref="CategoryService"/>.
    /// </summary>
    /// <param name="db">Contexto de base de dados.</param>
    /// <param name="rt">Notificador em tempo real.</param>
    public CategoryService(IAppDbContext db, IRealtimeNotifier rt)
    {
        _db = db;
        _rt = rt;
    }

// ---------------- ITEM CATEGORIES ----------------

    /// <inheritdoc />
    public async Task<IReadOnlyList<CategoryModel>> GetItemCategoriesAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        await EnsureDefaultItemCategoriesAsync(familyId, ct);

        return await _db.ItemCategories
            .AsNoTracking()
            .Where(c => c.FamilyId == familyId)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryModel(c.Id, c.Name, c.Type, c.IconKey, "", c.SortOrder))
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<CategoryModel> CreateItemCategoryAsync(Guid userId, Guid familyId, string name, ListType type, string iconKey, int sortOrder, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var data = NormalizeAndValidate(name, iconKey);

        var entity = new ItemCategory
        {
            FamilyId = familyId,
            Name = data.Name,
            Type = type,
            IconKey = data.IconKey,
            SortOrder = sortOrder
        };

        _db.ItemCategories.Add(entity);

        await SaveOrThrowFriendlyUniqueAsync("Já existe uma categoria de itens com esse nome.", ct);

        var model = ToModel(entity);

        await _rt.NotifyFamilyAsync(familyId, "itemcategories:changed", new
        {
            action = "created",
            category = new
            {
                id = model.Id,
                name = model.Name,
                type = model.Type.ToString(),
                iconKey = model.IconKey,
                sortOrder = model.SortOrder
            }
        }, ct);

        return model;
    }

    /// <inheritdoc />
    public async Task<CategoryModel> UpdateItemCategoryAsync(Guid userId, Guid familyId, Guid categoryId, string? name, ListType? type, string? iconKey, int? sortOrder, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var entity = await _db.ItemCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.FamilyId == familyId, ct);
        if (entity is null) throw new KeyNotFoundException("Categoria não encontrada.");

        if (name is not null) entity.Name = NormalizeName(name);
        if (type.HasValue) entity.Type = type.Value;
        if (iconKey is not null) entity.IconKey = NormalizeIconKey(iconKey);
        if (sortOrder.HasValue) entity.SortOrder = sortOrder.Value;

        ValidateEntity(entity);

        await SaveOrThrowFriendlyUniqueAsync("Já existe uma categoria de itens com esse nome.", ct);

        var model = ToModel(entity);

        await _rt.NotifyFamilyAsync(familyId, "itemcategories:changed", new
        {
            action = "updated",
            category = new
            {
                id = model.Id,
                name = model.Name,
                type = model.Type.ToString(),
                iconKey = model.IconKey,
                sortOrder = model.SortOrder
            }
        }, ct);

        return model;
    }

    /// <inheritdoc />
    public async Task DeleteItemCategoryAsync(Guid userId, Guid familyId, Guid categoryId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var isUsed = await _db.ListItems.AsNoTracking()
            .AnyAsync(i => i.SharedList.FamilyId == familyId && i.CategoryId == categoryId, ct);

        if (isUsed)
            throw new InvalidOperationException("Não podes apagar: esta categoria está em uso por itens.");

        var entity = await _db.ItemCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.FamilyId == familyId, ct);
        if (entity is null) throw new KeyNotFoundException("Categoria não encontrada.");

        _db.ItemCategories.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "itemcategories:changed", new
        {
            action = "deleted",
            categoryId
        }, ct);
    }

    // ---------------- Helpers ----------------
    private static CategoryModel ToModel(ItemCategory c) => new(c.Id, c.Name, c.Type, c.IconKey, "", c.SortOrder);

    private sealed record Normalized(string Name, string IconKey);

    private static Normalized NormalizeAndValidate(string name, string iconKey)
    {
        var n = NormalizeName(name);
        var i = NormalizeIconKey(iconKey);

        // validações finais
        if (string.IsNullOrWhiteSpace(n)) throw new ArgumentException("Nome é obrigatório.");
        if (!IconKeyRegex.IsMatch(i)) throw new ArgumentException("IconKey inválido. Use letras/números/-, _ (até 40).");
        
        return new Normalized(n, i);
    }

    private static string NormalizeName(string name) => name.Trim();
    private static string NormalizeIconKey(string iconKey) => iconKey.Trim().ToLowerInvariant();

    // permite remover cor: envia "" e vira null
    private static string? NormalizeColorHexAllowNull(string? colorHex)
    {
        if (colorHex is null) return null;
        var t = colorHex.Trim();
        return string.IsNullOrWhiteSpace(t) ? null : t;
    }

    private static void ValidateEntity(ListCategory entity)
    {
        if (string.IsNullOrWhiteSpace(entity.Name)) throw new ArgumentException("Nome é obrigatório.");
        if (!IconKeyRegex.IsMatch(entity.IconKey)) throw new ArgumentException("IconKey inválido.");
        if (entity.ColorHex is not null && !ColorHexRegex.IsMatch(entity.ColorHex)) throw new ArgumentException("ColorHex inválido.");
    }

    private static void ValidateEntity(ItemCategory entity)
    {
        if (string.IsNullOrWhiteSpace(entity.Name)) throw new ArgumentException("Nome é obrigatório.");
        if (!IconKeyRegex.IsMatch(entity.IconKey)) throw new ArgumentException("IconKey inválido.");
    }

    private async Task EnsureDefaultItemCategoriesAsync(Guid familyId, CancellationToken ct)
    {
        // Seed defaults for Shopping/Tasks only. Custom lists start empty by design.
        var hasShopping = await _db.ItemCategories
            .AsNoTracking()
            .AnyAsync(c => c.FamilyId == familyId && c.Type == ListType.Shopping, ct);

        var hasTasks = await _db.ItemCategories
            .AsNoTracking()
            .AnyAsync(c => c.FamilyId == familyId && c.Type == ListType.Tasks, ct);

        if (hasShopping && hasTasks) return;

        var toAdd = new List<ItemCategory>();

        foreach (var def in DefaultItemCategories)
        {
            if (def.Type == ListType.Shopping && hasShopping) continue;
            if (def.Type == ListType.Tasks && hasTasks) continue;

            toAdd.Add(new ItemCategory
            {
                FamilyId = familyId,
                Name = def.Name,
                Type = def.Type,
                IconKey = def.IconKey,
                SortOrder = def.SortOrder
            });
        }

        if (toAdd.Count == 0) return;

        _db.ItemCategories.AddRange(toAdd);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // If two requests race, the unique index will prevent duplicates.
        }
    }

    private async Task<FamilyRole> EnsureMemberAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        var role = await _db.FamilyMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.FamilyId == familyId)
            .Select(m => (FamilyRole?)m.Role)
            .FirstOrDefaultAsync(ct);

        if (role is null) throw new UnauthorizedAccessException("Não és membro desta família.");
        return role.Value;
    }

    private static void EnsureNotViewer(FamilyRole role)
    {
        if (role == FamilyRole.Viewer)
            throw new UnauthorizedAccessException("Sem permissões para editar.");
    }

    private async Task SaveOrThrowFriendlyUniqueAsync(string messageIfDuplicateName, CancellationToken ct)
    {
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // no teu DB tens índice unique (FamilyId, Name).
            // qualquer conflito cai aqui -> devolvemos mensagem humana
            throw new InvalidOperationException(messageIfDuplicateName);
        }
    }
}
