namespace DomusUnify.Api.DTOs.Budgets;

/// <summary>
/// Pedido para criar um novo orçamento.
/// </summary>
public sealed class CreateBudgetRequest
{
    /// <summary>
    /// Nome do orçamento.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Chave do ícone do orçamento.
    /// </summary>
    public string IconKey { get; set; } = "wallet";

    /// <summary>
    /// Tipo do orçamento (<c>Recurring</c> ou <c>OneTime</c>).
    /// </summary>
    public string Type { get; set; } = "Recurring";

    /// <summary>
    /// Período do orçamento recorrente (<c>Monthly</c>, <c>Weekly</c>, <c>BiWeekly</c>, <c>SemiMonthly</c> ou <c>Yearly</c>).
    /// </summary>
    public string? PeriodType { get; set; }

    /// <summary>
    /// Data de início do orçamento (para orçamento único) ou data de início de referência (para recorrente).
    /// </summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// Data de fim do orçamento (apenas para orçamento único).
    /// </summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>
    /// Padrão semi-mensal (<c>FirstAndFifteenth</c> ou <c>FifteenthAndLastDay</c>).
    /// </summary>
    public string? SemiMonthlyPattern { get; set; } // FirstAndFifteenth | FifteenthAndLastDay

    /// <summary>
    /// Limite global de gastos do orçamento (opcional).
    /// </summary>
    public decimal? SpendingLimit { get; set; }

    /// <summary>
    /// Código ISO da moeda do orçamento (ex.: <c>EUR</c>).
    /// </summary>
    public string CurrencyCode { get; set; } = "EUR";

    /// <summary>
    /// Modo de visibilidade do orçamento (<c>Private</c>, <c>AllMembers</c> ou <c>SpecificMembers</c>).
    /// </summary>
    public string VisibilityMode { get; set; } = "AllMembers";

    /// <summary>
    /// Lista de utilizadores com acesso quando a visibilidade é <c>SpecificMembers</c>.
    /// </summary>
    public List<Guid>? AllowedUserIds { get; set; }

    /// <summary>
    /// Indicador principal a apresentar no topo do orçamento (<c>TotalIncome</c>, <c>TotalExpenses</c>, <c>Balance</c> ou <c>BalanceToday</c>).
    /// </summary>
    public string? MainIndicator { get; set; } // TotalIncome | TotalExpenses | Balance | BalanceToday

    /// <summary>
    /// Quando <see langword="true"/>, apenas transações marcadas como pagas entram nos totais.
    /// </summary>
    public bool? OnlyPaidInTotals { get; set; }

    /// <summary>
    /// Ordenação da lista de transações (<c>MostRecentFirst</c> ou <c>OldestFirst</c>).
    /// </summary>
    public string? TransactionOrder { get; set; } // MostRecentFirst | OldestFirst

    /// <summary>
    /// Forma de apresentação das próximas transações (<c>Expanded</c> ou <c>Collapsed</c>).
    /// </summary>
    public string? UpcomingDisplayMode { get; set; } // Expanded | Collapsed

    /// <summary>
    /// Limites por categoria (despesas) a aplicar no orçamento (opcional).
    /// </summary>
    public List<BudgetCategoryLimitRequest>? CategoryLimits { get; set; }
}
