namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma conta financeira que foi ocultada (removida) de um orçamento específico.
/// </summary>
/// <remarks>
/// As contas financeiras são da família (globais), mas cada orçamento pode ocultar algumas para não aparecerem na seleção.
/// </remarks>
public sealed class BudgetHiddenFinanceAccount
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
    /// Identificador da conta financeira ocultada.
    /// </summary>
    public Guid AccountId { get; set; }

    /// <summary>
    /// Conta financeira associada.
    /// </summary>
    public FinanceAccount Account { get; set; } = null!;

    /// <summary>
    /// Data/hora de criação (UTC).
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
}
