using System.Text.RegularExpressions;
using DomusUnify.Application.Activity;
using DomusUnify.Application.Activity.Models;
using DomusUnify.Application.Budgets.Models;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Common.Realtime;
using DomusUnify.Application.FinanceAccounts;
using DomusUnify.Application.FinanceCategories;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Budgets;

/// <summary>
/// Implementação do serviço de orçamentos.
/// </summary>
public sealed class BudgetService : IBudgetService
{
    private static readonly Regex IconKeyRegex = new("^[a-z0-9_-]{1,40}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex CurrencyCodeRegex = new("^[A-Z]{3}$", RegexOptions.Compiled);

    private readonly IAppDbContext _db;
    private readonly IRealtimeNotifier _rt;
    private readonly IFinanceCategoryService _cats;
    private readonly IFinanceAccountService _accounts;
    private readonly IActivityService _activity;

    /// <summary>
    /// Inicializa uma nova instância de <see cref="BudgetService"/>.
    /// </summary>
    /// <param name="db">Contexto de base de dados.</param>
    /// <param name="rt">Notificador em tempo real.</param>
    /// <param name="cats">Serviço de categorias financeiras.</param>
    /// <param name="accounts">Serviço de contas financeiras.</param>
    /// <param name="activity">Serviço de feed de atividade.</param>
    public BudgetService(IAppDbContext db, IRealtimeNotifier rt, IFinanceCategoryService cats, IFinanceAccountService accounts, IActivityService activity)
    {
        _db = db;
        _rt = rt;
        _cats = cats;
        _accounts = accounts;
        _activity = activity;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<BudgetSummaryModel>> GetAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        return await _db.Budgets
            .AsNoTracking()
            .Where(b => b.FamilyId == familyId)
            .Where(b =>
                b.VisibilityMode == BudgetVisibilityMode.AllMembers ||
                b.OwnerUserId == userId ||
                (b.VisibilityMode == BudgetVisibilityMode.SpecificMembers && b.AllowedUsers.Any(a => a.UserId == userId)))
            .OrderBy(b => b.Name)
            .Select(b => new BudgetSummaryModel(
                b.Id,
                b.Name,
                b.IconKey,
                b.Type.ToString(),
                b.CurrencyCode,
                b.VisibilityMode.ToString()))
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<BudgetDetailModel> GetByIdAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        var budget = await _db.Budgets
            .AsNoTracking()
            .Include(b => b.AllowedUsers)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.FamilyId == familyId, ct);

        if (budget is null) throw new KeyNotFoundException("Orçamento não encontrado.");
        EnsureBudgetAccess(userId, budget);

        return ToDetailModel(budget);
    }

