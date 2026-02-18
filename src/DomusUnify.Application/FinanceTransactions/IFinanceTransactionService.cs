using DomusUnify.Application.FinanceTransactions.Models;

namespace DomusUnify.Application.FinanceTransactions;

public interface IFinanceTransactionService
{
    Task<IReadOnlyList<FinanceTransactionModel>> GetAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        CancellationToken ct);

    Task<FinanceTransactionModel> CreateAsync(Guid userId, Guid familyId, Guid budgetId, FinanceTransactionCreateInput input, CancellationToken ct);
    Task<FinanceTransactionModel> UpdateAsync(Guid userId, Guid familyId, Guid budgetId, Guid transactionId, FinanceTransactionUpdateInput input, CancellationToken ct);
    Task DeleteAsync(Guid userId, Guid familyId, Guid budgetId, Guid transactionId, CancellationToken ct);

    Task<BudgetTotalsModel> GetTotalsAsync(Guid userId, Guid familyId, Guid budgetId, DateOnly? referenceDate, CancellationToken ct);

    Task<IReadOnlyList<CategorySummaryModel>> GetCategorySummaryAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        string type,
        CancellationToken ct);

    Task<IReadOnlyList<MemberSummaryModel>> GetMemberSummaryAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        string type,
        CancellationToken ct);

    Task<IReadOnlyList<AccountSummaryModel>> GetAccountSummaryAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        string type,
        CancellationToken ct);

    Task<CsvExportModel> ExportCsvAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly from,
        DateOnly to,
        string? delimiter,
        CancellationToken ct);

    Task MarkAllPaidAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);
    Task ClearAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);
}

