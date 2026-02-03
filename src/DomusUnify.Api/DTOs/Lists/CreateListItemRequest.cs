namespace DomusUnify.Api.DTOs.Lists;

public sealed class CreateListItemRequest
{
    public string Name { get; set; } = null!;
    public Guid? CategoryId { get; set; }
}
