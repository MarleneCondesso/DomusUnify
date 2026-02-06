using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;

    public Guid? CurrentFamilyId { get; set; }
    public Family? CurrentFamily { get; set; }

    public ICollection<FamilyMember> FamilyMemberships { get; set; } = new List<FamilyMember>();
    public ICollection<CalendarEvent> CreatedEvents  { get; set; } = new List<CalendarEvent>();


}