    /// <inheritdoc />
    public async Task<BudgetDetailModel> CreateAsync(Guid userId, Guid familyId, BudgetCreateInput input, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var now = DateTime.UtcNow;

        var name = NormalizeName(input.Name);
        var iconKey = NormalizeIconKey(input.IconKey);
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Nome é obrigatório.");
        if (!IconKeyRegex.IsMatch(iconKey)) throw new ArgumentException("IconKey inválido. Use letras/números/-, _ (até 40).");

        if (!Enum.TryParse<BudgetType>(input.Type, true, out var budgetType))
            throw new ArgumentException("Tipo inválido. Use: Recurring, OneTime.");

        if (!Enum.TryParse<BudgetVisibilityMode>(input.VisibilityMode, true, out var visibilityMode))
            throw new ArgumentException("Visibilidade inválida. Use: Private, AllMembers, SpecificMembers.");

        var currency = NormalizeCurrency(input.CurrencyCode);
        if (!CurrencyCodeRegex.IsMatch(currency))
            throw new ArgumentException("Moeda inválida. Use código ISO-4217 (ex: EUR, USD).");

        if (input.SpendingLimit.HasValue && input.SpendingLimit.Value < 0)
            throw new ArgumentException("Limite de gastos inválido.");

        // defaults: categorias + contas
        await _cats.EnsureDefaultsAsync(familyId, ct);
        await _accounts.EnsureDefaultsAsync(familyId, ct);

        BudgetPeriodType? periodType = null;
        BudgetSemiMonthlyPattern? semiMonthlyPattern = null;
        DateOnly? startDate = input.StartDate;
        DateOnly? endDate = input.EndDate;

        if (budgetType == BudgetType.Recurring)
        {
            if (string.IsNullOrWhiteSpace(input.PeriodType))
                throw new ArgumentException("Período é obrigatório para orçamentos recorrentes.");

            if (!Enum.TryParse<BudgetPeriodType>(input.PeriodType, true, out var parsedPeriod))
                throw new ArgumentException("Período inválido. Use: Monthly, Weekly, BiWeekly, SemiMonthly, Yearly.");

            periodType = parsedPeriod;

            if (!startDate.HasValue)
                throw new ArgumentException("Data de início é obrigatória para orçamentos recorrentes.");

            if (periodType == BudgetPeriodType.SemiMonthly)
            {
                if (string.IsNullOrWhiteSpace(input.SemiMonthlyPattern))
                    throw new ArgumentException("SemiMonthlyPattern é obrigatório quando o período é SemiMonthly.");

                if (!Enum.TryParse<BudgetSemiMonthlyPattern>(input.SemiMonthlyPattern, true, out var parsedPattern))
                    throw new ArgumentException("SemiMonthlyPattern inválido. Use: FirstAndFifteenth, FifteenthAndLastDay.");

                semiMonthlyPattern = parsedPattern;
            }
        }
        else
        {
            // Único: default começa hoje (UTC -> DateOnly)
            startDate ??= DateOnly.FromDateTime(now);
        }

        var budget = new Budget
        {
            FamilyId = familyId,
            OwnerUserId = userId,
            Name = name,
            IconKey = iconKey,
            Type = budgetType,
            PeriodType = periodType,
            StartDate = startDate,
            EndDate = endDate,
            SemiMonthlyPattern = semiMonthlyPattern,
            SpendingLimit = input.SpendingLimit,
            CurrencyCode = currency,
            VisibilityMode = visibilityMode,
            MainIndicator = input.MainIndicator ?? BudgetMainIndicator.Balance,
            OnlyPaidInTotals = input.OnlyPaidInTotals ?? false,
            TransactionOrder = input.TransactionOrder ?? BudgetTransactionOrder.MostRecentFirst,
            UpcomingDisplayMode = input.UpcomingDisplayMode ?? BudgetUpcomingDisplayMode.Expanded,
            CreatedAtUtc = now
        };

        // Specific members
        if (visibilityMode == BudgetVisibilityMode.SpecificMembers)
        {
            var allowed = (input.AllowedUserIds ?? Array.Empty<Guid>()).Distinct().ToList();
            if (allowed.Count == 0)
                throw new ArgumentException("Escolhe pelo menos 1 membro para a visibilidade SpecificMembers.");

            if (!allowed.Contains(userId))
                allowed.Add(userId);

            await EnsureAllUsersAreFamilyMembersAsync(familyId, allowed, ct);

            foreach (var uid in allowed)
            {
                budget.AllowedUsers.Add(new BudgetUserAccess
                {
                    Id = Guid.NewGuid(),
                    BudgetId = budget.Id,
                    UserId = uid,
                    CreatedAtUtc = now
                });
            }
        }

        _db.Budgets.Add(budget);

        // Preferências do owner
        _db.BudgetUserSettings.Add(new BudgetUserSettings
        {
            BudgetId = budget.Id,
            UserId = userId,
            DailyReminderEnabled = false,
            DailyReminderTime = new TimeOnly(21, 0)
        });

        // Limites por categoria (0 por defeito)
        var expenseCategoryIds = await _db.FinanceCategories
            .AsNoTracking()
            .Where(c => c.FamilyId == familyId && c.Type == FinanceCategoryType.Expense)
            .OrderBy(c => c.SortOrder)
            .Select(c => c.Id)
            .ToListAsync(ct);

        var inputLimits = (input.CategoryLimits ?? Array.Empty<BudgetCategoryLimitInput>())
            .GroupBy(x => x.CategoryId)
            .ToDictionary(g => g.Key, g => g.Last().Amount);

        foreach (var catId in expenseCategoryIds)
        {
            var amount = inputLimits.TryGetValue(catId, out var v) ? v : 0m;
            if (amount < 0) throw new ArgumentException("Limite por categoria inválido.");

            _db.BudgetCategoryLimits.Add(new BudgetCategoryLimit
            {
                BudgetId = budget.Id,
                CategoryId = catId,
                Amount = amount
            });
        }

        await SaveOrThrowFriendlyUniqueAsync("Já existe um orçamento com esse nome.", ct);

        var model = ToDetailModel(budget);

        await _rt.NotifyFamilyAsync(familyId, "budgets:changed", new
        {
            action = "created",
            budget = new
            {
                id = model.Id,
                name = model.Name,
                iconKey = model.IconKey,
                type = model.Type,
                currencyCode = model.CurrencyCode,
                visibilityMode = model.VisibilityMode
            }
        }, ct);

        await _activity.LogAsync(
            familyId,
            userId,
            new ActivityLogInput(
                Kind: "budgets:created",
                Message: $"created budget: {model.Name}",
                EntityId: model.Id),
            ct);

        return model;
    }

