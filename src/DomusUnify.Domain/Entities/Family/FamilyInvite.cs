using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa um convite para aderir a uma família.
/// </summary>
public sealed class FamilyInvite : BaseEntity
{
    /// <summary>
    /// Identificador da família a que o convite pertence.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Família associada.
    /// </summary>
    public Family Family { get; set; } = null!;

    /// <summary>
    /// Identificador do utilizador que criou o convite.
    /// </summary>
    public Guid InvitedByUserId { get; set; }

    /// <summary>
    /// Utilizador que criou o convite.
    /// </summary>
    public User InvitedByUser { get; set; } = null!;

    /// <summary>
    /// Hash do token do convite (o token em texto simples não é persistido).
    /// </summary>
    public string TokenHash { get; set; } = null!;

    /// <summary>
    /// Data/hora de expiração do convite (UTC).
    /// </summary>
    public DateTime ExpiresAtUtc { get; set; }

    /// <summary>
    /// Número máximo de utilizações permitidas (opcional; <see langword="null"/> significa ilimitado).
    /// </summary>
    public int? MaxUses { get; set; }

    /// <summary>
    /// Número de utilizações já consumidas.
    /// </summary>
    public int Uses { get; set; }

    /// <summary>
    /// Indica se o convite foi revogado.
    /// </summary>
    public bool IsRevoked { get; set; }
}
