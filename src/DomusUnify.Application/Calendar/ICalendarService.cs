using DomusUnify.Application.Calendar.Models;
using DomusUnify.Application.Recurrence;

namespace DomusUnify.Application.Calendar;

/// <summary>
/// Serviço do módulo de calendário (eventos, recorrências, cópias e exportação).
/// </summary>
public interface ICalendarService
{
    /// <summary>
    /// Obtém eventos do calendário visíveis para o utilizador, com filtros opcionais.
    /// </summary>
    /// <remarks>
    /// Pode filtrar por intervalo (<paramref name="fromUtc"/>/<paramref name="toUtc"/>), por dia inteiro (<paramref name="dateUtc"/>),
    /// por texto (<paramref name="search"/>), por participante (<paramref name="participantUserId"/>) e limitar resultados com <paramref name="take"/>.
    /// </remarks>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="fromUtc">Data/hora inicial (UTC), opcional.</param>
    /// <param name="toUtc">Data/hora final (UTC), opcional.</param>
    /// <param name="dateUtc">Data (UTC) para filtrar por dia inteiro, opcional.</param>
    /// <param name="search">Texto a procurar no título, opcional.</param>
    /// <param name="participantUserId">Filtra por participante, opcional.</param>
    /// <param name="take">Número máximo de instâncias a devolver. Se <c>null</c>, devolve todas as instâncias que correspondem aos filtros.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de instâncias de eventos (inclui ocorrências de recorrências).</returns>
    Task<IReadOnlyList<CalendarEventInstanceModel>> GetEventsAsync(
        Guid userId,
        Guid familyId,
        DateTime? fromUtc,
        DateTime? toUtc,
        DateTime? dateUtc,
        string? search,
        Guid? participantUserId,
        int? take,
        CancellationToken ct);

    /// <summary>
    /// Obtém os detalhes de um evento por ID.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="eventId">Identificador do evento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Detalhes do evento.</returns>
    Task<CalendarEventDetailModel> GetEventByIdAsync(
        Guid userId,
        Guid familyId,
        Guid eventId,
        CancellationToken ct);

    /// <summary>
    /// Cria um novo evento.
    /// </summary>
    /// <remarks>
    /// Permite definir participantes, visibilidade, lembretes e regras de recorrência.
    /// </remarks>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="title">Título do evento.</param>
    /// <param name="isAllDay">Indica se é um evento de dia inteiro.</param>
    /// <param name="startUtc">Data/hora de início (UTC).</param>
    /// <param name="endUtc">Data/hora de fim (UTC).</param>
    /// <param name="participantUserIds">Lista de participantes.</param>
    /// <param name="participantsAllMembers">Se <c>true</c>, todos os membros são participantes.</param>
    /// <param name="visibleToUserIds">Lista de utilizadores com visibilidade.</param>
    /// <param name="visibleToAllMembers">Se <c>true</c>, o evento é visível para todos os membros.</param>
    /// <param name="reminderOffsetsMinutes">Offsets de lembrete (minutos) antes do evento.</param>
    /// <param name="location">Localização (opcional).</param>
    /// <param name="note">Nota (opcional).</param>
    /// <param name="colorHex">Cor (HEX) (opcional).</param>
    /// <param name="recurrenceRule">Regra de recorrência (opcional).</param>
    /// <param name="recurrenceUntilUtc">Limite temporal da recorrência (UTC), opcional.</param>
    /// <param name="recurrenceCount">Número máximo de ocorrências, opcional.</param>
    /// <param name="timezoneId">Identificador de fuso horário, opcional.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Evento criado.</returns>
    Task<CalendarEventModel> CreateEventAsync(
        Guid userId,
        Guid familyId,
        string title,
        bool isAllDay,
        DateTime startUtc,
        DateTime endUtc,
        IReadOnlyList<Guid> participantUserIds,
        bool participantsAllMembers,
        IReadOnlyList<Guid> visibleToUserIds,
        bool visibleToAllMembers,
        IReadOnlyList<int> reminderOffsetsMinutes,
        string? location,
        string? note,
        string? colorHex,
        string? recurrenceRule,
        DateTime? recurrenceUntilUtc,
        int? recurrenceCount,
        string? timezoneId,
        CancellationToken ct);


