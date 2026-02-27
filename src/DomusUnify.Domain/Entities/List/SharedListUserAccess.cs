namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa o acesso explícito de um utilizador a uma lista.
/// </summary>
public sealed class SharedListUserAccess
{
    /// <summary>
    /// Identificador do registo.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador da lista.
    /// </summary>
    public Guid SharedListId { get; set; }

    /// <summary>
    /// Lista associada.
    /// </summary>
    public SharedList SharedList { get; set; } = null!;

    /// <summary>
    /// Identificador do utilizador com acesso.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Utilizador com acesso.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Data/hora de criação (UTC).
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
}

