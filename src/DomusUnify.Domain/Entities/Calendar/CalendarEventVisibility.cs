namespace DomusUnify.Domain.Entities;

public sealed class CalendarEventVisibility
{
    public Guid Id { get; set; }

    public Guid EventId { get; set; }
    public CalendarEvent Event { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime CreatedAtUtc { get; set; }
}
