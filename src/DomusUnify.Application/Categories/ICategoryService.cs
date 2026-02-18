using DomusUnify.Application.Categories.Models;

namespace DomusUnify.Application.Categories;

/// <summary>
/// Serviço de categorias de itens (listas) por família.
/// </summary>
public interface ICategoryService
{
    /// <summary>
    /// Obtém as categorias de itens da família.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de categorias de itens.</returns>
    Task<IReadOnlyList<CategoryModel>> GetItemCategoriesAsync(Guid userId, Guid familyId, CancellationToken ct);

    /// <summary>
    /// Cria uma nova categoria de itens.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="name">Nome da categoria.</param>
    /// <param name="iconKey">Chave do ícone.</param>
    /// <param name="sortOrder">Ordem de apresentação.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A categoria criada.</returns>
    Task<CategoryModel> CreateItemCategoryAsync(Guid userId, Guid familyId, string name, string iconKey, int sortOrder, CancellationToken ct);

    /// <summary>
    /// Atualiza uma categoria de itens existente.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="categoryId">Identificador da categoria.</param>
    /// <param name="name">Novo nome (opcional).</param>
    /// <param name="iconKey">Nova chave do ícone (opcional).</param>
    /// <param name="sortOrder">Nova ordem (opcional).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A categoria atualizada.</returns>
    Task<CategoryModel> UpdateItemCategoryAsync(Guid userId, Guid familyId, Guid categoryId, string? name, string? iconKey, int? sortOrder, CancellationToken ct);

    /// <summary>
    /// Elimina uma categoria de itens.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="categoryId">Identificador da categoria.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task DeleteItemCategoryAsync(Guid userId, Guid familyId, Guid categoryId, CancellationToken ct);
}
