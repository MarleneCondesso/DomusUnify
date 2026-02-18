using System.Globalization;
using System.Text;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Common.Realtime;
using DomusUnify.Application.FinanceTransactions.Models;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.FinanceTransactions;

/// <summary>
/// Implementação do serviço de transações financeiras.
/// </summary>
public sealed class FinanceTransactionService : IFinanceTransactionService
{
    private readonly IAppDbContext _db;
    private readonly IRealtimeNotifier _rt;

    /// <summary>
    /// Inicializa uma nova instância de <see cref="FinanceTransactionService"/>.
    /// </summary>
    /// <param name="db">Contexto de base de dados.</param>
    /// <param name="rt">Notificador em tempo real.</param>
    public FinanceTransactionService(IAppDbContext db, IRealtimeNotifier rt)
    {
        _db = db;
        _rt = rt;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<FinanceTransactionModel>> GetAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        CancellationToken ct)
    {
        var (budget, _) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: false, ct);

        var q = _db.FinanceTransactions
            .AsNoTracking()
            .Where(t => t.BudgetId == budgetId);

        if (from.HasValue) q = q.Where(t => t.Date >= from.Value);
        if (to.HasValue) q = q.Where(t => t.Date <= to.Value);

        q = budget.TransactionOrder == BudgetTransactionOrder.OldestFirst
            ? q.OrderBy(t => t.Date).ThenBy(t => t.CreatedAtUtc)
            : q.OrderByDescending(t => t.Date).ThenByDescending(t => t.CreatedAtUtc);

