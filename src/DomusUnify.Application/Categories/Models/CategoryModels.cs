namespace DomusUnify.Application.Categories.Models;

public sealed record CategoryModel(
    Guid Id,
    string Name,
    string IconKey,
    string? ColorHex,
    int SortOrder
);
