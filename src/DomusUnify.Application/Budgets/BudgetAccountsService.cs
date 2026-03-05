using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.FinanceAccounts;
using DomusUnify.Application.FinanceAccounts.Models;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Budgets;

/// <summary>
/// Implementação do serviço de visibilidade de contas financeiras por orçamento.
/// </summary>
public sealed class BudgetAccountsService : IBudgetAccountsService
{
    private readonly IAppDbContext _db;
    private readonly IFinanceAccountService _accounts;

    /// <summary>
    /// Inicializa uma nova instância de <see cref="BudgetAccountsService"/>.
    /// </summary>
    public BudgetAccountsService(IAppDbContext db, IFinanceAccountService accounts)
    {
        _db = db;
        _accounts = accounts;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<FinanceAccountModel>> GetVisibleAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);
        await EnsureBudgetAccessAsync(userId, familyId, budgetId, ct);
        await _accounts.EnsureDefaultsAsync(familyId, ct);

        var hiddenIds = _db.BudgetHiddenFinanceAccounts
            .AsNoTracking()
            .Where(h => h.BudgetId == budgetId)
            .Select(h => h.AccountId);

        return await _db.FinanceAccounts
            .AsNoTracking()
            .Where(a => a.FamilyId == familyId)
            .Where(a => !hiddenIds.Contains(a.Id))
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Name)
            .Select(a => new FinanceAccountModel(a.Id, a.Type.ToString(), a.Name, a.IconKey, a.SortOrder))
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<FinanceAccountModel>> GetHiddenAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);
        await EnsureBudgetAccessAsync(userId, familyId, budgetId, ct);
        await _accounts.EnsureDefaultsAsync(familyId, ct);

        return await _db.BudgetHiddenFinanceAccounts
            .AsNoTracking()
            .Where(h => h.BudgetId == budgetId)
            .Join(
                _db.FinanceAccounts.AsNoTracking().Where(a => a.FamilyId == familyId),
                h => h.AccountId,
                a => a.Id,
                (_, a) => a)
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Name)
            .Select(a => new FinanceAccountModel(a.Id, a.Type.ToString(), a.Name, a.IconKey, a.SortOrder))
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task HideAsync(Guid userId, Guid familyId, Guid budgetId, Guid accountId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        await EnsureBudgetAccessAsync(userId, familyId, budgetId, ct);
        await _accounts.EnsureDefaultsAsync(familyId, ct);

        var accountExists = await _db.FinanceAccounts
            .AsNoTracking()
            .AnyAsync(a => a.Id == accountId && a.FamilyId == familyId, ct);
        if (!accountExists) throw new KeyNotFoundException("Conta não encontrada.");

        var alreadyHidden = await _db.BudgetHiddenFinanceAccounts
            .AsNoTracking()
            .AnyAsync(h => h.BudgetId == budgetId && h.AccountId == accountId, ct);
        if (alreadyHidden) return;

        var visibleCount = await _db.FinanceAccounts
            .AsNoTracking()
            .Where(a => a.FamilyId == familyId)
            .CountAsync(a => !_db.BudgetHiddenFinanceAccounts.Any(h => h.BudgetId == budgetId && h.AccountId == a.Id), ct);

        if (visibleCount <= 1)
            throw new InvalidOperationException("Tens de manter pelo menos 1 conta visível no orçamento.");

        _db.BudgetHiddenFinanceAccounts.Add(new BudgetHiddenFinanceAccount
        {
            Id = Guid.NewGuid(),
            BudgetId = budgetId,
            AccountId = accountId,
            CreatedAtUtc = DateTime.UtcNow
        });

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // concorrência / duplicado (idempotência). ignora.
        }
    }

    /// <inheritdoc />
    public async Task UnhideAsync(Guid userId, Guid familyId, Guid budgetId, Guid accountId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        await EnsureBudgetAccessAsync(userId, familyId, budgetId, ct);
        await _accounts.EnsureDefaultsAsync(familyId, ct);

        var entity = await _db.BudgetHiddenFinanceAccounts
            .FirstOrDefaultAsync(h => h.BudgetId == budgetId && h.AccountId == accountId, ct);

        if (entity is null) return;

        _db.BudgetHiddenFinanceAccounts.Remove(entity);
        await _db.SaveChangesAsync(ct);
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

    private async Task EnsureBudgetAccessAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct)
    {
        var budget = await _db.Budgets
            .AsNoTracking()
            .Include(b => b.AllowedUsers)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.FamilyId == familyId, ct);

        if (budget is null) throw new KeyNotFoundException("Orçamento não encontrado.");

        var hasAccess =
            budget.VisibilityMode == BudgetVisibilityMode.AllMembers ||
            budget.OwnerUserId == userId ||
            (budget.VisibilityMode == BudgetVisibilityMode.SpecificMembers && budget.AllowedUsers.Any(a => a.UserId == userId));

        if (!hasAccess) throw new UnauthorizedAccessException("Sem permissões para aceder a este orçamento.");
    }

    private static void EnsureNotViewer(FamilyRole role)
    {
        if (role == FamilyRole.Viewer)
            throw new UnauthorizedAccessException("Sem permissões para editar.");
    }
}
