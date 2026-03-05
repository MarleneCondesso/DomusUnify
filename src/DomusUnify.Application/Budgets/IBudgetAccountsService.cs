using DomusUnify.Application.FinanceAccounts.Models;

namespace DomusUnify.Application.Budgets;

/// <summary>
/// Serviço para gerir visibilidade (ocultar/mostrar) de contas financeiras por orçamento.
/// </summary>
public interface IBudgetAccountsService
{
    /// <summary>
    /// Obtém as contas visíveis no orçamento.
    /// </summary>
    Task<IReadOnlyList<FinanceAccountModel>> GetVisibleAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);

    /// <summary>
    /// Obtém as contas ocultadas no orçamento.
    /// </summary>
    Task<IReadOnlyList<FinanceAccountModel>> GetHiddenAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);

    /// <summary>
    /// Oculta uma conta no orçamento.
    /// </summary>
    Task HideAsync(Guid userId, Guid familyId, Guid budgetId, Guid accountId, CancellationToken ct);

    /// <summary>
    /// Remove uma conta da lista de ocultas (volta a ficar visível) no orçamento.
    /// </summary>
    Task UnhideAsync(Guid userId, Guid familyId, Guid budgetId, Guid accountId, CancellationToken ct);
}

