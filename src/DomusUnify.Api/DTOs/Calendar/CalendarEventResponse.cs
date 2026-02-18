namespace DomusUnify.Api.DTOs.Calendar;

/// <summary>
/// Resposta com informação de uma ocorrência de evento de calendário.
/// </summary>
public sealed class CalendarEventResponse
{
    /// <summary>
    /// Identificador do evento pai.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador do evento de exceção (instância alterada/cancelada), se aplicável.
    /// </summary>
    public Guid? ExceptionEventId { get; set; }

    /// <summary>
    /// Título do evento.
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Indica se o evento é de dia inteiro.
    /// </summary>
    public bool IsAllDay { get; set; }

    /// <summary>
    /// Início da ocorrência (UTC).
    /// </summary>
    public DateTime StartUtc { get; set; }

    /// <summary>
    /// Fim da ocorrência (UTC).
    /// </summary>
    public DateTime EndUtc { get; set; }

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
    /// Regra de recorrência (<c>RRULE</c>) do evento, opcional.
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

    /// <summary>
    /// Identificador do utilizador que criou o evento.
    /// </summary>
    public Guid CreatedByUserId { get; set; }

    /// <summary>
    /// Data/hora de criação (UTC).
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }

    /// <summary>
    /// Data/hora da última atualização (UTC), se existir.
    /// </summary>
    public DateTime? UpdatedAtUtc { get; set; }

    /// <summary>
    /// Lista de utilizadores participantes no evento.
    /// </summary>
    public List<Guid> ParticipantUserIds { get; set; } = new();

    /// <summary>
    /// Lista de utilizadores que conseguem ver o evento.
    /// </summary>
    public List<Guid> VisibleToUserIds { get; set; } = new();

    /// <summary>
    /// Lembretes em minutos antes do início da ocorrência.
    /// </summary>
    public List<int> ReminderOffsetsMinutes { get; set; } = new();
}
