using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma entrada de atividade (feed) dentro de uma família.
/// </summary>
public sealed class ActivityEntry : BaseEntity
{
    /// <summary>
    /// Identificador da família.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Família associada.
    /// </summary>
    public Family Family { get; set; } = null!;

    /// <summary>
    /// Identificador do utilizador que executou a ação.
    /// </summary>
    public Guid ActorUserId { get; set; }

    /// <summary>
    /// Utilizador que executou a ação.
    /// </summary>
    public User ActorUser { get; set; } = null!;

    /// <summary>
    /// Tipo/identificador da atividade (ex.: <c>lists:item_added</c>).
    /// </summary>
    public string Kind { get; set; } = null!;

    /// <summary>
    /// Mensagem legível da atividade (para apresentação direta no UI).
    /// </summary>
    public string Message { get; set; } = null!;

    /// <summary>
    /// Identificador da lista associada (quando aplicável).
    /// </summary>
    public Guid? ListId { get; set; }

    /// <summary>
    /// Lista associada (opcional).
    /// </summary>
    public SharedList? List { get; set; }

    /// <summary>
    /// Identificador de entidade relacionada (opcional) - ex.: um item de lista.
    /// </summary>
    public Guid? EntityId { get; set; }
}

