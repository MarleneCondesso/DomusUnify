namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa um lembrete associado a um evento de calendário.
/// </summary>
public sealed class CalendarEventReminder
{
    /// <summary>
    /// Identificador do registo.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador do evento.
    /// </summary>
    public Guid EventId { get; set; }

    /// <summary>
    /// Evento associado.
    /// </summary>
    public CalendarEvent Event { get; set; } = null!;

    /// <summary>
    /// Minutos antes do <c>StartUtc</c> para disparar o lembrete (0 = na hora).
    /// </summary>
    public int OffsetMinutes { get; set; }

    /// <summary>
    /// Data/hora de criação (UTC).
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
}
