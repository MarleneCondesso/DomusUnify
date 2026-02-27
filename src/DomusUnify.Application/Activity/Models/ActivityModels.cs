namespace DomusUnify.Application.Activity.Models;

/// <summary>
/// Pedido interno para registar uma entrada de atividade.
/// </summary>
/// <param name="Kind">Tipo/identificador da atividade (ex.: <c>lists:item_added</c>).</param>
/// <param name="Message">Mensagem legível para UI (sem incluir o nome do ator).</param>
/// <param name="ListId">Identificador da lista associada (opcional).</param>
/// <param name="EntityId">Identificador de entidade relacionada (opcional).</param>
public sealed record ActivityLogInput(
    string Kind,
    string Message,
    Guid? ListId = null,
    Guid? EntityId = null);

/// <summary>
/// Modelo de entrada de atividade (feed).
/// </summary>
/// <param name="Id">Identificador da entrada.</param>
/// <param name="Kind">Tipo/identificador da atividade.</param>
/// <param name="Message">Mensagem legível.</param>
/// <param name="ActorUserId">Identificador do utilizador que executou a ação.</param>
/// <param name="ActorName">Nome do utilizador que executou a ação.</param>
/// <param name="CreatedAtUtc">Data/hora (UTC) da entrada.</param>
/// <param name="ListId">Identificador da lista associada (opcional).</param>
/// <param name="EntityId">Identificador de entidade relacionada (opcional).</param>
public sealed record ActivityEntryModel(
    Guid Id,
    string Kind,
    string Message,
    Guid ActorUserId,
    string ActorName,
    DateTime CreatedAtUtc,
    Guid? ListId,
    Guid? EntityId);

