namespace DomusUnify.Domain.Entities;

public sealed class CalendarEventReminder
{
    public Guid Id { get; set; }

    public Guid EventId { get; set; }
    public CalendarEvent Event { get; set; } = null!;

    // minutos antes do StartUtc (0 = na hora)
    public int OffsetMinutes { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
