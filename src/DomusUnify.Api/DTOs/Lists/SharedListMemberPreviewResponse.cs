namespace DomusUnify.Api.DTOs.Lists;

/// <summary>
/// Resposta com informação mínima de um membro (para pré-visualizações, como avatares).
/// </summary>
public sealed class SharedListMemberPreviewResponse
{
    /// <summary>
    /// Identificador do utilizador.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Nome do utilizador.
    /// </summary>
    public string Name { get; set; } = null!;
}

