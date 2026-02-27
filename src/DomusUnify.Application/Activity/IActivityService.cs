using DomusUnify.Application.Activity.Models;

namespace DomusUnify.Application.Activity;

/// <summary>
/// Serviço de feed de atividade (recent updates).
/// </summary>
public interface IActivityService
{
    /// <summary>
    /// Regista uma entrada de atividade na família.
    /// </summary>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="actorUserId">Identificador do utilizador que executou a ação.</param>
    /// <param name="input">Dados da entrada.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task LogAsync(Guid familyId, Guid actorUserId, ActivityLogInput input, CancellationToken ct);

    /// <summary>
    /// Obtém as entradas mais recentes do feed, visíveis para o utilizador.
    /// </summary>
    /// <param name="userId">Utilizador autenticado.</param>
    /// <param name="familyId">Família.</param>
    /// <param name="take">Número de registos a devolver.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de entradas.</returns>
    Task<IReadOnlyList<ActivityEntryModel>> GetRecentAsync(Guid userId, Guid familyId, int take, CancellationToken ct);

    /// <summary>
    /// Obtém entradas do feed (paginado), visíveis para o utilizador.
    /// </summary>
    /// <param name="userId">Utilizador autenticado.</param>
    /// <param name="familyId">Família.</param>
    /// <param name="skip">Número de registos a saltar.</param>
    /// <param name="take">Número de registos a devolver.</param>
    /// <param name="type">
    /// Filtro opcional por tipo/área.
    /// Valores suportados: <c>lists</c>, <c>budget</c>, <c>calendar</c>.
    /// </param>
    /// <param name="fromUtc">Filtro opcional por data/hora inicial (UTC).</param>
    /// <param name="toUtc">Filtro opcional por data/hora final (UTC, exclusivo).</param>
    /// <param name="dateUtc">Filtro opcional por dia inteiro (UTC). Não pode ser usado em conjunto com <paramref name="fromUtc"/>/<paramref name="toUtc"/>.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de entradas.</returns>
    Task<IReadOnlyList<ActivityEntryModel>> GetAsync(
        Guid userId,
        Guid familyId,
        int skip,
        int take,
        string? type,
        DateTime? fromUtc,
        DateTime? toUtc,
        DateOnly? dateUtc,
        CancellationToken ct);
}
