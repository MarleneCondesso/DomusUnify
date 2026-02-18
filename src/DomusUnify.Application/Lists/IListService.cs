using DomusUnify.Application.Lists.Models;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Application.Lists;

/// <summary>
/// Serviço de listas partilhadas (ex.: compras/tarefas) e respetivos itens.
/// </summary>
public interface IListService
{
    /// <summary>
    /// Obtém as listas da família.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de listas com contagens.</returns>
    Task<IReadOnlyList<ListSummary>> GetListsAsync(Guid userId, Guid familyId, CancellationToken ct);

    /// <summary>
    /// Cria uma nova lista.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="name">Nome da lista.</param>
    /// <param name="colorHex">Cor em formato HEX.</param>
    /// <param name="type">Tipo da lista (ex.: <c>Shopping</c>, <c>Tasks</c>).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Resumo da lista criada.</returns>
    Task<ListSummary> CreateListAsync(Guid userId, Guid familyId, string name, string colorHex, string type, CancellationToken ct);

    /// <summary>
    /// Atualiza uma lista existente.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="listId">Identificador da lista.</param>
    /// <param name="newName">Novo nome.</param>
    /// <param name="colorHex">Nova cor (HEX).</param>
    /// <param name="type">Novo tipo.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task UpdateListAsync(Guid userId, Guid familyId, Guid listId, string newName, string colorHex, string type, CancellationToken ct);

    /// <summary>
    /// Elimina uma lista.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="listId">Identificador da lista.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task DeleteListAsync(Guid userId, Guid familyId, Guid listId, CancellationToken ct);

    /// <summary>
    /// Obtém os itens de uma lista.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="listId">Identificador da lista.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de itens.</returns>
    Task<IReadOnlyList<ListItemModel>> GetItemsAsync(Guid userId, Guid familyId, Guid listId, CancellationToken ct);

    /// <summary>
    /// Adiciona um item a uma lista.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="listId">Identificador da lista.</param>
    /// <param name="name">Nome do item.</param>
    /// <param name="categoryId">Categoria opcional.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>O item criado.</returns>
    Task<ListItemModel> AddItemAsync(Guid userId, Guid familyId, Guid listId, string name, Guid? categoryId, CancellationToken ct);

    /// <summary>
    /// Atualiza um item existente.
    /// </summary>
    /// <remarks>
    /// Para alterar/remover categoria, usa <paramref name="categoryChangeRequested"/> e <paramref name="categoryId"/>.
    /// </remarks>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="itemId">Identificador do item.</param>
    /// <param name="name">Novo nome (opcional).</param>
    /// <param name="isCompleted">Novo estado de conclusão (opcional).</param>
    /// <param name="categoryChangeRequested">Indica se existe pedido explícito de alteração de categoria.</param>
    /// <param name="categoryId">Nova categoria; <c>null</c> remove a categoria.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task UpdateItemAsync(
        Guid userId,
        Guid familyId,
        Guid itemId,
        string? name,
        bool? isCompleted,
        bool categoryChangeRequested,
        Guid? categoryId,
        CancellationToken ct);

    /// <summary>
    /// Elimina um item de lista.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="itemId">Identificador do item.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task DeleteItemAsync(Guid userId, Guid familyId, Guid itemId, CancellationToken ct);
}
