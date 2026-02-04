using DomusUnify.Domain.Enums;

public sealed class UpdateListRequest
{
    public string Name { get; set; } = null!;
    public string ColorHex { get; set; } = "";
    public string Type { get; set; } = "Custom"; // Shopping | Tasks | Custom
}