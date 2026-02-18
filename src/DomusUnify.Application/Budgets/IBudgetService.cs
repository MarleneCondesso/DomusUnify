using DomusUnify.Application.Budgets.Models;

namespace DomusUnify.Application.Budgets;

/// <summary>
/// Serviço de orçamentos (criação, atualização, acesso e configuração).
/// </summary>
public interface IBudgetService
{
    /// <summary>
    /// Obtém os orçamentos a que o utilizador tem acesso numa família.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de orçamentos visíveis para o utilizador.</returns>
    Task<IReadOnlyList<BudgetSummaryModel>> GetAsync(Guid userId, Guid familyId, CancellationToken ct);

    /// <summary>
    /// Obtém o detalhe de um orçamento.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Detalhes do orçamento.</returns>
    Task<BudgetDetailModel> GetByIdAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);

    /// <summary>
    /// Cria um novo orçamento.
    /// </summary>
    /// <remarks>
    /// Deve validar permissões e regras de negócio (ex.: recorrente requer período e data de início).
    /// </remarks>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="input">Dados de criação.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Detalhes do orçamento criado.</returns>
    Task<BudgetDetailModel> CreateAsync(Guid userId, Guid familyId, BudgetCreateInput input, CancellationToken ct);

    /// <summary>
    /// Atualiza um orçamento existente.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="input">Dados a atualizar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Detalhes do orçamento após atualização.</returns>
    Task<BudgetDetailModel> UpdateAsync(Guid userId, Guid familyId, Guid budgetId, BudgetUpdateInput input, CancellationToken ct);

    /// <summary>
    /// Elimina um orçamento.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task DeleteAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);

    /// <summary>
    /// Obtém os membros associados ao orçamento (consoante a visibilidade).
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de membros relevantes para o orçamento.</returns>
    Task<IReadOnlyList<BudgetMemberModel>> GetMembersAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);

    /// <summary>
    /// Obtém os limites por categoria (despesas) do orçamento.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de limites por categoria.</returns>
    Task<IReadOnlyList<BudgetCategoryLimitModel>> GetCategoryLimitsAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);

    /// <summary>
    /// Atualiza os limites por categoria (despesas) do orçamento.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="limits">Lista de limites a aplicar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task UpdateCategoryLimitsAsync(Guid userId, Guid familyId, Guid budgetId, IReadOnlyList<BudgetCategoryLimitInput> limits, CancellationToken ct);
}
