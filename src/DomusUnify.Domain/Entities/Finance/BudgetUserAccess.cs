namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa o acesso explícito de um utilizador a um orçamento.
/// </summary>
public sealed class BudgetUserAccess
{
    /// <summary>
    /// Identificador do registo.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador do orçamento.
    /// </summary>
    public Guid BudgetId { get; set; }

    /// <summary>
    /// Orçamento associado.
    /// </summary>
    public Budget Budget { get; set; } = null!;

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
