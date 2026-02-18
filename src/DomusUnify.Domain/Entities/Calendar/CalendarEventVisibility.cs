namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma regra de visibilidade de um evento de calendário para um utilizador.
/// </summary>
public sealed class CalendarEventVisibility
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
    /// Identificador do utilizador com acesso/visibilidade.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Utilizador com acesso/visibilidade.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Data/hora de criação (UTC).
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
}
