using DomusUnify.Api.Services.Auth;
using Microsoft.IdentityModel.Tokens;

namespace DomusUnify.Api.IntegrationTests.Fakes;

internal sealed class FakeExternalIdTokenValidator : IExternalIdTokenValidator
{
    public Task<ExternalIdTokenUser> ValidateGoogleAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(idToken))
            throw new SecurityTokenMalformedException("IDX12741: JWT must have three segments (JWS) or five segments (JWE).");

        // Mimic real JWT format validation: header.payload.signature (3 segments) or JWE (5 segments).
        var parts = idToken.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length is not (3 or 5))
            throw new SecurityTokenMalformedException("IDX12741: JWT must have three segments (JWS) or five segments (JWE).");

        var email = TestEnv.Get("DOMUSUNIFY_TEST_GOOGLE_EMAIL", "google.user@example.com");
        var subject = TestEnv.Get("DOMUSUNIFY_TEST_GOOGLE_SUBJECT", "google-subject-123");
        var name = TestEnv.Get("DOMUSUNIFY_TEST_GOOGLE_NAME", "Google User");
        var emailVerified = TestEnv.GetBool("DOMUSUNIFY_TEST_GOOGLE_EMAIL_VERIFIED", true);

        return Task.FromResult(new ExternalIdTokenUser
        {
            Subject = subject,
            Email = email,
            EmailVerified = emailVerified,
            Name = name,
        });
    }
}
