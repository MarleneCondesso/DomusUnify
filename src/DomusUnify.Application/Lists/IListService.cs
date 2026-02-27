using DomusUnify.Application.Lists.Models;

namespace DomusUnify.Application.Lists;

/// <summary>
/// Serviço de listas partilhadas (ex.: compras/tarefas) e respetivos itens.
/// </summary>
public interface IListService
{
    /// <summary>
    /// Obtém as listas visíveis para o utilizador na família.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de listas com contagens e informação de partilha.</returns>
    Task<IReadOnlyList<ListSummary>> GetListsAsync(Guid userId, Guid familyId, CancellationToken ct);

    /// <summary>
    /// Cria uma nova lista.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="input">Dados para criação da lista (inclui visibilidade e membros, quando aplicável).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Resumo da lista criada.</returns>
    Task<ListSummary> CreateListAsync(Guid userId, Guid familyId, ListCreateInput input, CancellationToken ct);

    /// <summary>
    /// Regenera as capas (imagens) das listas visíveis ao utilizador na família atual.
    /// </summary>
    /// <remarks>
    /// Útil quando a API de stock images foi configurada depois de já existirem listas (capas antigas em SVG).
    /// </remarks>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Número de listas atualizadas.</returns>
    Task<int> RegenerateListCoversAsync(Guid userId, Guid familyId, CancellationToken ct);

    /// <summary>
    /// Atualiza uma lista existente.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="listId">Identificador da lista.</param>
    /// <param name="input">Dados de atualização (inclui visibilidade e membros, quando aplicável).</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task UpdateListAsync(Guid userId, Guid familyId, Guid listId, ListUpdateInput input, CancellationToken ct);

    /// <summary>
    /// Elimina uma lista existente.
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
    /// <param name="assigneeUserId">Utilizador a quem o item fica atribuÃ­do (opcional).</param>
    /// <param name="note">Nota opcional.</param>
    /// <param name="photoUrl">URL (ou data URL) de uma foto opcional.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>O item criado.</returns>
    Task<ListItemModel> AddItemAsync(
        Guid userId,
        Guid familyId,
        Guid listId,
        string name,
        Guid? categoryId,
        Guid? assigneeUserId,
        string? note,
        string? photoUrl,
        CancellationToken ct);

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
    /// <param name="assigneeChangeRequested">Indica se existe pedido explÃ­cito de alteraÃ§Ã£o do atribuÃ­do.</param>
    /// <param name="assigneeUserId">Novo atribuÃ­do; <c>null</c> remove a atribuiÃ§Ã£o.</param>
    /// <param name="noteChangeRequested">Indica se existe pedido explÃ­cito de alteraÃ§Ã£o/limpeza da nota.</param>
    /// <param name="note">Nova nota; <c>null</c> remove a nota.</param>
    /// <param name="photoChangeRequested">Indica se existe pedido explÃ­cito de alteraÃ§Ã£o/limpeza da foto.</param>
    /// <param name="photoUrl">Nova foto (URL ou data URL); <c>null</c> remove a foto.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task UpdateItemAsync(
        Guid userId,
        Guid familyId,
        Guid itemId,
        string? name,
        bool? isCompleted,
        bool categoryChangeRequested,
        Guid? categoryId,
        bool assigneeChangeRequested,
        Guid? assigneeUserId,
        bool noteChangeRequested,
        string? note,
        bool photoChangeRequested,
        string? photoUrl,
        CancellationToken ct);

    /// <summary>
    /// Elimina um item de lista existente.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="itemId">Identificador do item.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task DeleteItemAsync(Guid userId, Guid familyId, Guid itemId, CancellationToken ct);
}
