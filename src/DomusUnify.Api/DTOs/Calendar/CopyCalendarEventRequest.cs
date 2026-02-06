namespace DomusUnify.Api.DTOs.Calendar;

public sealed class CopyCalendarEventRequest
{
    // max 30
    public List<DateOnly> DatesUtc { get; set; } = new();
}