    /// <inheritdoc />
    public async Task<BudgetDetailModel> UpdateAsync(Guid userId, Guid familyId, Guid budgetId, BudgetUpdateInput input, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var now = DateTime.UtcNow;

        var budget = await _db.Budgets
            .Include(b => b.AllowedUsers)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.FamilyId == familyId, ct);

        if (budget is null) throw new KeyNotFoundException("Orçamento não encontrado.");
        EnsureBudgetAccess(userId, budget);

        if (input.Name is not null)
        {
            var trimmed = NormalizeName(input.Name);
            if (string.IsNullOrWhiteSpace(trimmed)) throw new ArgumentException("Nome inválido.");
            budget.Name = trimmed;
        }

        if (input.IconKey is not null)
        {
            var normalized = NormalizeIconKey(input.IconKey);
            if (!IconKeyRegex.IsMatch(normalized)) throw new ArgumentException("IconKey inválido.");
            budget.IconKey = normalized;
        }

        if (input.CurrencyCode is not null)
        {
            var currency = NormalizeCurrency(input.CurrencyCode);
            if (!CurrencyCodeRegex.IsMatch(currency)) throw new ArgumentException("Moeda inválida.");
            budget.CurrencyCode = currency;
        }

        if (input.MainIndicator.HasValue) budget.MainIndicator = input.MainIndicator.Value;
        if (input.OnlyPaidInTotals.HasValue) budget.OnlyPaidInTotals = input.OnlyPaidInTotals.Value;
        if (input.TransactionOrder.HasValue) budget.TransactionOrder = input.TransactionOrder.Value;
        if (input.UpcomingDisplayMode.HasValue) budget.UpcomingDisplayMode = input.UpcomingDisplayMode.Value;

        // Limite (permite remover)
        if (input.SpendingLimitChangeRequested)
        {
            if (input.SpendingLimit.HasValue && input.SpendingLimit.Value < 0)
                throw new ArgumentException("Limite de gastos inválido.");
            budget.SpendingLimit = input.SpendingLimit;
        }

