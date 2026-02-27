namespace DomusUnify.Application.Lists.Models;

/// <summary>
/// Modelo com informação resumida de uma lista.
/// </summary>
/// <param name="Id">Identificador da lista.</param>
/// <param name="Name">Nome da lista.</param>
/// <param name="ColorHex">Cor da lista em hexadecimal.</param>
/// <param name="CoverImageUrl">URL da imagem de capa da lista.</param>
/// <param name="Type">Tipo de lista (<c>Shopping</c>, <c>Tasks</c> ou <c>Custom</c>).</param>
/// <param name="OwnerUserId">Identificador do utilizador proprietário (criador).</param>
/// <param name="VisibilityMode">Modo de visibilidade (<c>Private</c>, <c>AllMembers</c> ou <c>SpecificMembers</c>).</param>
/// <param name="AllowedUserIds">Lista de utilizadores com acesso quando a visibilidade é <c>SpecificMembers</c>.</param>
/// <param name="SharedWithMembers">Membros com os quais a lista é partilhada (quem tem acesso).</param>
/// <param name="ItemsCount">Número total de itens.</param>
/// <param name="CompletedCount">Número de itens concluídos.</param>
public sealed record ListSummary(
    Guid Id,
    string Name,
    string ColorHex,
    string CoverImageUrl,
    string Type,
    Guid OwnerUserId,
    string VisibilityMode,
    IReadOnlyList<Guid> AllowedUserIds,
    IReadOnlyList<ListMemberPreview> SharedWithMembers,
    int ItemsCount,
    int CompletedCount
);

/// <summary>
/// Modelo com informação mínima de um membro (para pré-visualizações, como avatares).
/// </summary>
/// <param name="UserId">Identificador do utilizador.</param>
/// <param name="Name">Nome do utilizador.</param>
public sealed record ListMemberPreview(Guid UserId, string Name);

/// <summary>
/// Pedido interno para criar uma lista.
/// </summary>
/// <param name="Name">Nome da lista.</param>
/// <param name="ColorHex">Cor em formato HEX.</param>
/// <param name="Type">Tipo de lista.</param>
/// <param name="VisibilityMode">Modo de visibilidade.</param>
/// <param name="AllowedUserIds">Utilizadores com acesso, quando aplicável.</param>
public sealed record ListCreateInput(
    string Name,
    string ColorHex,
    string Type,
    string VisibilityMode,
    IReadOnlyList<Guid>? AllowedUserIds
);

/// <summary>
/// Pedido interno para atualizar uma lista.
/// </summary>
/// <param name="Name">Novo nome da lista.</param>
/// <param name="ColorHex">Nova cor (HEX).</param>
/// <param name="Type">Novo tipo.</param>
/// <param name="VisibilityMode">Novo modo de visibilidade (opcional).</param>
/// <param name="AllowedUserIds">Lista de utilizadores com acesso, quando aplicável (opcional).</param>
public sealed record ListUpdateInput(
    string Name,
    string ColorHex,
    string Type,
    string? VisibilityMode,
    IReadOnlyList<Guid>? AllowedUserIds
);

/// <summary>
/// Modelo de item de lista.
/// </summary>
/// <param name="Id">Identificador do item.</param>
/// <param name="ListId">Identificador da lista.</param>
/// <param name="Name">Nome do item.</param>
/// <param name="CategoryId">Identificador da categoria (opcional).</param>
/// <param name="AssigneeUserId">Identificador do utilizador a quem estÃ¡ atribuÃ­do (opcional).</param>
/// <param name="Note">Nota opcional.</param>
/// <param name="PhotoUrl">URL (ou data URL) de uma foto (opcional).</param>
/// <param name="IsCompleted">Indica se o item está concluído.</param>
/// <param name="CompletedAtUtc">Data/hora de conclusão (UTC), se aplicável.</param>
/// <param name="CompletedByUserId">Utilizador que concluiu o item, se aplicável.</param>
public sealed record ListItemModel(
    Guid Id,
    Guid ListId,
    string Name,
    Guid? CategoryId,
    Guid? AssigneeUserId,
    string? Note,
    string? PhotoUrl,
    bool IsCompleted,
    DateTime? CompletedAtUtc,
    Guid? CompletedByUserId
);
