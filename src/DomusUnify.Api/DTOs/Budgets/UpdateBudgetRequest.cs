namespace DomusUnify.Api.DTOs.Budgets;

/// <summary>
/// Pedido para atualizar propriedades de um orçamento.
/// </summary>
public sealed class UpdateBudgetRequest
{
    /// <summary>
    /// Novo nome do orçamento (opcional).
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Nova chave do ícone do orçamento (opcional).
    /// </summary>
    public string? IconKey { get; set; }

    /// <summary>
    /// Novo período do orçamento recorrente (opcional).
    /// </summary>
    public string? PeriodType { get; set; }

    /// <summary>
    /// Nova data de início (opcional).
    /// </summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// Nova data de fim (opcional).
    /// </summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>
    /// Novo padrão semi-mensal (opcional).
    /// </summary>
    public string? SemiMonthlyPattern { get; set; }

    /// <summary>
    /// Novo limite global de gastos (opcional).
    /// </summary>
    public decimal? SpendingLimit { get; set; }

    /// <summary>
    /// Indica explicitamente que o limite deve ser limpo/alterado, mesmo que o valor seja <see langword="null"/>.
    /// </summary>
    public bool SpendingLimitChangeRequested { get; set; } = false;

    /// <summary>
    /// Novo código ISO da moeda do orçamento (opcional).
    /// </summary>
    public string? CurrencyCode { get; set; }

    /// <summary>
    /// Novo modo de visibilidade (opcional).
    /// </summary>
    public string? VisibilityMode { get; set; }

    /// <summary>
    /// Lista de utilizadores com acesso, quando aplicável (opcional).
    /// </summary>
    public List<Guid>? AllowedUserIds { get; set; }

    /// <summary>
    /// Novo indicador principal (opcional).
    /// </summary>
    public string? MainIndicator { get; set; }

    /// <summary>
    /// Indica se apenas transações pagas entram nos totais (opcional).
    /// </summary>
    public bool? OnlyPaidInTotals { get; set; }

    /// <summary>
    /// Nova ordenação da lista de transações (opcional).
    /// </summary>
    public string? TransactionOrder { get; set; }

    /// <summary>
    /// Nova forma de apresentação das próximas transações (opcional).
    /// </summary>
    public string? UpcomingDisplayMode { get; set; }
}
