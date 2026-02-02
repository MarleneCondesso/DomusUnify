using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

public class SharedList : BaseEntity
{
    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    public string Name { get; set; } = null!;
    public ListType Type { get; set; } = ListType.Custom;

    public ICollection<ListItem> Items { get; set; } = new List<ListItem>();
}
