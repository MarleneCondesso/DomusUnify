namespace DomusUnify.Api.Services.Auth;

/// <summary>
/// Valida ID tokens (JWT) emitidos por providers externos (ex.: Google).
/// </summary>
public interface IExternalIdTokenValidator
{
    Task<ExternalIdTokenUser> ValidateGoogleAsync(string idToken, CancellationToken cancellationToken = default);
}

