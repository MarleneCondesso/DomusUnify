namespace DomusUnify.Application.Lists.Models;

/// <summary>
/// Modelo com informação resumida de uma lista.
/// </summary>
/// <param name="Id">Identificador da lista.</param>
/// <param name="Name">Nome da lista.</param>
/// <param name="ColorHex">Cor da lista em hexadecimal.</param>
/// <param name="Type">Tipo de lista (<c>Shopping</c>, <c>Tasks</c> ou <c>Custom</c>).</param>
/// <param name="ItemsCount">Número total de itens.</param>
/// <param name="CompletedCount">Número de itens concluídos.</param>
public sealed record ListSummary(
    Guid Id,
    string Name,
    string ColorHex,
    string Type,
    int ItemsCount,
    int CompletedCount
);

/// <summary>
/// Modelo de item de lista.
/// </summary>
/// <param name="Id">Identificador do item.</param>
/// <param name="ListId">Identificador da lista.</param>
/// <param name="Name">Nome do item.</param>
/// <param name="CategoryId">Identificador da categoria (opcional).</param>
/// <param name="IsCompleted">Indica se o item está concluído.</param>
/// <param name="CompletedAtUtc">Data/hora de conclusão (UTC), se aplicável.</param>
/// <param name="CompletedByUserId">Utilizador que concluiu o item, se aplicável.</param>
public sealed record ListItemModel(
    Guid Id,
    Guid ListId,
    string Name,
    Guid? CategoryId,
    bool IsCompleted,
    DateTime? CompletedAtUtc,
    Guid? CompletedByUserId
);
