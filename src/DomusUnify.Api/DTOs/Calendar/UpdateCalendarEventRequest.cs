namespace DomusUnify.Api.DTOs.Calendar;

public sealed class UpdateCalendarEventRequest
{
    public string? Title { get; set; }
    public bool? IsAllDay { get; set; }
    public DateTime? StartUtc { get; set; }
    public DateTime? EndUtc { get; set; }

    public bool? ParticipantsAllMembers { get; set; }
    public List<Guid>? ParticipantUserIds { get; set; }

    public bool? VisibleToAllMembers { get; set; }
    public List<Guid>? VisibleToUserIds { get; set; }

    public List<int>? ReminderOffsetsMinutes { get; set; }

    public string? Location { get; set; }
    public string? Note { get; set; }
    public string? ColorHex { get; set; }

    // edição do evento pai (inclui recorrência)
    public string? RecurrenceRule { get; set; }
    public DateTime? RecurrenceUntilUtc { get; set; }
    public int? RecurrenceCount { get; set; }

    public string? TimezoneId { get; set; }
}