        // Período (só para recorrente)
        if (budget.Type == BudgetType.Recurring)
        {
            if (input.PeriodType is not null)
            {
                if (!Enum.TryParse<BudgetPeriodType>(input.PeriodType, true, out var parsed))
                    throw new ArgumentException("Período inválido. Use: Monthly, Weekly, BiWeekly, SemiMonthly, Yearly.");
                budget.PeriodType = parsed;
            }

            if (input.StartDate.HasValue) budget.StartDate = input.StartDate.Value;

            if (budget.PeriodType == BudgetPeriodType.SemiMonthly)
            {
                if (input.SemiMonthlyPattern is not null)
                {
                    if (!Enum.TryParse<BudgetSemiMonthlyPattern>(input.SemiMonthlyPattern, true, out var parsedPattern))
                        throw new ArgumentException("SemiMonthlyPattern inválido. Use: FirstAndFifteenth, FifteenthAndLastDay.");
                    budget.SemiMonthlyPattern = parsedPattern;
                }

                if (budget.SemiMonthlyPattern is null)
                    throw new ArgumentException("SemiMonthlyPattern é obrigatório quando o período é SemiMonthly.");
            }
            else
            {
                budget.SemiMonthlyPattern = null;
            }

            if (!budget.StartDate.HasValue)
                throw new ArgumentException("Data de início é obrigatória para orçamentos recorrentes.");
        }
        else
        {
            if (input.StartDate.HasValue) budget.StartDate = input.StartDate.Value;
            if (input.EndDate.HasValue) budget.EndDate = input.EndDate.Value;
        }

        // Visibilidade
        if (input.VisibilityMode is not null)
        {
            if (!Enum.TryParse<BudgetVisibilityMode>(input.VisibilityMode, true, out var parsedMode))
                throw new ArgumentException("Visibilidade inválida. Use: Private, AllMembers, SpecificMembers.");

            if (parsedMode != budget.VisibilityMode)
            {
                budget.VisibilityMode = parsedMode;
                budget.AllowedUsers.Clear();
            }

            if (parsedMode == BudgetVisibilityMode.SpecificMembers)
            {
                var allowed = (input.AllowedUserIds ?? Array.Empty<Guid>()).Distinct().ToList();
                if (allowed.Count == 0)
                    throw new ArgumentException("Escolhe pelo menos 1 membro para a visibilidade SpecificMembers.");

                if (!allowed.Contains(budget.OwnerUserId))
                    allowed.Add(budget.OwnerUserId);

                await EnsureAllUsersAreFamilyMembersAsync(familyId, allowed, ct);

                budget.AllowedUsers.Clear();
                foreach (var uid in allowed)
                {
                    budget.AllowedUsers.Add(new BudgetUserAccess
                    {
                        Id = Guid.NewGuid(),
                        BudgetId = budget.Id,
                        UserId = uid,
                        CreatedAtUtc = now
                    });
                }
            }
        }
        else if (budget.VisibilityMode == BudgetVisibilityMode.SpecificMembers && input.AllowedUserIds is not null)
        {
            var allowed = input.AllowedUserIds.Distinct().ToList();
            if (allowed.Count == 0)
                throw new ArgumentException("Escolhe pelo menos 1 membro para a visibilidade SpecificMembers.");

            if (!allowed.Contains(budget.OwnerUserId))
                allowed.Add(budget.OwnerUserId);

            await EnsureAllUsersAreFamilyMembersAsync(familyId, allowed, ct);

            budget.AllowedUsers.Clear();
            foreach (var uid in allowed)
            {
                budget.AllowedUsers.Add(new BudgetUserAccess
                {
                    Id = Guid.NewGuid(),
                    BudgetId = budget.Id,
                    UserId = uid,
                    CreatedAtUtc = now
                });
            }
        }

        budget.UpdatedAtUtc = now;

        await SaveOrThrowFriendlyUniqueAsync("Já existe um orçamento com esse nome.", ct);

        var model = ToDetailModel(budget);

        await _rt.NotifyFamilyAsync(familyId, "budgets:changed", new
        {
            action = "updated",
            budget = new
            {
                id = model.Id,
                name = model.Name,
                iconKey = model.IconKey,
                type = model.Type,
                currencyCode = model.CurrencyCode,
                visibilityMode = model.VisibilityMode
            }
        }, ct);

