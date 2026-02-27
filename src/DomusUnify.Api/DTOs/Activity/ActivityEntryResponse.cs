namespace DomusUnify.Api.DTOs.Activity;

/// <summary>
/// Resposta com uma entrada do feed de atividade.
/// </summary>
public sealed class ActivityEntryResponse
{
    /// <summary>
    /// Identificador da entrada.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Tipo/identificador da atividade.
    /// </summary>
    public string Kind { get; set; } = null!;

    /// <summary>
    /// Mensagem legível (sem incluir o nome do ator).
    /// </summary>
    public string Message { get; set; } = null!;

    /// <summary>
    /// Identificador do utilizador que executou a ação.
    /// </summary>
    public Guid ActorUserId { get; set; }

    /// <summary>
    /// Nome do utilizador que executou a ação.
    /// </summary>
    public string ActorName { get; set; } = null!;

    /// <summary>
    /// Data/hora (UTC) da entrada.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }

    /// <summary>
    /// Identificador da lista associada (opcional).
    /// </summary>
    public Guid? ListId { get; set; }

    /// <summary>
    /// Identificador de entidade relacionada (opcional).
    /// </summary>
    public Guid? EntityId { get; set; }
}

