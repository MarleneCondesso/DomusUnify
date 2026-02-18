using System.Text.RegularExpressions;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Common.Realtime;
using DomusUnify.Application.FinanceAccounts.Models;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.FinanceAccounts;

/// <summary>
/// Implementação do serviço de contas financeiras.
/// </summary>
public sealed class FinanceAccountService : IFinanceAccountService
{
    private static readonly Regex IconKeyRegex = new("^[a-z0-9_-]{1,40}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly IAppDbContext _db;
    private readonly IRealtimeNotifier _rt;

    /// <summary>
    /// Inicializa uma nova instância de <see cref="FinanceAccountService"/>.
    /// </summary>
    /// <param name="db">Contexto de base de dados.</param>
    /// <param name="rt">Notificador em tempo real.</param>
    public FinanceAccountService(IAppDbContext db, IRealtimeNotifier rt)
    {
        _db = db;
        _rt = rt;
    }

    /// <inheritdoc />
    public async Task EnsureDefaultsAsync(Guid familyId, CancellationToken ct)
    {
        var any = await _db.FinanceAccounts.AsNoTracking().AnyAsync(a => a.FamilyId == familyId, ct);
        if (any) return;

        var defaults = GetDefaults(familyId);
        _db.FinanceAccounts.AddRange(defaults);

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
    public async Task<IReadOnlyList<FinanceAccountModel>> GetAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);
        await EnsureDefaultsAsync(familyId, ct);

        return await _db.FinanceAccounts
            .AsNoTracking()
            .Where(a => a.FamilyId == familyId)
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Name)
            .Select(a => new FinanceAccountModel(a.Id, a.Type.ToString(), a.Name, a.IconKey, a.SortOrder))
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<FinanceAccountModel> CreateAsync(
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

        if (!Enum.TryParse<FinanceAccountType>(type, true, out var parsedType))
            throw new ArgumentException("Tipo inválido. Use: Checking, Cash, CreditCard, Savings, Credit, Joint.");

        var normalizedName = NormalizeName(name);
        var normalizedIconKey = NormalizeIconKey(iconKey);
        Validate(normalizedName, normalizedIconKey);

        var entity = new FinanceAccount
        {
            FamilyId = familyId,
            Type = parsedType,
            Name = normalizedName,
            IconKey = normalizedIconKey,
            SortOrder = sortOrder
        };

        _db.FinanceAccounts.Add(entity);
        await SaveOrThrowFriendlyUniqueAsync("Já existe uma conta com esse nome.", ct);

        var model = new FinanceAccountModel(entity.Id, entity.Type.ToString(), entity.Name, entity.IconKey, entity.SortOrder);

        await _rt.NotifyFamilyAsync(familyId, "financeaccounts:changed", new
        {
            action = "created",
            account = new
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
    public async Task<FinanceAccountModel> UpdateAsync(
        Guid userId,
        Guid familyId,
        Guid accountId,
        string? name,
        string? iconKey,
        int? sortOrder,
        CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var entity = await _db.FinanceAccounts.FirstOrDefaultAsync(a => a.Id == accountId && a.FamilyId == familyId, ct);
        if (entity is null) throw new KeyNotFoundException("Conta não encontrada.");

        if (name is not null) entity.Name = NormalizeName(name);
        if (iconKey is not null) entity.IconKey = NormalizeIconKey(iconKey);
        if (sortOrder.HasValue) entity.SortOrder = sortOrder.Value;

        Validate(entity.Name, entity.IconKey);

        await SaveOrThrowFriendlyUniqueAsync("Já existe uma conta com esse nome.", ct);

        var model = new FinanceAccountModel(entity.Id, entity.Type.ToString(), entity.Name, entity.IconKey, entity.SortOrder);

        await _rt.NotifyFamilyAsync(familyId, "financeaccounts:changed", new
        {
            action = "updated",
            account = new
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
    public async Task DeleteAsync(Guid userId, Guid familyId, Guid accountId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var isUsed = await _db.FinanceTransactions.AsNoTracking()
            .AnyAsync(t => t.AccountId == accountId && t.Budget.FamilyId == familyId, ct);

        if (isUsed)
            throw new InvalidOperationException("Não podes apagar: esta conta está em uso por transações.");

        var entity = await _db.FinanceAccounts.FirstOrDefaultAsync(a => a.Id == accountId && a.FamilyId == familyId, ct);
        if (entity is null) throw new KeyNotFoundException("Conta não encontrada.");

        _db.FinanceAccounts.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "financeaccounts:changed", new
        {
            action = "deleted",
            accountId
        }, ct);
    }

    private static IReadOnlyList<FinanceAccount> GetDefaults(Guid familyId)
    {
        var accounts = new[]
        {
            (FinanceAccountType.Checking, "Conta corrente", "landmark"),
            (FinanceAccountType.Cash, "Dinheiro", "banknote"),
            (FinanceAccountType.CreditCard, "Cartão de crédito", "credit-card"),
            (FinanceAccountType.Savings, "Conta poupança", "piggy-bank"),
            (FinanceAccountType.Credit, "Conta de crédito", "receipt"),
            (FinanceAccountType.Joint, "Conta conjunta", "users")
        };

        var list = new List<FinanceAccount>(accounts.Length);
        for (var i = 0; i < accounts.Length; i++)
        {
            var (type, name, icon) = accounts[i];
            list.Add(new FinanceAccount
            {
                FamilyId = familyId,
                Type = type,
                Name = name,
                IconKey = icon,
                SortOrder = i
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
