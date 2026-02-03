namespace DomusUnify.Api.DTOs.Lists;

public sealed class ListItemResponse
{
    public Guid Id { get; set; }
    public Guid ListId { get; set; }
    public string Name { get; set; } = null!;
    public bool IsCompleted { get; set; }
    public Guid? CategoryId { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public Guid? CompletedByUserId { get; set; }
}
