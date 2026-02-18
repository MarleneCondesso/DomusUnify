using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa um evento de calendário (inclui suporte a recorrência e exceções).
/// </summary>
public class CalendarEvent : BaseEntity
{
    /// <summary>
    /// Identificador da família proprietária do evento.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Família associada ao evento.
    /// </summary>
    public Family Family { get; set; } = null!;

    /// <summary>
    /// Título do evento.
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Indica se o evento é de dia inteiro.
    /// </summary>
    public bool IsAllDay { get; set; }

    /// <summary>
    /// Data/hora de início do evento (UTC).
    /// </summary>
    public DateTime StartUtc { get; set; }

    /// <summary>
    /// Data/hora de fim do evento (UTC).
    /// </summary>
    public DateTime EndUtc { get; set; }

    /// <summary>
    /// Identificador de recorrência (UTC) da instância, usado apenas em exceções (<see cref="ParentEventId"/> não nulo).
    /// </summary>
    public DateTime? RecurrenceIdUtc { get; set; }

    /// <summary>
    /// Regra de recorrência (<c>RRULE</c>) no formato iCalendar, se o evento for recorrente.
    /// </summary>
    public string? RecurrenceRule { get; set; }

    /// <summary>
    /// Limite de recorrência por data/hora (UTC), quando aplicável.
    /// </summary>
    public DateTime? RecurrenceUntilUtc { get; set; }

    /// <summary>
    /// Limite de recorrência por número de ocorrências, quando aplicável.
    /// </summary>
    public int? RecurrenceCount { get; set; }

    /// <summary>
    /// Identificador do evento pai (quando este evento é uma exceção/instância alterada).
    /// </summary>
    public Guid? ParentEventId { get; set; }

    /// <summary>
    /// Indica se esta instância (exceção) está cancelada.
    /// </summary>
    public bool IsCancelled { get; set; }

    /// <summary>
    /// Evento pai, quando aplicável.
    /// </summary>
    public CalendarEvent? ParentEvent { get; set; }

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
    /// Identificador do fuso horário (IANA), opcional.
    /// </summary>
    public string? TimezoneId { get; set; }

    /// <summary>
    /// Identificador do utilizador que criou o evento.
    /// </summary>
    public Guid CreatedByUserId { get; set; }

    /// <summary>
    /// Utilizador que criou o evento.
    /// </summary>
    public User CreatedByUser { get; set; } = null!;

    /// <summary>
    /// Participantes associados ao evento.
    /// </summary>
    public ICollection<CalendarEventParticipant> Participants { get; set; } = new List<CalendarEventParticipant>();

    /// <summary>
    /// Regras de visibilidade do evento por utilizador.
    /// </summary>
    public ICollection<CalendarEventVisibility> VisibleTo { get; set; } = new List<CalendarEventVisibility>();

    /// <summary>
    /// Lembretes associados ao evento.
    /// </summary>
    public ICollection<CalendarEventReminder> Reminders { get; set; } = new List<CalendarEventReminder>();
}
