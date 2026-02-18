namespace DomusUnify.Api.DTOs.Calendar;

/// <summary>
/// Pedido para atualizar um evento de calendário.
/// </summary>
public sealed class UpdateCalendarEventRequest
{
    /// <summary>
    /// Novo título do evento (opcional).
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Indica se o evento passa a ser de dia inteiro (opcional).
    /// </summary>
    public bool? IsAllDay { get; set; }

    /// <summary>
    /// Novo início (UTC), opcional.
    /// </summary>
    public DateTime? StartUtc { get; set; }

    /// <summary>
    /// Novo fim (UTC), opcional.
    /// </summary>
    public DateTime? EndUtc { get; set; }

    /// <summary>
    /// Quando definido, indica se todos os membros devem ser participantes (opcional).
    /// </summary>
    public bool? ParticipantsAllMembers { get; set; }

    /// <summary>
    /// Lista de participantes (opcional).
    /// </summary>
    public List<Guid>? ParticipantUserIds { get; set; }

    /// <summary>
    /// Quando definido, indica se o evento é visível para todos os membros (opcional).
    /// </summary>
    public bool? VisibleToAllMembers { get; set; }

    /// <summary>
    /// Lista de utilizadores com visibilidade (opcional).
    /// </summary>
    public List<Guid>? VisibleToUserIds { get; set; }

    /// <summary>
    /// Lembretes em minutos antes do início do evento (opcional).
    /// </summary>
    public List<int>? ReminderOffsetsMinutes { get; set; }

    /// <summary>
    /// Nova localização (opcional).
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// Nova nota/descrição (opcional).
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// Nova cor em hexadecimal (opcional).
    /// </summary>
    public string? ColorHex { get; set; }

    /// <summary>
    /// Regra de recorrência (<c>RRULE</c>) do evento pai (opcional).
    /// </summary>
    public string? RecurrenceRule { get; set; }

    /// <summary>
    /// Limite de recorrência por data/hora (UTC), opcional.
    /// </summary>
    public DateTime? RecurrenceUntilUtc { get; set; }

    /// <summary>
    /// Limite de recorrência por número de ocorrências, opcional.
    /// </summary>
    public int? RecurrenceCount { get; set; }

    /// <summary>
    /// Identificador do fuso horário (IANA), opcional.
    /// </summary>
    public string? TimezoneId { get; set; }
}