        await _activity.LogAsync(
            familyId,
            userId,
            new ActivityLogInput(
                Kind: "budgets:updated",
                Message: $"updated budget: {model.Name}",
                EntityId: model.Id),
            ct);

        return model;
    }

    /// <inheritdoc />
    public async Task DeleteAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var budget = await _db.Budgets
            .Include(b => b.AllowedUsers)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.FamilyId == familyId, ct);
        if (budget is null) throw new KeyNotFoundException("Orçamento não encontrado.");
        EnsureBudgetAccess(userId, budget);

        var budgetName = budget.Name;

        _db.Budgets.Remove(budget);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "budgets:changed", new
        {
            action = "deleted",
            budgetId
        }, ct);

        await _activity.LogAsync(
            familyId,
            userId,
            new ActivityLogInput(
                Kind: "budgets:deleted",
                Message: $"deleted budget: {budgetName}",
                EntityId: budgetId),
            ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<BudgetMemberModel>> GetMembersAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        var budget = await _db.Budgets
            .AsNoTracking()
            .Include(b => b.AllowedUsers)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.FamilyId == familyId, ct);

        if (budget is null) throw new KeyNotFoundException("Orçamento não encontrado.");
        EnsureBudgetAccess(userId, budget);

        // Quem pode ver/editar
        IReadOnlyCollection<Guid> allowed;
        if (budget.VisibilityMode == BudgetVisibilityMode.AllMembers)
        {
            allowed = Array.Empty<Guid>(); // usa todos
        }
        else if (budget.VisibilityMode == BudgetVisibilityMode.Private)
        {
            allowed = new[] { budget.OwnerUserId };
        }
        else
        {
            allowed = budget.AllowedUsers.Select(x => x.UserId).Distinct().ToArray();
        }

        var members = await _db.FamilyMembers
            .AsNoTracking()
            .Include(m => m.User)
            .Where(m => m.FamilyId == familyId)
            .OrderBy(m => m.User.Name)
            .Select(m => new
            {
                m.UserId,
                m.User.Name,
                Role = m.Role.ToString()
            })
            .ToListAsync(ct);

        if (budget.VisibilityMode == BudgetVisibilityMode.AllMembers)
            return members.Select(m => new BudgetMemberModel(m.UserId, m.Name, m.Role)).ToList();

        var allowedSet = allowed.ToHashSet();
        return members
            .Where(m => allowedSet.Contains(m.UserId))
            .Select(m => new BudgetMemberModel(m.UserId, m.Name, m.Role))
            .ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<BudgetCategoryLimitModel>> GetCategoryLimitsAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        var budget = await _db.Budgets
            .AsNoTracking()
            .Include(b => b.AllowedUsers)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.FamilyId == familyId, ct);

        if (budget is null) throw new KeyNotFoundException("Orçamento não encontrado.");
        EnsureBudgetAccess(userId, budget);

        return await _db.BudgetCategoryLimits
            .AsNoTracking()
            .Where(l => l.BudgetId == budgetId)
            .Include(l => l.Category)
            .Where(l => l.Category.Type == FinanceCategoryType.Expense)
            .OrderBy(l => l.Category.SortOrder)
            .ThenBy(l => l.Category.Name)
            .Select(l => new BudgetCategoryLimitModel(
                l.Id,
                l.CategoryId,
                l.Category.Name,
                l.Category.IconKey,
                l.Category.SortOrder,
                l.Amount))
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task UpdateCategoryLimitsAsync(Guid userId, Guid familyId, Guid budgetId, IReadOnlyList<BudgetCategoryLimitInput> limits, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var budget = await _db.Budgets
            .Include(b => b.AllowedUsers)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.FamilyId == familyId, ct);

        if (budget is null) throw new KeyNotFoundException("Orçamento não encontrado.");
        EnsureBudgetAccess(userId, budget);

        if (limits is null || limits.Count == 0)
            throw new ArgumentException("Envia pelo menos 1 categoria.");

        var normalized = limits
            .GroupBy(x => x.CategoryId)
            .Select(g => g.Last())
            .ToList();

        foreach (var l in normalized)
        {
            if (l.Amount < 0) throw new ArgumentException("Limite por categoria inválido.");
        }

        var ids = normalized.Select(x => x.CategoryId).ToList();

        // Validar categorias (da família + despesas)
        var validIds = await _db.FinanceCategories
            .AsNoTracking()
            .Where(c => c.FamilyId == familyId && c.Type == FinanceCategoryType.Expense && ids.Contains(c.Id))
            .Select(c => c.Id)
            .ToListAsync(ct);

        var validSet = validIds.ToHashSet();
        if (validSet.Count != ids.Distinct().Count())
            throw new ArgumentException("Uma ou mais categorias são inválidas para esta família.");

        var existing = await _db.BudgetCategoryLimits
            .Where(l => l.BudgetId == budgetId && ids.Contains(l.CategoryId))
            .ToListAsync(ct);

        var byCat = existing.ToDictionary(x => x.CategoryId, x => x);

        foreach (var l in normalized)
        {
            if (byCat.TryGetValue(l.CategoryId, out var row))
            {
                row.Amount = l.Amount;
                row.UpdatedAtUtc = DateTime.UtcNow;
            }
            else
            {
                _db.BudgetCategoryLimits.Add(new BudgetCategoryLimit
                {
                    BudgetId = budgetId,
                    CategoryId = l.CategoryId,
                    Amount = l.Amount
                });
            }
        }

        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "budgetcategorylimits:changed", new
        {
            action = "updated",
            budgetId
        }, ct);
    }

    private static BudgetDetailModel ToDetailModel(Budget budget) => new(
        budget.Id,
        budget.FamilyId,
        budget.OwnerUserId,
        budget.Name,
        budget.IconKey,
        budget.Type.ToString(),
        budget.PeriodType?.ToString(),
        budget.StartDate,
        budget.EndDate,
        budget.SemiMonthlyPattern?.ToString(),
        budget.SpendingLimit,
        budget.CurrencyCode,
        budget.VisibilityMode.ToString(),
        budget.MainIndicator,
        budget.OnlyPaidInTotals,
        budget.TransactionOrder,
        budget.UpcomingDisplayMode,
        budget.AllowedUsers.Select(x => x.UserId).Distinct().ToList());

    private static void EnsureBudgetAccess(Guid userId, Budget budget)
    {
        switch (budget.VisibilityMode)
        {
            case BudgetVisibilityMode.AllMembers:
                return;
            case BudgetVisibilityMode.Private:
                if (budget.OwnerUserId != userId)
                    throw new UnauthorizedAccessException("Sem permissões para aceder a este orçamento.");
                return;
            case BudgetVisibilityMode.SpecificMembers:
                if (budget.OwnerUserId == userId) return;
                if (budget.AllowedUsers.Any(a => a.UserId == userId)) return;
                throw new UnauthorizedAccessException("Sem permissões para aceder a este orçamento.");
            default:
                throw new InvalidOperationException("Visibilidade inválida.");
        }
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

        if (role is null) throw new UnauthorizedAccessException("Não és membro desta família.");
        return role.Value;
    }

    private static void EnsureNotViewer(FamilyRole role)
    {
        if (role == FamilyRole.Viewer)
            throw new UnauthorizedAccessException("Sem permissões para editar.");
    }

    private static string NormalizeName(string name) => name.Trim();
    private static string NormalizeIconKey(string iconKey) => iconKey.Trim().ToLowerInvariant();
    private static string NormalizeCurrency(string currencyCode) => currencyCode.Trim().ToUpperInvariant();

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
