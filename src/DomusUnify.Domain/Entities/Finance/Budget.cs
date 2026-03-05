using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa um orçamento financeiro dentro de uma família.
/// </summary>
public sealed class Budget : BaseEntity
{
    /// <summary>
    /// Identificador da família proprietária do orçamento.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Família associada.
    /// </summary>
    public Family Family { get; set; } = null!;

    /// <summary>
    /// Identificador do utilizador proprietário (criador).
    /// </summary>
    public Guid OwnerUserId { get; set; }

    /// <summary>
    /// Utilizador proprietário (criador).
    /// </summary>
    public User OwnerUser { get; set; } = null!;

    /// <summary>
    /// Nome do orçamento.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Chave do ícone do orçamento.
    /// </summary>
    public string IconKey { get; set; } = "wallet";

    /// <summary>
    /// Tipo do orçamento (recorrente ou único).
    /// </summary>
    public BudgetType Type { get; set; } = BudgetType.Recurring;

    /// <summary>
    /// Período do orçamento recorrente (apenas quando <see cref="Type"/> é recorrente).
    /// </summary>
    public BudgetPeriodType? PeriodType { get; set; }

    /// <summary>
    /// Data de início (para orçamento único) ou referência de início (para recorrente).
    /// </summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// Padrão semi-mensal, quando aplicável.
    /// </summary>
    public BudgetSemiMonthlyPattern? SemiMonthlyPattern { get; set; }

    /// <summary>
    /// Data de fim (apenas para orçamento único).
    /// </summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>
    /// Limite global de gastos do orçamento (opcional).
    /// </summary>
    public decimal? SpendingLimit { get; set; }

    /// <summary>
    /// Código ISO da moeda do orçamento (ex.: <c>EUR</c>).
    /// </summary>
    public string CurrencyCode { get; set; } = "EUR";

    /// <summary>
    /// Indicador principal a apresentar no topo do orçamento.
    /// </summary>
    public BudgetMainIndicator MainIndicator { get; set; } = BudgetMainIndicator.Balance;

    /// <summary>
    /// Quando <see langword="true"/>, apenas transações marcadas como pagas entram nos totais.
    /// </summary>
    public bool OnlyPaidInTotals { get; set; } = false;

    /// <summary>
    /// Ordenação da lista de transações.
    /// </summary>
    public BudgetTransactionOrder TransactionOrder { get; set; } = BudgetTransactionOrder.MostRecentFirst;

    /// <summary>
    /// Modo de apresentação das próximas transações.
    /// </summary>
    public BudgetUpcomingDisplayMode UpcomingDisplayMode { get; set; } = BudgetUpcomingDisplayMode.Expanded;

    /// <summary>
    /// Modo de visibilidade do orçamento dentro da família.
    /// </summary>
    public BudgetVisibilityMode VisibilityMode { get; set; } = BudgetVisibilityMode.AllMembers;

    /// <summary>
    /// Lista de utilizadores com acesso explícito quando a visibilidade é por membros específicos.
    /// </summary>
    public ICollection<BudgetUserAccess> AllowedUsers { get; set; } = new List<BudgetUserAccess>();

    /// <summary>
    /// Limites por categoria (despesas) do orçamento.
    /// </summary>
    public ICollection<BudgetCategoryLimit> CategoryLimits { get; set; } = new List<BudgetCategoryLimit>();

    /// <summary>
    /// Contas financeiras ocultadas neste orçamento.
    /// </summary>
    public ICollection<BudgetHiddenFinanceAccount> HiddenFinanceAccounts { get; set; } = new List<BudgetHiddenFinanceAccount>();

    /// <summary>
    /// Transações associadas ao orçamento.
    /// </summary>
    public ICollection<FinanceTransaction> Transactions { get; set; } = new List<FinanceTransaction>();

    /// <summary>
    /// Preferências por utilizador no contexto do orçamento (notificações, etc.).
    /// </summary>
    public ICollection<BudgetUserSettings> UserSettings { get; set; } = new List<BudgetUserSettings>();
}
