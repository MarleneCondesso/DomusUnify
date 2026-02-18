namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa a associação de um utilizador como participante de um evento de calendário.
/// </summary>
public sealed class CalendarEventParticipant
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
    /// Identificador do utilizador participante.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Utilizador participante.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Data/hora de criação (UTC).
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
}
