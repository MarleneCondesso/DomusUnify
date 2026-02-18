using DomusUnify.Application.FinanceCategories.Models;

namespace DomusUnify.Application.FinanceCategories;

/// <summary>
/// Serviço de categorias financeiras (despesas e rendimentos) por família.
/// </summary>
public interface IFinanceCategoryService
{
    /// <summary>
    /// Garante que existem categorias por defeito para a família (idempotente).
    /// </summary>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task EnsureDefaultsAsync(Guid familyId, CancellationToken ct);

    /// <summary>
    /// Obtém as categorias financeiras da família, com filtro opcional por tipo.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="type">Tipo opcional: <c>Expense</c> ou <c>Income</c>.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de categorias financeiras.</returns>
    Task<IReadOnlyList<FinanceCategoryModel>> GetAsync(
        Guid userId,
        Guid familyId,
        string? type,
        CancellationToken ct);

    /// <summary>
    /// Cria uma nova categoria financeira.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="type">Tipo: <c>Expense</c> ou <c>Income</c>.</param>
    /// <param name="name">Nome da categoria.</param>
    /// <param name="iconKey">Chave do ícone.</param>
    /// <param name="sortOrder">Ordem de apresentação.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A categoria criada.</returns>
    Task<FinanceCategoryModel> CreateAsync(
        Guid userId,
        Guid familyId,
        string type,
        string name,
        string iconKey,
        int sortOrder,
        CancellationToken ct);

    /// <summary>
    /// Atualiza uma categoria financeira existente.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="categoryId">Identificador da categoria.</param>
    /// <param name="name">Novo nome (opcional).</param>
    /// <param name="iconKey">Nova chave do ícone (opcional).</param>
    /// <param name="sortOrder">Nova ordem (opcional).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A categoria atualizada.</returns>
    Task<FinanceCategoryModel> UpdateAsync(
        Guid userId,
        Guid familyId,
        Guid categoryId,
        string? name,
        string? iconKey,
        int? sortOrder,
        CancellationToken ct);

    /// <summary>
    /// Elimina uma categoria financeira.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="categoryId">Identificador da categoria.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task DeleteAsync(Guid userId, Guid familyId, Guid categoryId, CancellationToken ct);
}
