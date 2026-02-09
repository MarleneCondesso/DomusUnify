namespace DomusUnify.Api.DTOs.Calendar;

public sealed class CalendarEventDetailResponse
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }

    public string Title { get; set; } = null!;
    public bool IsAllDay { get; set; }
    public DateTime StartUtc { get; set; }
    public DateTime EndUtc { get; set; }

    public string? Location { get; set; }
    public string? Note { get; set; }
    public string? ColorHex { get; set; }
    public string? TimezoneId { get; set; }

    public string? RecurrenceRule { get; set; }
    public DateTime? RecurrenceUntilUtc { get; set; }
    public int? RecurrenceCount { get; set; }

    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = null!;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public List<Guid> ParticipantUserIds { get; set; } = new();
    public List<Guid> VisibleToUserIds { get; set; } = new();
    public List<int> ReminderOffsetsMinutes { get; set; } = new();
}
