namespace DomusUnify.Api.DTOs.Auth;

public sealed class AuthResponse
{
    public string AccessToken { get; set; } = null!;
    public DateTime ExpiresAtUtc { get; set; }
}
