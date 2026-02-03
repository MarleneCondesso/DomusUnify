using System.Text.RegularExpressions;
using DomusUnify.Application.Categories.Models;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Common.Realtime;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Categories;

public sealed class CategoryService : ICategoryService
{
    private static readonly Regex IconKeyRegex = new("^[a-z0-9_-]{1,40}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex ColorHexRegex = new("^#[0-9a-fA-F]{6}$", RegexOptions.Compiled);

    private readonly IAppDbContext _db;
    private readonly IRealtimeNotifier _rt;

    public CategoryService(IAppDbContext db, IRealtimeNotifier rt)
    {
        _db = db;
        _rt = rt;
    }

    // ---------------- LIST CATEGORIES ----------------

    public async Task<IReadOnlyList<CategoryModel>> GetListCategoriesAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        return await _db.ListCategories
            .AsNoTracking()
            .Where(c => c.FamilyId == familyId)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryModel(c.Id, c.Name, c.IconKey, c.ColorHex, c.SortOrder))
            .ToListAsync(ct);
    }

    public async Task<CategoryModel> CreateListCategoryAsync(Guid userId, Guid familyId, string name, string iconKey, string? colorHex, int sortOrder, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var data = NormalizeAndValidate(name, iconKey, colorHex);

        var entity = new ListCategory
        {
            FamilyId = familyId,
            Name = data.Name,
            IconKey = data.IconKey,
            ColorHex = data.ColorHex,
            SortOrder = sortOrder
        };

        _db.ListCategories.Add(entity);

        await SaveOrThrowFriendlyUniqueAsync("Já existe uma categoria de listas com esse nome.", ct);

        var model = ToModel(entity);

        await _rt.NotifyFamilyAsync(familyId, "listcategories:changed", new
        {
            action = "created",
            category = new
            {
                id = model.Id,
                name = model.Name,
                iconKey = model.IconKey,
                colorHex = model.ColorHex,
                sortOrder = model.SortOrder
            }
        }, ct);

        return model;
    }

    public async Task<CategoryModel> UpdateListCategoryAsync(Guid userId, Guid familyId, Guid categoryId, string? name, string? iconKey, string? colorHex, int? sortOrder, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var entity = await _db.ListCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.FamilyId == familyId, ct);
        if (entity is null) throw new KeyNotFoundException("Categoria não encontrada.");

        // campos opcionais
        if (name is not null) entity.Name = NormalizeName(name);
        if (iconKey is not null) entity.IconKey = NormalizeIconKey(iconKey);
        if (colorHex is not null) entity.ColorHex = NormalizeColorHexAllowNull(colorHex);
        if (sortOrder.HasValue) entity.SortOrder = sortOrder.Value;

        ValidateEntity(entity);

        await SaveOrThrowFriendlyUniqueAsync("Já existe uma categoria de listas com esse nome.", ct);

        var model = ToModel(entity);

        await _rt.NotifyFamilyAsync(familyId, "listcategories:changed", new
        {
            action = "updated",
            category = new
            {
                id = model.Id,
                name = model.Name,
                iconKey = model.IconKey,
                colorHex = model.ColorHex,
                sortOrder = model.SortOrder
            }
        }, ct);

        return model;
    }

    public async Task DeleteListCategoryAsync(Guid userId, Guid familyId, Guid categoryId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        // regra pro: não apagar se estiver em uso
        var isUsed = await _db.Lists.AsNoTracking()
            .AnyAsync(l => l.FamilyId == familyId && l.CategoryId == categoryId, ct);

        if (isUsed)
            throw new InvalidOperationException("Não podes apagar: esta categoria está em uso por listas.");

        var entity = await _db.ListCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.FamilyId == familyId, ct);
        if (entity is null) throw new KeyNotFoundException("Categoria não encontrada.");

        _db.ListCategories.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "listcategories:changed", new
        {
            action = "deleted",
            categoryId
        }, ct);
    }

    // ---------------- ITEM CATEGORIES ----------------

    public async Task<IReadOnlyList<CategoryModel>> GetItemCategoriesAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        return await _db.ItemCategories
            .AsNoTracking()
            .Where(c => c.FamilyId == familyId)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryModel(c.Id, c.Name, c.IconKey, c.ColorHex, c.SortOrder))
            .ToListAsync(ct);
    }

    public async Task<CategoryModel> CreateItemCategoryAsync(Guid userId, Guid familyId, string name, string iconKey, string? colorHex, int sortOrder, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var data = NormalizeAndValidate(name, iconKey, colorHex);

        var entity = new ItemCategory
        {
            FamilyId = familyId,
            Name = data.Name,
            IconKey = data.IconKey,
            ColorHex = data.ColorHex,
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
                iconKey = model.IconKey,
                colorHex = model.ColorHex,
                sortOrder = model.SortOrder
            }
        }, ct);

        return model;
    }

    public async Task<CategoryModel> UpdateItemCategoryAsync(Guid userId, Guid familyId, Guid categoryId, string? name, string? iconKey, string? colorHex, int? sortOrder, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var entity = await _db.ItemCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.FamilyId == familyId, ct);
        if (entity is null) throw new KeyNotFoundException("Categoria não encontrada.");

        if (name is not null) entity.Name = NormalizeName(name);
        if (iconKey is not null) entity.IconKey = NormalizeIconKey(iconKey);
        if (colorHex is not null) entity.ColorHex = NormalizeColorHexAllowNull(colorHex);
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
                iconKey = model.IconKey,
                colorHex = model.ColorHex,
                sortOrder = model.SortOrder
            }
        }, ct);

        return model;
    }

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

    private static CategoryModel ToModel(ListCategory c) => new(c.Id, c.Name, c.IconKey, c.ColorHex, c.SortOrder);
    private static CategoryModel ToModel(ItemCategory c) => new(c.Id, c.Name, c.IconKey, c.ColorHex, c.SortOrder);

    private sealed record Normalized(string Name, string IconKey, string? ColorHex);

    private static Normalized NormalizeAndValidate(string name, string iconKey, string? colorHex)
    {
        var n = NormalizeName(name);
        var i = NormalizeIconKey(iconKey);
        var c = NormalizeColorHexAllowNull(colorHex);

        // validações finais
        if (string.IsNullOrWhiteSpace(n)) throw new ArgumentException("Nome é obrigatório.");
        if (!IconKeyRegex.IsMatch(i)) throw new ArgumentException("IconKey inválido. Use letras/números/-, _ (até 40).");
        if (c is not null && !ColorHexRegex.IsMatch(c)) throw new ArgumentException("ColorHex inválido. Ex: #FFAA00");

        return new Normalized(n, i, c);
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
        if (entity.ColorHex is not null && !ColorHexRegex.IsMatch(entity.ColorHex)) throw new ArgumentException("ColorHex inválido.");
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
