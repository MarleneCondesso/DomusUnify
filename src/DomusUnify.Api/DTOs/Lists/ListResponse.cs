namespace DomusUnify.Api.DTOs.Lists;

/// <summary>
/// Resposta com informação de uma lista.
/// </summary>
public sealed class ListResponse
{
    /// <summary>
    /// Identificador da lista.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Nome da lista.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Tipo de lista (<c>Shopping</c>, <c>Tasks</c> ou <c>Custom</c>).
    /// </summary>
    public string Type { get; set; } = "Custom";

    /// <summary>
    /// Cor da lista em hexadecimal.
    /// </summary>
    public string ColorHex { get; set; } = "";

    /// <summary>
    /// URL da imagem de capa da lista.
    /// </summary>
    public string CoverImageUrl { get; set; } = "";

    /// <summary>
    /// Identificador do utilizador proprietário (criador).
    /// </summary>
    public Guid OwnerUserId { get; set; }

    /// <summary>
    /// Modo de visibilidade da lista (<c>Private</c>, <c>AllMembers</c> ou <c>SpecificMembers</c>).
    /// </summary>
    public string VisibilityMode { get; set; } = "AllMembers";

    /// <summary>
    /// Lista de utilizadores com acesso quando a visibilidade é <c>SpecificMembers</c>.
    /// </summary>
    public List<Guid> AllowedUserIds { get; set; } = new();

    /// <summary>
    /// Membros com os quais a lista é partilhada (ou seja, quem tem acesso à lista).
    /// </summary>
    public List<SharedListMemberPreviewResponse> SharedWithMembers { get; set; } = new();

    /// <summary>
    /// Número total de itens na lista.
    /// </summary>
    public int ItemsCount { get; set; }

    /// <summary>
    /// Número de itens concluídos.
    /// </summary>
    public int CompletedCount { get; set; }
}
