using DomusUnify.Application.Budgets.Models;

namespace DomusUnify.Application.Budgets;

public interface IBudgetService
{
    Task<IReadOnlyList<BudgetSummaryModel>> GetAsync(Guid userId, Guid familyId, CancellationToken ct);
    Task<BudgetDetailModel> GetByIdAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);
    Task<BudgetDetailModel> CreateAsync(Guid userId, Guid familyId, BudgetCreateInput input, CancellationToken ct);
    Task<BudgetDetailModel> UpdateAsync(Guid userId, Guid familyId, Guid budgetId, BudgetUpdateInput input, CancellationToken ct);
    Task DeleteAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);

    Task<IReadOnlyList<BudgetMemberModel>> GetMembersAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);

    Task<IReadOnlyList<BudgetCategoryLimitModel>> GetCategoryLimitsAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);
    Task UpdateCategoryLimitsAsync(Guid userId, Guid familyId, Guid budgetId, IReadOnlyList<BudgetCategoryLimitInput> limits, CancellationToken ct);
}
