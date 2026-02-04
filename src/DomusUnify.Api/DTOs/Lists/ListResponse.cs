namespace DomusUnify.Api.DTOs.Lists;

public sealed class ListResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Type { get; set; } = "Custom";
    public string ColorHex { get; set; } = "";
    public int ItemsCount { get; set; }
    public int CompletedCount { get; set; }
}
