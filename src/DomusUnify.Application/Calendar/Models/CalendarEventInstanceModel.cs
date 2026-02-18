namespace DomusUnify.Application.Calendar.Models;

/// <summary>
/// Modelo que representa uma ocorrência "renderizada" de um evento (inclui recorrência e exceções).
/// </summary>
/// <param name="EventId">Identificador do evento pai (ou evento único).</param>
/// <param name="ExceptionEventId">Identificador do evento de exceção, se a ocorrência vier de uma exceção.</param>
/// <param name="OccurrenceStartUtc">Início da ocorrência (UTC).</param>
/// <param name="OccurrenceEndUtc">Fim da ocorrência (UTC).</param>
/// <param name="Title">Título da ocorrência.</param>
/// <param name="IsAllDay">Indica se a ocorrência é de dia inteiro.</param>
/// <param name="Location">Localização (opcional).</param>
/// <param name="Note">Nota/descrição (opcional).</param>
/// <param name="ColorHex">Cor em hexadecimal (opcional).</param>
/// <param name="TimezoneId">Identificador do fuso horário (IANA), opcional.</param>
/// <param name="FamilyId">Identificador da família do evento.</param>
/// <param name="CreatedByUserId">Identificador do utilizador criador.</param>
/// <param name="CreatedAtUtc">Data/hora de criação (UTC).</param>
/// <param name="UpdatedAtUtc">Data/hora da última atualização (UTC), se existir.</param>
/// <param name="ParticipantUserIds">Participantes da ocorrência.</param>
/// <param name="VisibleToUserIds">Utilizadores com visibilidade.</param>
/// <param name="ReminderOffsetsMinutes">Lembretes em minutos antes do início.</param>
/// <param name="IsCancelled">Indica se a ocorrência está cancelada.</param>
public sealed record CalendarEventInstanceModel(
    Guid EventId,                 // evento pai ou evento único
    Guid? ExceptionEventId,       // se for exceção
    DateTime OccurrenceStartUtc,
    DateTime OccurrenceEndUtc,

    // dados “renderizáveis”
    string Title,
    bool IsAllDay,
    string? Location,
    string? Note,
    string? ColorHex,
    string? TimezoneId,

    Guid FamilyId,

    Guid CreatedByUserId,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,

    IReadOnlyList<Guid> ParticipantUserIds,
    IReadOnlyList<Guid> VisibleToUserIds,
    IReadOnlyList<int> ReminderOffsetsMinutes,

    bool IsCancelled
);
