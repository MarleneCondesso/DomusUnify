namespace DomusUnify.Application.Lists.Models;

public sealed record ListSummary(
    Guid Id,
    string Name,
    string Type,
    int ItemsCount,
    int CompletedCount
);

public sealed record ListItemModel(
    Guid Id,
    Guid ListId,
    string Name,
    Guid? CategoryId,
    bool IsCompleted,
    DateTime? CompletedAtUtc,
    Guid? CompletedByUserId
);
