using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

public class ItemCategory : BaseEntity
{
    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = "tag";  // ✅ novo (default)
    public string? ColorHex { get; set; }
    public int SortOrder { get; set; } = 0;


    public ICollection<ListItem> Items { get; set; } = new List<ListItem>();
}
