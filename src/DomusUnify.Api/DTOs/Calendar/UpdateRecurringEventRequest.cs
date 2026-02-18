using DomusUnify.Application.Recurrence;

namespace DomusUnify.Api.DTOs.Calendar;

/// <summary>
/// Pedido para atualizar um evento recorrente, com controlo de âmbito (ocorrência/serie/futuro).
/// </summary>
public sealed class UpdateRecurringEventRequest
{
    /// <summary>
    /// Âmbito da alteração (ocorrência atual, todas as ocorrências, ou a partir da ocorrência atual).
    /// </summary>
    public CalendarEditScope Scope { get; set; } = CalendarEditScope.AllOccurrences;

    /// <summary>
    /// Início (UTC) da ocorrência a editar.
    /// </summary>
    /// <remarks>
    /// Obrigatório quando <see cref="Scope"/> é <see cref="CalendarEditScope.ThisOccurrence"/> ou
    /// <see cref="CalendarEditScope.ThisAndFuture"/>.
    /// </remarks>
    public DateTime? OccurrenceStartUtc { get; set; }

    /// <summary>
    /// Novo título (opcional).
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Indica se passa a ser de dia inteiro (opcional).
    /// </summary>
    public bool? IsAllDay { get; set; }

    /// <summary>
    /// Novo início (UTC) (opcional).
    /// </summary>
    public DateTime? NewStartUtc { get; set; }

    /// <summary>
    /// Novo fim (UTC) (opcional).
    /// </summary>
    public DateTime? NewEndUtc { get; set; }

    /// <summary>
    /// Quando <see langword="true"/>, cancela a ocorrência selecionada.
    /// </summary>
    /// <remarks>
    /// Quando <see cref="Scope"/> é <see cref="CalendarEditScope.ThisOccurrence"/>, pode criar uma exceção cancelada.
    /// </remarks>
    public bool? CancelThisOccurrence { get; set; }

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
    /// Identificador do fuso horário (IANA), opcional.
    /// </summary>
    public string? TimezoneId { get; set; }
}
