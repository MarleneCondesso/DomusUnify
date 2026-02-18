using DomusUnify.Application.FinanceAccounts.Models;

namespace DomusUnify.Application.FinanceAccounts;

public interface IFinanceAccountService
{
    Task EnsureDefaultsAsync(Guid familyId, CancellationToken ct);

    Task<IReadOnlyList<FinanceAccountModel>> GetAsync(
        Guid userId,
        Guid familyId,
        CancellationToken ct);

    Task<FinanceAccountModel> CreateAsync(
        Guid userId,
        Guid familyId,
        string type,
        string name,
        string iconKey,
        int sortOrder,
        CancellationToken ct);

    Task<FinanceAccountModel> UpdateAsync(
        Guid userId,
        Guid familyId,
        Guid accountId,
        string? name,
        string? iconKey,
        int? sortOrder,
        CancellationToken ct);

    Task DeleteAsync(Guid userId, Guid familyId, Guid accountId, CancellationToken ct);
}

