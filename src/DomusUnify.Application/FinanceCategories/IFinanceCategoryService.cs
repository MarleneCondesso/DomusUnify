using DomusUnify.Application.FinanceCategories.Models;

namespace DomusUnify.Application.FinanceCategories;

public interface IFinanceCategoryService
{
    Task EnsureDefaultsAsync(Guid familyId, CancellationToken ct);

    Task<IReadOnlyList<FinanceCategoryModel>> GetAsync(
        Guid userId,
        Guid familyId,
        string? type,
        CancellationToken ct);

    Task<FinanceCategoryModel> CreateAsync(
        Guid userId,
        Guid familyId,
        string type,
        string name,
        string iconKey,
        int sortOrder,
        CancellationToken ct);

    Task<FinanceCategoryModel> UpdateAsync(
        Guid userId,
        Guid familyId,
        Guid categoryId,
        string? name,
        string? iconKey,
        int? sortOrder,
        CancellationToken ct);

    Task DeleteAsync(Guid userId, Guid familyId, Guid categoryId, CancellationToken ct);
}

