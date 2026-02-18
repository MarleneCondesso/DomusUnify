namespace DomusUnify.Application.Calendar.Models;

/// <summary>
/// Modelo com informação de um evento de calendário (base).
/// </summary>
/// <param name="Id">Identificador do evento.</param>
/// <param name="FamilyId">Identificador da família do evento.</param>
/// <param name="Title">Título do evento.</param>
/// <param name="IsAllDay">Indica se o evento é de dia inteiro.</param>
/// <param name="StartUtc">Data/hora de início (UTC).</param>
/// <param name="EndUtc">Data/hora de fim (UTC).</param>
/// <param name="Location">Localização (opcional).</param>
/// <param name="Note">Nota/descrição (opcional).</param>
/// <param name="ColorHex">Cor em hexadecimal (opcional).</param>
/// <param name="RecurrenceRule">Regra de recorrência (<c>RRULE</c>) do evento, se aplicável.</param>
/// <param name="RecurrenceUntilUtc">Limite de recorrência por data/hora (UTC), opcional.</param>
/// <param name="RecurrenceCount">Limite de recorrência por número de ocorrências, opcional.</param>
/// <param name="TimezoneId">Identificador do fuso horário (IANA), opcional.</param>
/// <param name="CreatedByUserId">Identificador do utilizador criador.</param>
/// <param name="CreatedAtUtc">Data/hora de criação (UTC).</param>
/// <param name="UpdatedAtUtc">Data/hora da última atualização (UTC), se existir.</param>
/// <param name="ParticipantUserIds">Lista de utilizadores participantes.</param>
/// <param name="VisibleToUserIds">Lista de utilizadores com visibilidade.</param>
/// <param name="ReminderOffsetsMinutes">Lembretes em minutos antes do início.</param>
public sealed record CalendarEventModel(
    Guid Id,
    Guid FamilyId,
    string Title,
    bool IsAllDay,
    DateTime StartUtc,
    DateTime EndUtc,
    string? Location,
    string? Note,
    string? ColorHex,
    string? RecurrenceRule,
    DateTime? RecurrenceUntilUtc,
    int? RecurrenceCount,
    string? TimezoneId,
    Guid CreatedByUserId,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    IReadOnlyList<Guid> ParticipantUserIds,
    IReadOnlyList<Guid> VisibleToUserIds,
    IReadOnlyList<int> ReminderOffsetsMinutes
);
