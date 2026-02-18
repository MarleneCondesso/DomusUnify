namespace DomusUnify.Application.FinanceCategories.Models;

public sealed record FinanceCategoryModel(
    Guid Id,
    string Type,
    string Name,
    string IconKey,
    int SortOrder
);

