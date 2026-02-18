namespace DomusUnify.Application.FinanceAccounts.Models;

public sealed record FinanceAccountModel(
    Guid Id,
    string Type,
    string Name,
    string IconKey,
    int SortOrder
);

