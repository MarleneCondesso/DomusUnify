namespace DomusUnify.Api.DTOs.Budgets;

/// <summary>
/// Resposta com informação resumida de um orçamento.
/// </summary>
public sealed class BudgetSummaryResponse
{
    /// <summary>
    /// Identificador do orçamento.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Nome do orçamento.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Chave do ícone do orçamento.
    /// </summary>
    public string IconKey { get; set; } = null!;

    /// <summary>
    /// Tipo do orçamento (<c>Recurring</c> ou <c>OneTime</c>).
    /// </summary>
    public string Type { get; set; } = null!;

    /// <summary>
    /// Código ISO da moeda do orçamento (ex.: <c>EUR</c>).
    /// </summary>
    public string CurrencyCode { get; set; } = null!;

    /// <summary>
    /// Modo de visibilidade do orçamento.
    /// </summary>
    public string VisibilityMode { get; set; } = null!;
}
