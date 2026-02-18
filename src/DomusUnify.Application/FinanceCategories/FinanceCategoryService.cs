using System.Text.RegularExpressions;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Common.Realtime;
using DomusUnify.Application.FinanceCategories.Models;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.FinanceCategories;

/// <summary>
/// Implementação do serviço de categorias financeiras.
/// </summary>
public sealed class FinanceCategoryService : IFinanceCategoryService
{
    private static readonly Regex IconKeyRegex = new("^[a-z0-9_-]{1,40}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly IAppDbContext _db;
    private readonly IRealtimeNotifier _rt;

    public FinanceCategoryService(IAppDbContext db, IRealtimeNotifier rt)
    {
        _db = db;
        _rt = rt;
    }

    /// <inheritdoc />
    public async Task EnsureDefaultsAsync(Guid familyId, CancellationToken ct)
    {
        var any = await _db.FinanceCategories.AsNoTracking().AnyAsync(c => c.FamilyId == familyId, ct);
        if (any) return;

        var defaults = GetDefaults(familyId);
        _db.FinanceCategories.AddRange(defaults);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // já existem (concorrência). ignora.
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<FinanceCategoryModel>> GetAsync(
        Guid userId,
        Guid familyId,
        string? type,
        CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);
        await EnsureDefaultsAsync(familyId, ct);

        FinanceCategoryType? filter = null;
        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!Enum.TryParse<FinanceCategoryType>(type, true, out var parsed))
                throw new ArgumentException("Tipo inválido. Use: Expense, Income.");
            filter = parsed;
        }

        var q = _db.FinanceCategories.AsNoTracking().Where(c => c.FamilyId == familyId);
        if (filter.HasValue) q = q.Where(c => c.Type == filter.Value);

