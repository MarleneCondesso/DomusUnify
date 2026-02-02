using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

public class CalendarEvent : BaseEntity
{
    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    public string Title { get; set; } = null!;
    public string? Description { get; set; }

    public DateTime StartUtc { get; set; }
    public DateTime EndUtc { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
}
