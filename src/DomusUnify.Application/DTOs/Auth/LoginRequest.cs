namespace DomusUnify.Api.DTOs.Auth;

public sealed class LoginRequest
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}