        return await q
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new FinanceCategoryModel(c.Id, c.Type.ToString(), c.Name, c.IconKey, c.SortOrder))
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<FinanceCategoryModel> CreateAsync(
        Guid userId,
        Guid familyId,
        string type,
        string name,
        string iconKey,
        int sortOrder,
        CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        if (!Enum.TryParse<FinanceCategoryType>(type, true, out var parsedType))
            throw new ArgumentException("Tipo inválido. Use: Expense, Income.");

        var normalizedName = NormalizeName(name);
        var normalizedIconKey = NormalizeIconKey(iconKey);
        Validate(normalizedName, normalizedIconKey);

        var entity = new FinanceCategory
        {
            FamilyId = familyId,
            Type = parsedType,
            Name = normalizedName,
            IconKey = normalizedIconKey,
            SortOrder = sortOrder
        };

        _db.FinanceCategories.Add(entity);
        await SaveOrThrowFriendlyUniqueAsync("Já existe uma categoria com esse nome.", ct);

        var model = new FinanceCategoryModel(entity.Id, entity.Type.ToString(), entity.Name, entity.IconKey, entity.SortOrder);

        await _rt.NotifyFamilyAsync(familyId, "financecategories:changed", new
        {
            action = "created",
            category = new
            {
                id = model.Id,
                type = model.Type,
                name = model.Name,
                iconKey = model.IconKey,
                sortOrder = model.SortOrder
            }
        }, ct);

        return model;
    }

    /// <inheritdoc />
    public async Task<FinanceCategoryModel> UpdateAsync(
        Guid userId,
        Guid familyId,
        Guid categoryId,
        string? name,
        string? iconKey,
        int? sortOrder,
        CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var entity = await _db.FinanceCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.FamilyId == familyId, ct);
        if (entity is null) throw new KeyNotFoundException("Categoria não encontrada.");

        if (name is not null) entity.Name = NormalizeName(name);
        if (iconKey is not null) entity.IconKey = NormalizeIconKey(iconKey);
        if (sortOrder.HasValue) entity.SortOrder = sortOrder.Value;

        Validate(entity.Name, entity.IconKey);

        await SaveOrThrowFriendlyUniqueAsync("Já existe uma categoria com esse nome.", ct);

        var model = new FinanceCategoryModel(entity.Id, entity.Type.ToString(), entity.Name, entity.IconKey, entity.SortOrder);

        await _rt.NotifyFamilyAsync(familyId, "financecategories:changed", new
        {
            action = "updated",
            category = new
            {
                id = model.Id,
                type = model.Type,
                name = model.Name,
                iconKey = model.IconKey,
                sortOrder = model.SortOrder
            }
        }, ct);

        return model;
    }

    /// <inheritdoc />
    public async Task DeleteAsync(Guid userId, Guid familyId, Guid categoryId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var isUsed = await _db.FinanceTransactions.AsNoTracking()
            .AnyAsync(t => t.CategoryId == categoryId && t.Budget.FamilyId == familyId, ct);

        if (isUsed)
            throw new InvalidOperationException("Não podes apagar: esta categoria está em uso por transações.");

        var isLimited = await _db.BudgetCategoryLimits.AsNoTracking()
            .AnyAsync(l => l.CategoryId == categoryId && l.Budget.FamilyId == familyId, ct);

        if (isLimited)
            throw new InvalidOperationException("Não podes apagar: esta categoria está em uso em limites de orçamento.");

        var entity = await _db.FinanceCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.FamilyId == familyId, ct);
        if (entity is null) throw new KeyNotFoundException("Categoria não encontrada.");

        _db.FinanceCategories.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "financecategories:changed", new
        {
            action = "deleted",
            categoryId
        }, ct);
    }

    private static IReadOnlyList<FinanceCategory> GetDefaults(Guid familyId)
    {
        // SortOrder: mantém a ordem apresentada no pedido.
        var expense = new[]
        {
            ("Diversos", "dots-horizontal"),
            ("Mercearias", "shopping-cart"),
            ("Carro", "car"),
            ("TV+NET", "wifi"),
            ("Assinaturas", "repeat"),
            ("Restaurantes e cafés", "utensils"),
            ("Entretenimento", "ticket"),
            ("Habitação", "home"),
            ("Empréstimo", "receipt"),
            ("Seguros", "shield"),
            ("Presentes", "gift"),
            ("Cuidados Pessoais e Beleza", "sparkles"),
            ("Roupa", "shirt"),
            ("Eletricidade", "zap"),
            ("Animais de estimação", "paw-print"),
            ("Poupança", "piggy-bank"),
            ("Transporte", "bus"),
            ("Educação", "graduation-cap"),
            ("Médico", "stethoscope"),
            ("Impostos", "file-text"),
            ("Viagem", "plane"),
            ("Férias", "sun"),
            ("Retirada de dinheiro", "banknote"),
            ("Empregada", "user"),
            ("Água", "droplets"),
            ("Tech", "laptop")
        };

        var income = new[]
        {
            ("Salário", "briefcase"),
            ("Diversos", "dots-horizontal"),
            ("Renda", "home"),
            ("Poupança", "piggy-bank"),
            ("Investimentos", "trending-up"),
            ("Presentes e doações", "gift"),
            ("Reembolso", "rotate-ccw")
        };

        var list = new List<FinanceCategory>(expense.Length + income.Length);
        var sort = 0;
        foreach (var (name, icon) in expense)
        {
            list.Add(new FinanceCategory
            {
                FamilyId = familyId,
                Type = FinanceCategoryType.Expense,
                Name = name,
                IconKey = icon,
                SortOrder = sort++
            });
        }

        sort = 0;
        foreach (var (name, icon) in income)
        {
            list.Add(new FinanceCategory
            {
                FamilyId = familyId,
                Type = FinanceCategoryType.Income,
                Name = name,
                IconKey = icon,
                SortOrder = sort++
            });
        }

        return list;
    }

    private static string NormalizeName(string name) => name.Trim();
    private static string NormalizeIconKey(string iconKey) => iconKey.Trim().ToLowerInvariant();

    private static void Validate(string name, string iconKey)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Nome é obrigatório.");
        if (!IconKeyRegex.IsMatch(iconKey)) throw new ArgumentException("IconKey inválido. Use letras/números/-, _ (até 40).");
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
            throw new InvalidOperationException(messageIfDuplicateName);
        }
    }
}
