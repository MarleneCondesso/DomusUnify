namespace DomusUnify.Api.DTOs.Budgets;

/// <summary>
/// Resposta com o detalhe completo de um orçamento.
/// </summary>
public sealed class BudgetDetailResponse
{
    /// <summary>
    /// Identificador do orçamento.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador da família proprietária do orçamento.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Identificador do utilizador proprietário (criador) do orçamento.
    /// </summary>
    public Guid OwnerUserId { get; set; }

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
    /// Período do orçamento (apenas para orçamento recorrente).
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
    /// Padrão semi-mensal (apenas quando <see cref="PeriodType"/> é <c>SemiMonthly</c>).
    /// </summary>
    public string? SemiMonthlyPattern { get; set; }

    /// <summary>
    /// Limite global de gastos do orçamento (opcional).
    /// </summary>
    public decimal? SpendingLimit { get; set; }

    /// <summary>
    /// Código ISO da moeda do orçamento (ex.: <c>EUR</c>).
    /// </summary>
    public string CurrencyCode { get; set; } = null!;

    /// <summary>
    /// Modo de visibilidade do orçamento (<c>Private</c>, <c>AllMembers</c> ou <c>SpecificMembers</c>).
    /// </summary>
    public string VisibilityMode { get; set; } = null!;

    /// <summary>
    /// Lista de utilizadores com acesso quando a visibilidade é <c>SpecificMembers</c>.
    /// </summary>
    public List<Guid> AllowedUserIds { get; set; } = new();

    /// <summary>
    /// Indicador principal a apresentar no topo do orçamento.
    /// </summary>
    public string MainIndicator { get; set; } = null!;

    /// <summary>
    /// Quando <see langword="true"/>, apenas transações marcadas como pagas entram nos totais.
    /// </summary>
    public bool OnlyPaidInTotals { get; set; }

    /// <summary>
    /// Ordenação da lista de transações (<c>MostRecentFirst</c> ou <c>OldestFirst</c>).
    /// </summary>
    public string TransactionOrder { get; set; } = null!;

    /// <summary>
    /// Forma de apresentação das próximas transações (<c>Expanded</c> ou <c>Collapsed</c>).
    /// </summary>
    public string UpcomingDisplayMode { get; set; } = null!;
}
