using DomusUnify.Application.FinanceAccounts.Models;

namespace DomusUnify.Application.FinanceAccounts;

/// <summary>
/// Serviço de contas financeiras por família.
/// </summary>
public interface IFinanceAccountService
{
    /// <summary>
    /// Garante que existem contas por defeito para a família (idempotente).
    /// </summary>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task EnsureDefaultsAsync(Guid familyId, CancellationToken ct);

    /// <summary>
    /// Obtém as contas financeiras da família.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de contas financeiras.</returns>
    Task<IReadOnlyList<FinanceAccountModel>> GetAsync(
        Guid userId,
        Guid familyId,
        CancellationToken ct);

    /// <summary>
    /// Cria uma nova conta financeira.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="type">Tipo de conta (ex.: <c>Checking</c>, <c>Cash</c>).</param>
    /// <param name="name">Nome da conta.</param>
    /// <param name="iconKey">Chave do ícone.</param>
    /// <param name="sortOrder">Ordem de apresentação.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A conta criada.</returns>
    Task<FinanceAccountModel> CreateAsync(
        Guid userId,
        Guid familyId,
        string type,
        string name,
        string iconKey,
        int sortOrder,
        CancellationToken ct);

    /// <summary>
    /// Atualiza uma conta financeira existente.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="accountId">Identificador da conta.</param>
    /// <param name="name">Novo nome (opcional).</param>
    /// <param name="iconKey">Nova chave do ícone (opcional).</param>
    /// <param name="sortOrder">Nova ordem (opcional).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A conta atualizada.</returns>
    Task<FinanceAccountModel> UpdateAsync(
        Guid userId,
        Guid familyId,
        Guid accountId,
        string? name,
        string? iconKey,
        int? sortOrder,
        CancellationToken ct);

    /// <summary>
    /// Elimina uma conta financeira.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="accountId">Identificador da conta.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task DeleteAsync(Guid userId, Guid familyId, Guid accountId, CancellationToken ct);
}
