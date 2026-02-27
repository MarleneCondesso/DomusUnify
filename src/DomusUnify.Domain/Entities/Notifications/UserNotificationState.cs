using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa o estado de leitura/visualização de notificações de um utilizador dentro de uma família.
/// </summary>
public sealed class UserNotificationState : BaseEntity
{
    /// <summary>
    /// Identificador do utilizador.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Utilizador associado.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Identificador da família.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Família associada.
    /// </summary>
    public Family Family { get; set; } = null!;

    /// <summary>
    /// Data/hora (UTC) em que o utilizador marcou as notificações como vistas pela última vez.
    /// </summary>
    public DateTime? LastSeenAtUtc { get; set; }
}