        return await q
            .Select(t => new FinanceTransactionModel(
                t.Id,
                t.BudgetId,
                t.Amount,
                t.Title,
                t.Type.ToString(),
                t.CategoryId,
                t.Category.Name,
                t.Category.IconKey,
                t.AccountId,
                t.Account.Name,
                t.Account.IconKey,
                t.PaidByUserId,
                t.PaidByUser.Name,
                t.Date,
                t.IsPaid,
                t.PaidAtUtc,
                t.RepeatType,
                t.RepeatInterval,
                t.RepeatUnit,
                t.ReminderType,
                t.ReminderValue,
                t.ReminderUnit,
                t.Note))
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<FinanceTransactionModel> CreateAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        FinanceTransactionCreateInput input,
        CancellationToken ct)
    {
        var (budget, role) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: true, ct);
        EnsureNotViewer(role);

        var now = DateTime.UtcNow;

        if (input.Amount <= 0) throw new ArgumentException("Valor inválido.");
        var title = NormalizeTitle(input.Title);
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Título é obrigatório.");
        if (title.Length > 200) throw new ArgumentException("Título demasiado longo.");

        if (!Enum.TryParse<FinanceTransactionType>(input.Type, true, out var txType))
            throw new ArgumentException("Tipo inválido. Use: Expense, Income.");

        var expectedCategoryType = txType == FinanceTransactionType.Expense ? FinanceCategoryType.Expense : FinanceCategoryType.Income;
        await EnsureCategoryAsync(familyId, input.CategoryId, expectedCategoryType, ct);
        await EnsureAccountAsync(familyId, input.AccountId, ct);
        await EnsurePayerAsync(familyId, budget, input.PaidByUserId, ct);

        var date = input.Date ?? DateOnly.FromDateTime(now);

        ValidateRepeat(input.RepeatType, input.RepeatInterval, input.RepeatUnit);
        ValidateReminder(input.ReminderType, input.ReminderValue, input.ReminderUnit);

        var note = NormalizeNoteAllowNull(input.Note);
        if (note is not null && note.Length > 2000) throw new ArgumentException("Nota demasiado longa.");

        var entity = new FinanceTransaction
        {
            BudgetId = budgetId,
            Amount = input.Amount,
            Title = title,
            Type = txType,
            CategoryId = input.CategoryId,
            AccountId = input.AccountId,
            PaidByUserId = input.PaidByUserId,
            Date = date,
            IsPaid = input.IsPaid,
            PaidAtUtc = input.IsPaid ? now : null,
            RepeatType = input.RepeatType,
            RepeatInterval = input.RepeatType == TransactionRepeatType.Custom ? input.RepeatInterval : null,
            RepeatUnit = input.RepeatType == TransactionRepeatType.Custom ? input.RepeatUnit : null,
            ReminderType = input.ReminderType,
            ReminderValue = input.ReminderType == TransactionReminderType.Custom ? input.ReminderValue : null,
            ReminderUnit = input.ReminderType == TransactionReminderType.Custom ? input.ReminderUnit : null,
            Note = note,
            CreatedByUserId = userId,
            CreatedAtUtc = now
        };

        _db.FinanceTransactions.Add(entity);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "financetransactions:changed", new
        {
            action = "created",
            budgetId,
            transactionId = entity.Id
        }, ct);

        return await GetByIdModelAsync(entity.Id, ct);
    }

    /// <inheritdoc />
    public async Task<FinanceTransactionModel> UpdateAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        Guid transactionId,
        FinanceTransactionUpdateInput input,
        CancellationToken ct)
    {
        var (budget, role) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: true, ct);
        EnsureNotViewer(role);

        var now = DateTime.UtcNow;

        var entity = await _db.FinanceTransactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.BudgetId == budgetId, ct);

        if (entity is null) throw new KeyNotFoundException("Transação não encontrada.");

        var finalType = entity.Type;
        if (input.Type is not null)
        {
            if (!Enum.TryParse<FinanceTransactionType>(input.Type, true, out var parsed))
                throw new ArgumentException("Tipo inválido. Use: Expense, Income.");

            finalType = parsed;
            entity.Type = parsed;
        }

        if (input.Amount.HasValue)
        {
            if (input.Amount.Value <= 0) throw new ArgumentException("Valor inválido.");
            entity.Amount = input.Amount.Value;
        }

        if (input.Title is not null)
        {
            var title = NormalizeTitle(input.Title);
            if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Título inválido.");
            if (title.Length > 200) throw new ArgumentException("Título demasiado longo.");
            entity.Title = title;
        }

        if (input.Date.HasValue)
            entity.Date = input.Date.Value;

        if (input.AccountId.HasValue)
        {
            await EnsureAccountAsync(familyId, input.AccountId.Value, ct);
            entity.AccountId = input.AccountId.Value;
        }

        if (input.PaidByUserId.HasValue)
        {
            await EnsurePayerAsync(familyId, budget, input.PaidByUserId.Value, ct);
            entity.PaidByUserId = input.PaidByUserId.Value;
        }

        // Categoria (validar vs tipo final)
        var finalCategoryId = input.CategoryId ?? entity.CategoryId;
        var expectedCategoryType = finalType == FinanceTransactionType.Expense ? FinanceCategoryType.Expense : FinanceCategoryType.Income;
        await EnsureCategoryAsync(familyId, finalCategoryId, expectedCategoryType, ct);
        if (input.CategoryId.HasValue) entity.CategoryId = input.CategoryId.Value;

        // Pago
        if (input.IsPaid.HasValue)
        {
            entity.IsPaid = input.IsPaid.Value;
            entity.PaidAtUtc = input.IsPaid.Value ? now : null;
        }

        // Repetição
        if (input.RepeatType.HasValue)
        {
            var repeatType = input.RepeatType.Value;
            ValidateRepeat(repeatType, input.RepeatInterval, input.RepeatUnit);

            entity.RepeatType = repeatType;
            entity.RepeatInterval = repeatType == TransactionRepeatType.Custom ? input.RepeatInterval : null;
            entity.RepeatUnit = repeatType == TransactionRepeatType.Custom ? input.RepeatUnit : null;
        }

        // Lembrete
        if (input.ReminderType.HasValue)
        {
            var reminderType = input.ReminderType.Value;
            ValidateReminder(reminderType, input.ReminderValue, input.ReminderUnit);

            entity.ReminderType = reminderType;
            entity.ReminderValue = reminderType == TransactionReminderType.Custom ? input.ReminderValue : null;
            entity.ReminderUnit = reminderType == TransactionReminderType.Custom ? input.ReminderUnit : null;
        }

        // Nota (permite limpar)
        if (input.NoteChangeRequested)
        {
            var note = NormalizeNoteAllowNull(input.Note);
            if (note is not null && note.Length > 2000) throw new ArgumentException("Nota demasiado longa.");
            entity.Note = note;
        }

        entity.UpdatedAtUtc = now;

        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "financetransactions:changed", new
        {
            action = "updated",
            budgetId,
            transactionId = entity.Id
        }, ct);

        return await GetByIdModelAsync(entity.Id, ct);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(Guid userId, Guid familyId, Guid budgetId, Guid transactionId, CancellationToken ct)
    {
        var (_, role) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: true, ct);
        EnsureNotViewer(role);

        var entity = await _db.FinanceTransactions.FirstOrDefaultAsync(t => t.Id == transactionId && t.BudgetId == budgetId, ct);
        if (entity is null) throw new KeyNotFoundException("Transação não encontrada.");

        _db.FinanceTransactions.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "financetransactions:changed", new
        {
            action = "deleted",
            budgetId,
            transactionId
        }, ct);
    }

    /// <inheritdoc />
    public async Task<BudgetTotalsModel> GetTotalsAsync(Guid userId, Guid familyId, Guid budgetId, DateOnly? referenceDate, CancellationToken ct)
    {
        var (budget, _) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: false, ct);

        var today = referenceDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var (start, end) = GetPeriodRange(budget, today);

        var q = _db.FinanceTransactions.AsNoTracking().Where(t => t.BudgetId == budgetId);
        if (budget.OnlyPaidInTotals) q = q.Where(t => t.IsPaid);

        var incomeThisPeriod = await q
            .Where(t => t.Type == FinanceTransactionType.Income && t.Date >= start && t.Date <= end)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        var expensesThisPeriod = await q
            .Where(t => t.Type == FinanceTransactionType.Expense && t.Date >= start && t.Date <= end)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        var incomeToday = await q
            .Where(t => t.Type == FinanceTransactionType.Income && t.Date == today)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        var expensesToday = await q
            .Where(t => t.Type == FinanceTransactionType.Expense && t.Date == today)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        var totalExpenses = await q
            .Where(t => t.Type == FinanceTransactionType.Expense)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        return new BudgetTotalsModel(
            today,
            start,
            end,
            incomeThisPeriod,
            expensesThisPeriod,
            incomeThisPeriod - expensesThisPeriod,
            incomeToday - expensesToday,
            totalExpenses);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CategorySummaryModel>> GetCategorySummaryAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        string type,
        CancellationToken ct)
    {
        var (budget, _) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: false, ct);

        if (!Enum.TryParse<FinanceTransactionType>(type, true, out var txType))
            throw new ArgumentException("Tipo inválido. Use: Expense, Income.");

        var q = _db.FinanceTransactions.AsNoTracking()
            .Where(t => t.BudgetId == budgetId && t.Type == txType);

        if (budget.OnlyPaidInTotals) q = q.Where(t => t.IsPaid);
        if (from.HasValue) q = q.Where(t => t.Date >= from.Value);
        if (to.HasValue) q = q.Where(t => t.Date <= to.Value);

        var totals = await q
            .GroupBy(t => new { t.CategoryId, t.Category.Name, t.Category.IconKey })
            .Select(g => new
            {
                g.Key.CategoryId,
                g.Key.Name,
                g.Key.IconKey,
                Total = g.Sum(x => x.Amount)
            })
            .OrderByDescending(x => x.Total)
            .ToListAsync(ct);

        var overall = totals.Sum(x => x.Total);

        return totals
            .Select(x => new CategorySummaryModel(
                x.CategoryId,
                x.Name,
                x.IconKey,
                x.Total,
                Percentage(x.Total, overall)))
            .ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<MemberSummaryModel>> GetMemberSummaryAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        string type,
        CancellationToken ct)
    {
        var (budget, _) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: false, ct);

        if (!Enum.TryParse<FinanceTransactionType>(type, true, out var txType))
            throw new ArgumentException("Tipo inválido. Use: Expense, Income.");

        var q = _db.FinanceTransactions.AsNoTracking()
            .Where(t => t.BudgetId == budgetId && t.Type == txType);

        if (budget.OnlyPaidInTotals) q = q.Where(t => t.IsPaid);
        if (from.HasValue) q = q.Where(t => t.Date >= from.Value);
        if (to.HasValue) q = q.Where(t => t.Date <= to.Value);

        var totals = await q
            .GroupBy(t => new { t.PaidByUserId, t.PaidByUser.Name })
            .Select(g => new
            {
                g.Key.PaidByUserId,
                Name = g.Key.Name,
                Total = g.Sum(x => x.Amount)
            })
            .OrderByDescending(x => x.Total)
            .ToListAsync(ct);

        var overall = totals.Sum(x => x.Total);

        return totals
            .Select(x => new MemberSummaryModel(
                x.PaidByUserId,
                x.Name,
                x.Total,
                Percentage(x.Total, overall)))
            .ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AccountSummaryModel>> GetAccountSummaryAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        string type,
        CancellationToken ct)
    {
        var (budget, _) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: false, ct);

        if (!Enum.TryParse<FinanceTransactionType>(type, true, out var txType))
            throw new ArgumentException("Tipo inválido. Use: Expense, Income.");

        var q = _db.FinanceTransactions.AsNoTracking()
            .Where(t => t.BudgetId == budgetId && t.Type == txType);

        if (budget.OnlyPaidInTotals) q = q.Where(t => t.IsPaid);
        if (from.HasValue) q = q.Where(t => t.Date >= from.Value);
        if (to.HasValue) q = q.Where(t => t.Date <= to.Value);

        var totals = await q
            .GroupBy(t => new { t.AccountId, t.Account.Name })
            .Select(g => new
            {
                g.Key.AccountId,
                Name = g.Key.Name,
                Total = g.Sum(x => x.Amount)
            })
            .OrderByDescending(x => x.Total)
            .ToListAsync(ct);

        var overall = totals.Sum(x => x.Total);

        return totals
            .Select(x => new AccountSummaryModel(
                x.AccountId,
                x.Name,
                x.Total,
                Percentage(x.Total, overall)))
            .ToList();
    }

    /// <inheritdoc />
    public async Task<CsvExportModel> ExportCsvAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly from,
        DateOnly to,
        string? delimiter,
        CancellationToken ct)
    {
        if (to < from) throw new ArgumentException("Intervalo inválido.");

        var (budget, _) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: false, ct);

        var d = ParseDelimiter(delimiter);

        var rows = await _db.FinanceTransactions
            .AsNoTracking()
            .Where(t => t.BudgetId == budgetId && t.Date >= from && t.Date <= to)
            .OrderBy(t => t.Date)
            .ThenBy(t => t.CreatedAtUtc)
            .Select(t => new
            {
                t.Date,
                Type = t.Type.ToString(),
                t.Title,
                t.Amount,
                Category = t.Category.Name,
                Account = t.Account.Name,
                PaidBy = t.PaidByUser.Name,
                t.IsPaid,
                t.Note
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.Append("Date").Append(d)
            .Append("Type").Append(d)
            .Append("Title").Append(d)
            .Append("Amount").Append(d)
            .Append("Currency").Append(d)
            .Append("Category").Append(d)
            .Append("Account").Append(d)
            .Append("PaidBy").Append(d)
            .Append("IsPaid").Append(d)
            .Append("Note")
            .AppendLine();

        foreach (var r in rows)
        {
            sb.Append(r.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)).Append(d)
                .Append(CsvEscape(r.Type, d)).Append(d)
                .Append(CsvEscape(r.Title, d)).Append(d)
                .Append(r.Amount.ToString(CultureInfo.InvariantCulture)).Append(d)
                .Append(CsvEscape(budget.CurrencyCode, d)).Append(d)
                .Append(CsvEscape(r.Category, d)).Append(d)
                .Append(CsvEscape(r.Account, d)).Append(d)
                .Append(CsvEscape(r.PaidBy, d)).Append(d)
                .Append(r.IsPaid ? "true" : "false").Append(d)
                .Append(CsvEscape(r.Note, d))
                .AppendLine();
        }

        var csv = sb.ToString();
        var preamble = Encoding.UTF8.GetPreamble();
        var contentBytes = Encoding.UTF8.GetBytes(csv);
        var bytes = new byte[preamble.Length + contentBytes.Length];
        Buffer.BlockCopy(preamble, 0, bytes, 0, preamble.Length);
        Buffer.BlockCopy(contentBytes, 0, bytes, preamble.Length, contentBytes.Length);

        var safeName = Slugify(budget.Name);
        var fileName = $"orcamento-{safeName}-{from:yyyyMMdd}-{to:yyyyMMdd}.csv";

        return new CsvExportModel(fileName, "text/csv; charset=utf-8", bytes);
    }

    /// <inheritdoc />
    public async Task MarkAllPaidAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct)
    {
        var (_, role) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: true, ct);
        EnsureNotViewer(role);

        var now = DateTime.UtcNow;

        await _db.FinanceTransactions
            .Where(t => t.BudgetId == budgetId && !t.IsPaid)
            .ExecuteUpdateAsync(s => s
                .SetProperty(t => t.IsPaid, true)
                .SetProperty(t => t.PaidAtUtc, now)
                .SetProperty(t => t.UpdatedAtUtc, now), ct);

        await _rt.NotifyFamilyAsync(familyId, "financetransactions:changed", new
        {
            action = "markAllPaid",
            budgetId
        }, ct);
    }

    /// <inheritdoc />
    public async Task ClearAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct)
    {
        var (_, role) = await EnsureBudgetAccessAsync(userId, familyId, budgetId, requireEdit: true, ct);
        EnsureNotViewer(role);

        await _db.FinanceTransactions
            .Where(t => t.BudgetId == budgetId)
            .ExecuteDeleteAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "financetransactions:changed", new
        {
            action = "cleared",
            budgetId
        }, ct);
    }

    private async Task<FinanceTransactionModel> GetByIdModelAsync(Guid transactionId, CancellationToken ct)
    {
        var model = await _db.FinanceTransactions
            .AsNoTracking()
            .Where(t => t.Id == transactionId)
            .Select(t => new FinanceTransactionModel(
                t.Id,
                t.BudgetId,
                t.Amount,
                t.Title,
                t.Type.ToString(),
                t.CategoryId,
                t.Category.Name,
                t.Category.IconKey,
                t.AccountId,
                t.Account.Name,
                t.Account.IconKey,
                t.PaidByUserId,
                t.PaidByUser.Name,
                t.Date,
                t.IsPaid,
                t.PaidAtUtc,
                t.RepeatType,
                t.RepeatInterval,
                t.RepeatUnit,
                t.ReminderType,
                t.ReminderValue,
                t.ReminderUnit,
                t.Note))
            .FirstOrDefaultAsync(ct);

        if (model is null) throw new KeyNotFoundException("Transação não encontrada.");
        return model;
    }

    private static (DateOnly Start, DateOnly End) GetPeriodRange(Budget budget, DateOnly referenceDate)
    {
        if (budget.Type == BudgetType.OneTime)
        {
            var start = budget.StartDate ?? referenceDate;
            var end = budget.EndDate ?? referenceDate;
            if (end < start) (start, end) = (end, start);
            return (start, end);
        }

        if (!budget.StartDate.HasValue || !budget.PeriodType.HasValue)
            return (referenceDate, referenceDate);

        var anchor = budget.StartDate.Value;

        if (referenceDate < anchor)
        {
            return budget.PeriodType.Value switch
            {
                BudgetPeriodType.Weekly => (anchor, anchor.AddDays(6)),
                BudgetPeriodType.BiWeekly => (anchor, anchor.AddDays(13)),
                BudgetPeriodType.Monthly => (anchor, NextMonthlyStart(anchor, anchor.Day).AddDays(-1)),
                BudgetPeriodType.Yearly => (anchor, NextYearlyStart(anchor).AddDays(-1)),
                BudgetPeriodType.SemiMonthly => (anchor, NextSemiMonthlyStart(anchor, budget.SemiMonthlyPattern).AddDays(-1)),
                _ => (anchor, anchor)
            };
        }

        return budget.PeriodType.Value switch
        {
            BudgetPeriodType.Weekly => WeeklyRange(anchor, referenceDate),
            BudgetPeriodType.BiWeekly => BiWeeklyRange(anchor, referenceDate),
            BudgetPeriodType.Monthly => MonthlyRange(anchor, referenceDate),
            BudgetPeriodType.Yearly => YearlyRange(anchor, referenceDate),
            BudgetPeriodType.SemiMonthly => SemiMonthlyRange(anchor, referenceDate, budget.SemiMonthlyPattern),
            _ => (referenceDate, referenceDate)
        };
    }

    private static (DateOnly Start, DateOnly End) WeeklyRange(DateOnly anchor, DateOnly reference)
    {
        var anchorDay = anchor.DayOfWeek;
        var diff = (7 + (reference.DayOfWeek - anchorDay)) % 7;
        var start = reference.AddDays(-diff);
        return (start, start.AddDays(6));
    }

    private static (DateOnly Start, DateOnly End) BiWeeklyRange(DateOnly anchor, DateOnly reference)
    {
        var daysSince = (reference.ToDateTime(TimeOnly.MinValue) - anchor.ToDateTime(TimeOnly.MinValue)).Days;
        var index = daysSince / 14;
        var start = anchor.AddDays(index * 14);
        return (start, start.AddDays(13));
    }

    private static (DateOnly Start, DateOnly End) MonthlyRange(DateOnly anchor, DateOnly reference)
    {
        var startDay = anchor.Day;
        var startThisMonth = new DateOnly(reference.Year, reference.Month, ClampDay(reference.Year, reference.Month, startDay));
        var start = startThisMonth > reference ? PrevMonthStart(reference, startDay) : startThisMonth;
        var next = NextMonthlyStart(start, startDay);
        return (start, next.AddDays(-1));
    }

    private static DateOnly PrevMonthStart(DateOnly reference, int startDay)
    {
        var y = reference.Year;
        var m = reference.Month - 1;
        if (m == 0) { m = 12; y--; }
        return new DateOnly(y, m, ClampDay(y, m, startDay));
    }

    private static DateOnly NextMonthlyStart(DateOnly start, int startDay)
    {
        var y = start.Year;
        var m = start.Month + 1;
        if (m == 13) { m = 1; y++; }
        return new DateOnly(y, m, ClampDay(y, m, startDay));
    }

    private static (DateOnly Start, DateOnly End) YearlyRange(DateOnly anchor, DateOnly reference)
    {
        var startMonth = anchor.Month;
        var startDay = anchor.Day;

        var startThisYear = new DateOnly(reference.Year, startMonth, ClampDay(reference.Year, startMonth, startDay));
        var start = startThisYear > reference
            ? new DateOnly(reference.Year - 1, startMonth, ClampDay(reference.Year - 1, startMonth, startDay))
            : startThisYear;

        var next = NextYearlyStart(start);
        return (start, next.AddDays(-1));
    }

    private static DateOnly NextYearlyStart(DateOnly start) =>
        new(start.Year + 1, start.Month, ClampDay(start.Year + 1, start.Month, start.Day));

    private static (DateOnly Start, DateOnly End) SemiMonthlyRange(DateOnly anchor, DateOnly reference, BudgetSemiMonthlyPattern? pattern)
    {
        if (pattern is null) return (reference, reference);

        if (pattern == BudgetSemiMonthlyPattern.FirstAndFifteenth)
        {
            var start = reference.Day < 15
                ? new DateOnly(reference.Year, reference.Month, 1)
                : new DateOnly(reference.Year, reference.Month, 15);

            var end = start.Day == 1
                ? new DateOnly(reference.Year, reference.Month, 14)
                : new DateOnly(reference.Year, reference.Month, DateTime.DaysInMonth(reference.Year, reference.Month));

            if (end < anchor) return (anchor, anchor);
            if (start < anchor) start = anchor;
            return (start, end);
        }

        var last = DateTime.DaysInMonth(reference.Year, reference.Month);

        if (reference.Day < 15)
        {
            var (py, pm) = PrevYearMonth(reference.Year, reference.Month);
            var prevLast = DateTime.DaysInMonth(py, pm);
            var start = new DateOnly(py, pm, prevLast);
            var end = new DateOnly(reference.Year, reference.Month, 14);

            if (end < anchor) return (anchor, anchor);
            if (start < anchor) start = anchor;
            return (start, end);
        }

        if (reference.Day < last)
        {
            var start = new DateOnly(reference.Year, reference.Month, 15);
            var end = new DateOnly(reference.Year, reference.Month, last - 1);

            if (end < anchor) return (anchor, anchor);
            if (start < anchor) start = anchor;
            return (start, end);
        }

        var startLast = new DateOnly(reference.Year, reference.Month, last);
        var (ny, nm) = NextYearMonth(reference.Year, reference.Month);
        var endLast = new DateOnly(ny, nm, 14);

        if (endLast < anchor) return (anchor, anchor);
        if (startLast < anchor) startLast = anchor;
        return (startLast, endLast);
    }

    private static DateOnly NextSemiMonthlyStart(DateOnly start, BudgetSemiMonthlyPattern? pattern)
    {
        if (pattern == BudgetSemiMonthlyPattern.FirstAndFifteenth)
        {
            if (start.Day < 15) return new DateOnly(start.Year, start.Month, 15);
            var (ny, nm) = NextYearMonth(start.Year, start.Month);
            return new DateOnly(ny, nm, 1);
        }

        var last = DateTime.DaysInMonth(start.Year, start.Month);
        if (start.Day < 15) return new DateOnly(start.Year, start.Month, 15);
        if (start.Day < last) return new DateOnly(start.Year, start.Month, last);
        var (y, m) = NextYearMonth(start.Year, start.Month);
        return new DateOnly(y, m, 15);
    }

    private static int ClampDay(int year, int month, int day)
        => Math.Min(day, DateTime.DaysInMonth(year, month));

    private static (int Year, int Month) PrevYearMonth(int year, int month)
    {
        month--;
        if (month == 0) { month = 12; year--; }
        return (year, month);
    }

    private static (int Year, int Month) NextYearMonth(int year, int month)
    {
        month++;
        if (month == 13) { month = 1; year++; }
        return (year, month);
    }

    private static decimal Percentage(decimal part, decimal total)
        => total <= 0 ? 0 : Math.Round((part / total) * 100m, 2, MidpointRounding.AwayFromZero);

    private static char ParseDelimiter(string? delimiter)
    {
        if (string.IsNullOrWhiteSpace(delimiter)) return ';';
        var t = delimiter.Trim();
        return t.Length == 0 ? ';' : t[0];
    }

    private static string CsvEscape(string? value, char delimiter)
    {
        if (string.IsNullOrEmpty(value)) return "";
        var needsQuotes = value.Contains(delimiter) || value.Contains('"') || value.Contains('\n') || value.Contains('\r');
        if (!needsQuotes) return value;
        return $"\"{value.Replace("\"", "\"\"")}\"";
    }

    private static string Slugify(string value)
    {
        var sb = new StringBuilder(value.Length);
        foreach (var ch in value.Trim().ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(ch)) sb.Append(ch);
            else if (ch is ' ' or '-' or '_') sb.Append('-');
        }

        var s = sb.ToString();
        while (s.Contains("--")) s = s.Replace("--", "-");
        return string.IsNullOrWhiteSpace(s) ? "orcamento" : s.Trim('-');
    }

    private async Task<(Budget Budget, FamilyRole Role)> EnsureBudgetAccessAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        bool requireEdit,
        CancellationToken ct)
    {
        var role = await _db.FamilyMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.FamilyId == familyId)
            .Select(m => (FamilyRole?)m.Role)
            .FirstOrDefaultAsync(ct);

        if (role is null)
            throw new UnauthorizedAccessException("Não és membro desta família.");

        var budget = await _db.Budgets
            .AsNoTracking()
            .Include(b => b.AllowedUsers)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.FamilyId == familyId, ct);

        if (budget is null) throw new KeyNotFoundException("Orçamento não encontrado.");

        EnsureBudgetAccess(userId, budget);

        if (requireEdit) EnsureNotViewer(role.Value);

        return (budget, role.Value);
    }

    private static void EnsureNotViewer(FamilyRole role)
    {
        if (role == FamilyRole.Viewer)
            throw new UnauthorizedAccessException("Sem permissões para editar.");
    }

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

    private static string NormalizeTitle(string title) => title.Trim();

    private static string? NormalizeNoteAllowNull(string? note)
    {
        if (note is null) return null;
        var t = note.Trim();
        return string.IsNullOrWhiteSpace(t) ? null : t;
    }

    private static void ValidateRepeat(TransactionRepeatType type, int? interval, TransactionRepeatUnit? unit)
    {
        if (type != TransactionRepeatType.Custom) return;

        if (!interval.HasValue || interval.Value < 1 || interval.Value > 99)
            throw new ArgumentException("Repetição personalizada: intervalo inválido (1 a 99).");

        if (!unit.HasValue)
            throw new ArgumentException("Repetição personalizada: unidade é obrigatória.");
    }

    private static void ValidateReminder(TransactionReminderType type, int? value, TransactionReminderUnit? unit)
    {
        if (type != TransactionReminderType.Custom) return;

        if (!value.HasValue || value.Value <= 0)
            throw new ArgumentException("Lembrete personalizado: valor inválido.");

        if (!unit.HasValue)
            throw new ArgumentException("Lembrete personalizado: unidade é obrigatória.");

        var v = value.Value;
        switch (unit.Value)
        {
            case TransactionReminderUnit.Minutes when v is < 1 or > 59:
                throw new ArgumentException("Lembrete: minutos deve ser 1 a 59.");
            case TransactionReminderUnit.Hours when v is < 1 or > 23:
                throw new ArgumentException("Lembrete: horas deve ser 1 a 23.");
            case TransactionReminderUnit.Days when v is < 1 or > 30:
                throw new ArgumentException("Lembrete: dias deve ser 1 a 30.");
        }
    }

    private async Task EnsureCategoryAsync(Guid familyId, Guid categoryId, FinanceCategoryType expectedType, CancellationToken ct)
    {
        var ok = await _db.FinanceCategories
            .AsNoTracking()
            .AnyAsync(c => c.Id == categoryId && c.FamilyId == familyId && c.Type == expectedType, ct);

        if (!ok) throw new ArgumentException("Categoria inválida para este tipo de transação.");
    }

    private async Task EnsureAccountAsync(Guid familyId, Guid accountId, CancellationToken ct)
    {
        var ok = await _db.FinanceAccounts
            .AsNoTracking()
            .AnyAsync(a => a.Id == accountId && a.FamilyId == familyId, ct);

        if (!ok) throw new ArgumentException("Conta inválida para esta família.");
    }

    private async Task EnsurePayerAsync(Guid familyId, Budget budget, Guid paidByUserId, CancellationToken ct)
    {
        var isFamilyMember = await _db.FamilyMembers
            .AsNoTracking()
            .AnyAsync(m => m.FamilyId == familyId && m.UserId == paidByUserId, ct);

        if (!isFamilyMember)
            throw new ArgumentException("Pago por: utilizador inválido para esta família.");

        if (budget.VisibilityMode == BudgetVisibilityMode.AllMembers) return;

        if (budget.VisibilityMode == BudgetVisibilityMode.Private)
        {
            if (budget.OwnerUserId != paidByUserId)
                throw new ArgumentException("Pago por: este orçamento é privado.");
            return;
        }

        if (budget.OwnerUserId == paidByUserId) return;
        if (budget.AllowedUsers.Any(a => a.UserId == paidByUserId)) return;

        throw new ArgumentException("Pago por: utilizador não pertence a este orçamento.");
    }
}
