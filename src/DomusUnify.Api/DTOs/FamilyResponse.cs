namespace DomusUnify.Api.DTOs.Families;

public sealed class FamilyResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Role { get; set; } = null!;
}
