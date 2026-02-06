using DomusUnify.Application.Recurrence;

namespace DomusUnify.Api.DTOs.Calendar;

public sealed class UpdateRecurringEventRequest
{
    public CalendarEditScope Scope { get; set; } = CalendarEditScope.AllOccurrences;

    // obrigatório para ThisOccurrence / ThisAndFuture
    public DateTime? OccurrenceStartUtc { get; set; }

    // mudanças
    public string? Title { get; set; }
    public bool? IsAllDay { get; set; }
    public DateTime? NewStartUtc { get; set; }
    public DateTime? NewEndUtc { get; set; }

    public bool? CancelThisOccurrence { get; set; } // se true e scope=ThisOccurrence => cria exceção cancelada

    public bool? ParticipantsAllMembers { get; set; }
    public List<Guid>? ParticipantUserIds { get; set; }

    public bool? VisibleToAllMembers { get; set; }
    public List<Guid>? VisibleToUserIds { get; set; }

    public List<int>? ReminderOffsetsMinutes { get; set; }

    public string? Location { get; set; }
    public string? Note { get; set; }
    public string? ColorHex { get; set; }
    public string? TimezoneId { get; set; }
}
