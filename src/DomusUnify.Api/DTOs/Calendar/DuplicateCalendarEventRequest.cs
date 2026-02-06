namespace DomusUnify.Api.DTOs.Calendar;

public sealed class DuplicateCalendarEventRequest
{
    public DateTime NewStartUtc { get; set; }
    public DateTime NewEndUtc { get; set; }
}
