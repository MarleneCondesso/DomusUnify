using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

public class ListItem : BaseEntity
{
    public Guid SharedListId { get; set; }
    public SharedList SharedList { get; set; } = null!;

    public string Name { get; set; } = null!;
    public bool IsCompleted { get; set; }

    public Guid? CompletedByUserId { get; set; }
    public User? CompletedByUser { get; set; }

    public DateTime? CompletedAtUtc { get; set; }
}