    /// <summary>
    /// Atualiza um evento existente.
    /// </summary>
    /// <remarks>
    /// Aceita alterações parciais (parâmetros opcionais). Para eventos recorrentes, use operações específicas de recorrência.
    /// </remarks>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="eventId">Identificador do evento.</param>
    /// <param name="title">Novo título (opcional).</param>
    /// <param name="isAllDay">Novo valor de dia inteiro (opcional).</param>
    /// <param name="startUtc">Novo início (UTC), opcional.</param>
    /// <param name="endUtc">Novo fim (UTC), opcional.</param>
    /// <param name="participantsAllMembers">Atualiza modo “todos os membros” (opcional).</param>
    /// <param name="participantUserIds">Lista de participantes (opcional).</param>
    /// <param name="visibleToAllMembers">Atualiza visibilidade para todos (opcional).</param>
    /// <param name="visibleToUserIds">Lista de visibilidades (opcional).</param>
    /// <param name="reminderOffsetsMinutes">Offsets de lembrete (opcional).</param>
    /// <param name="location">Localização (opcional).</param>
    /// <param name="note">Nota (opcional).</param>
    /// <param name="colorHex">Cor (HEX) (opcional).</param>
    /// <param name="recurrenceRule">Regra de recorrência (opcional).</param>
    /// <param name="recurrenceUntilUtc">Limite temporal (UTC), opcional.</param>
    /// <param name="recurrenceCount">Número máximo de ocorrências, opcional.</param>
    /// <param name="timezoneId">Identificador de fuso horário, opcional.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Evento atualizado.</returns>
    Task<CalendarEventModel> UpdateEventAsync(
        Guid userId,
        Guid familyId,
        Guid eventId,
        string? title,
        bool? isAllDay,
        DateTime? startUtc,
        DateTime? endUtc,
        bool? participantsAllMembers,
        IReadOnlyList<Guid>? participantUserIds,
        bool? visibleToAllMembers,
        IReadOnlyList<Guid>? visibleToUserIds,
        IReadOnlyList<int>? reminderOffsetsMinutes,
        string? location,
        string? note,
        string? colorHex,
        string? recurrenceRule,
        DateTime? recurrenceUntilUtc,
        int? recurrenceCount,
        string? timezoneId,
        CancellationToken ct);

    /// <summary>
    /// Elimina um evento.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="eventId">Identificador do evento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task DeleteEventAsync(Guid userId, Guid familyId, Guid eventId, CancellationToken ct);

    /// <summary>
    /// Duplica um evento com novas datas (início/fim).
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="eventId">Identificador do evento.</param>
    /// <param name="newStartUtc">Novo início (UTC).</param>
    /// <param name="newEndUtc">Novo fim (UTC).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Evento duplicado.</returns>
    Task<CalendarEventModel> DuplicateEventAsync(
        Guid userId, Guid familyId, Guid eventId, DateTime newStartUtc, DateTime newEndUtc, CancellationToken ct);

    /// <summary>
    /// Copia um evento para várias datas (UTC).
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="eventId">Identificador do evento.</param>
    /// <param name="datesUtc">Datas (UTC) para onde copiar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de eventos criados.</returns>
    Task<IReadOnlyList<CalendarEventModel>> CopyEventToDatesAsync(
        Guid userId, Guid familyId, Guid eventId, IReadOnlyList<DateOnly> datesUtc, CancellationToken ct);

    /// <summary>
    /// Atualiza um evento recorrente, podendo atuar na série ou numa ocorrência.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="eventId">Identificador do evento recorrente.</param>
    /// <param name="scope">Âmbito da edição (série/ocorrência).</param>
    /// <param name="occurrenceStartUtc">Início (UTC) da ocorrência alvo, quando aplicável.</param>
    /// <param name="title">Novo título (opcional).</param>
    /// <param name="isAllDay">Novo valor de dia inteiro (opcional).</param>
    /// <param name="newStartUtc">Novo início (UTC), opcional.</param>
    /// <param name="newEndUtc">Novo fim (UTC), opcional.</param>
    /// <param name="cancelThisOccurrence">Cancela a ocorrência, opcional.</param>
    /// <param name="participantsAllMembers">Atualiza modo “todos os membros” (opcional).</param>
    /// <param name="participantUserIds">Lista de participantes (opcional).</param>
    /// <param name="visibleToAllMembers">Atualiza visibilidade para todos (opcional).</param>
    /// <param name="visibleToUserIds">Lista de visibilidades (opcional).</param>
    /// <param name="reminderOffsetsMinutes">Offsets de lembrete (opcional).</param>
    /// <param name="location">Localização (opcional).</param>
    /// <param name="note">Nota (opcional).</param>
    /// <param name="colorHex">Cor (HEX) (opcional).</param>
    /// <param name="timezoneId">Identificador de fuso horário (opcional).</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task UpdateRecurringEventAsync(
        Guid userId,
        Guid familyId,
        Guid eventId,
        CalendarEditScope scope,
        DateTime? occurrenceStartUtc,
        string? title,
        bool? isAllDay,
        DateTime? newStartUtc,
        DateTime? newEndUtc,
        bool? cancelThisOccurrence,
        bool? participantsAllMembers,
        IReadOnlyList<Guid>? participantUserIds,
        bool? visibleToAllMembers,
        IReadOnlyList<Guid>? visibleToUserIds,
        IReadOnlyList<int>? reminderOffsetsMinutes,
        string? location,
        string? note,
        string? colorHex,
        string? timezoneId,
        CancellationToken ct);

    /// <summary>
    /// Obtém o modelo de exportação (ex.: para ICS) de um evento.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="eventId">Identificador do evento.</param>
    /// <param name="occurrenceStartUtc">Início (UTC) da ocorrência a exportar (opcional).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Modelo de exportação do evento.</returns>
    Task<CalendarEventExportModel> GetEventExportAsync(
        Guid userId,
        Guid familyId,
        Guid eventId,
        DateTime? occurrenceStartUtc,
        CancellationToken ct);

}
