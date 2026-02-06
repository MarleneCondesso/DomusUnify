using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

public class Family : BaseEntity
{
    public string Name { get; set; } = null!;

    public ICollection<FamilyMember> Members { get; set; } = new List<FamilyMember>();
    public ICollection<CalendarEvent> CalendarEvents { get; set; } = new List<CalendarEvent>();
    public ICollection<SharedList> Lists { get; set; } = new List<SharedList>();
}
