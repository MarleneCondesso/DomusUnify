namespace DomusUnify.Api.DTOs.Lists;

public sealed class CreateListRequest
{
    public string Name { get; set; } = null!;
    public string Type { get; set; } = "Custom"; // Shopping | Tasks | Custom
}
