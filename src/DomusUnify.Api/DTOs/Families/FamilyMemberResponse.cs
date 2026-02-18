namespace DomusUnify.Api.DTOs.Families;

public sealed class FamilyMemberResponse
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
}

