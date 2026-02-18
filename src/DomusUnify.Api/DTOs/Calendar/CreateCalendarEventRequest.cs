namespace DomusUnify.Api.DTOs.Calendar;

/// <summary>
/// Pedido para criar um novo evento de calendário.
/// </summary>
public sealed class CreateCalendarEventRequest
{
    /// <summary>
    /// Título do evento.
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Indica se o evento é de dia inteiro.
    /// </summary>
    public bool IsAllDay { get; set; }

    /// <summary>
    /// Data/hora de início (UTC).
    /// </summary>
    public DateTime StartUtc { get; set; }

    /// <summary>
    /// Data/hora de fim (UTC).
    /// </summary>
    public DateTime EndUtc { get; set; }

    /// <summary>
    /// Quando <see langword="true"/>, adiciona todos os membros da família como participantes.
    /// </summary>
    public bool ParticipantsAllMembers { get; set; }

    /// <summary>
    /// Lista de participantes (quando <see cref="ParticipantsAllMembers"/> é <see langword="false"/>).
    /// </summary>
    public List<Guid> ParticipantUserIds { get; set; } = new();

    /// <summary>
    /// Quando <see langword="true"/>, o evento fica visível para todos os membros da família.
    /// </summary>
    public bool VisibleToAllMembers { get; set; }

    /// <summary>
    /// Lista de utilizadores com visibilidade (quando <see cref="VisibleToAllMembers"/> é <see langword="false"/>).
    /// </summary>
    public List<Guid> VisibleToUserIds { get; set; } = new();

    /// <summary>
    /// Lembretes em minutos antes do início do evento.
    /// </summary>
    public List<int> ReminderOffsetsMinutes { get; set; } = new();

    /// <summary>
    /// Localização do evento (opcional).
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// Nota/descrição do evento (opcional).
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// Cor do evento em hexadecimal (opcional).
    /// </summary>
    public string? ColorHex { get; set; }

    /// <summary>
    /// Regra de recorrência (<c>RRULE</c>) para criar um evento recorrente (opcional).
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
