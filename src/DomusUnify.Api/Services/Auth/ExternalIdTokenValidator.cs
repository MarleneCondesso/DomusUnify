using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace DomusUnify.Api.Services.Auth;

/// <summary>
/// Valida ID tokens (JWT) emitidos por providers externos (ex.: Google) via OpenID Connect.
/// </summary>
public sealed class ExternalIdTokenValidator : IExternalIdTokenValidator
{
    private const string GoogleMetadataAddress = "https://accounts.google.com/.well-known/openid-configuration";

    private static readonly string[] GoogleIssuers = ["https://accounts.google.com", "accounts.google.com"];

    private readonly ExternalAuthOptions _options;
    private readonly JwtSecurityTokenHandler _handler = new() { MapInboundClaims = false };
    private readonly IConfigurationManager<OpenIdConnectConfiguration> _googleConfig;

    public ExternalIdTokenValidator(IOptions<ExternalAuthOptions> options, IHttpClientFactory httpClientFactory)
    {
        _options = options.Value;

        var httpClient = httpClientFactory.CreateClient(nameof(ExternalIdTokenValidator));
        var retriever = new HttpDocumentRetriever(httpClient) { RequireHttps = true };

        _googleConfig = new ConfigurationManager<OpenIdConnectConfiguration>(
            GoogleMetadataAddress,
            new OpenIdConnectConfigurationRetriever(),
            retriever);
    }

    public async Task<ExternalIdTokenUser> ValidateGoogleAsync(string idToken, CancellationToken cancellationToken = default)
    {
        var audience = _options.Google.ClientId;
        if (string.IsNullOrWhiteSpace(audience))
            throw new InvalidOperationException("ExternalAuth:Google:ClientId não configurado.");

        var principal = await ValidateAsync(idToken, _googleConfig, GoogleIssuers, audience, cancellationToken);
        return ExternalIdTokenUser.FromPrincipal(principal);
    }

    private Task<ClaimsPrincipal> ValidateAsync(
        string idToken,
        IConfigurationManager<OpenIdConnectConfiguration> configManager,
        IEnumerable<string> validIssuers,
        string validAudience,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(idToken))
            throw new SecurityTokenException("ID token vazio.");

        return ValidateAsyncCore(idToken, configManager, validIssuers, validAudience, cancellationToken);
    }

    private async Task<ClaimsPrincipal> ValidateAsyncCore(
        string idToken,
        IConfigurationManager<OpenIdConnectConfiguration> configManager,
        IEnumerable<string> validIssuers,
        string validAudience,
        CancellationToken cancellationToken)
    {
        var config = await configManager.GetConfigurationAsync(cancellationToken);

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuers = validIssuers,

            ValidateAudience = true,
            ValidAudience = validAudience,

            ValidateLifetime = true,
            RequireExpirationTime = true,

            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = config.SigningKeys,

            ClockSkew = TimeSpan.FromMinutes(1)
        };

        var principal = _handler.ValidateToken(idToken, validationParameters, out var validatedToken);

        if (validatedToken is not JwtSecurityToken jwt ||
            !string.Equals(jwt.Header.Alg, SecurityAlgorithms.RsaSha256, StringComparison.Ordinal))
        {
            throw new SecurityTokenException("Token inválido (algoritmo).");
        }

        return principal;
    }
}

public sealed class ExternalIdTokenUser
{
    public required string Subject { get; init; }
    public string? Email { get; init; }
    public bool? EmailVerified { get; init; }
    public string? Name { get; init; }

    public static ExternalIdTokenUser FromPrincipal(ClaimsPrincipal principal)
    {
        var subject = principal.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(subject))
            throw new SecurityTokenException("Token inválido (sub em falta).");

        var email = principal.FindFirstValue("email");
        var emailVerified = ParseBoolClaim(principal.FindFirstValue("email_verified"));
        var name = principal.FindFirstValue("name");

        return new ExternalIdTokenUser
        {
            Subject = subject,
            Email = email,
            EmailVerified = emailVerified,
            Name = name
        };
    }

    private static bool? ParseBoolClaim(string? value)
    {
        if (value is null) return null;
        if (bool.TryParse(value, out var b)) return b;

        // Alguns providers podem devolver "1"/"0"
        if (string.Equals(value, "1", StringComparison.Ordinal)) return true;
        if (string.Equals(value, "0", StringComparison.Ordinal)) return false;

        return null;
    }
}
