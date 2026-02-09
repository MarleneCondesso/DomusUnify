using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

public class CalendarEvent : BaseEntity
{
    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    public string Title { get; set; } = null!;
    public bool IsAllDay { get; set; }

    public DateTime StartUtc { get; set; }
    public DateTime EndUtc { get; set; }

    // RECORRÊNCIA
    public DateTime? RecurrenceIdUtc { get; set; } // usado apenas em exceções (ParentEventId != null)
    public string? RecurrenceRule { get; set; }        // RRULE
    public DateTime? RecurrenceUntilUtc { get; set; }  // UNTIL
    public int? RecurrenceCount { get; set; }          // COUNT
    public Guid? ParentEventId { get; set; }           // exceções
    public bool IsCancelled { get; set; } // usado só em exceções
    public CalendarEvent? ParentEvent { get; set; }

    // UI / Extras
    public string? Location { get; set; }
    public string? Note { get; set; }
    public string? ColorHex { get; set; }
    public string? TimezoneId { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;


    public ICollection<CalendarEventParticipant> Participants { get; set; } = new List<CalendarEventParticipant>();
    public ICollection<CalendarEventVisibility> VisibleTo { get; set; } = new List<CalendarEventVisibility>();
    public ICollection<CalendarEventReminder> Reminders { get; set; } = new List<CalendarEventReminder>();
}
