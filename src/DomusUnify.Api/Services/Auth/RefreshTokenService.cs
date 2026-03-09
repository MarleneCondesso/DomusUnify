using System.Security.Cryptography;
using System.Text;
using DomusUnify.Domain.Entities;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DomusUnify.Api.Services.Auth;

/// <summary>
/// Implementação baseada em EF Core para refresh tokens persistidos.
/// </summary>
public sealed class RefreshTokenService : IRefreshTokenService
{
    private readonly DomusUnifyDbContext _db;
    private readonly IConfiguration _config;

    public RefreshTokenService(DomusUnifyDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<(string token, DateTime expiresAtUtc)> CreateAsync(User user, string? userAgent, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var rawToken = CreateOpaqueToken();
        var expiresAtUtc = now.AddDays(GetRefreshTokenLifetimeDays());

        _db.UserRefreshTokens.Add(new UserRefreshToken
        {
            UserId = user.Id,
            TokenHash = ComputeTokenHash(rawToken),
            ExpiresAtUtc = expiresAtUtc,
            UserAgent = NormalizeUserAgent(userAgent),
            LastUsedAtUtc = now,
            CreatedAtUtc = now,
        });

        await _db.SaveChangesAsync(ct);
        return (rawToken, expiresAtUtc);
    }

    public async Task<(User user, string token, DateTime expiresAtUtc)?> RotateAsync(
        string refreshToken,
        string? userAgent,
        CancellationToken ct = default)
    {
        var normalizedToken = (refreshToken ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalizedToken))
            return null;

        var now = DateTime.UtcNow;
        var tokenHash = ComputeTokenHash(normalizedToken);

        var current = await _db.UserRefreshTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash, ct);

        if (current is null)
            return null;

        if (current.RevokedAtUtc is not null || current.ExpiresAtUtc <= now)
            return null;

        var nextRawToken = CreateOpaqueToken();
        var nextHash = ComputeTokenHash(nextRawToken);
        var nextExpiresAtUtc = now.AddDays(GetRefreshTokenLifetimeDays());

        current.RevokedAtUtc = now;
        current.ReplacedByTokenHash = nextHash;
        current.LastUsedAtUtc = now;
        current.UpdatedAtUtc = now;

        _db.UserRefreshTokens.Add(new UserRefreshToken
        {
            UserId = current.UserId,
            TokenHash = nextHash,
            ExpiresAtUtc = nextExpiresAtUtc,
            UserAgent = NormalizeUserAgent(userAgent) ?? current.UserAgent,
            LastUsedAtUtc = now,
            CreatedAtUtc = now,
        });

        await _db.SaveChangesAsync(ct);
        return (current.User, nextRawToken, nextExpiresAtUtc);
    }

    public async Task RevokeAsync(string refreshToken, Guid? userId = null, CancellationToken ct = default)
    {
        var normalizedToken = (refreshToken ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalizedToken))
            return;

        var tokenHash = ComputeTokenHash(normalizedToken);
        var query = _db.UserRefreshTokens.Where(x => x.TokenHash == tokenHash);
        if (userId.HasValue)
            query = query.Where(x => x.UserId == userId.Value);

        var current = await query.FirstOrDefaultAsync(ct);
        if (current is null || current.RevokedAtUtc is not null)
            return;

        current.RevokedAtUtc = DateTime.UtcNow;
        current.UpdatedAtUtc = current.RevokedAtUtc;
        await _db.SaveChangesAsync(ct);
    }

    private int GetRefreshTokenLifetimeDays()
    {
        var raw = _config["Jwt:RefreshTokenLifetimeDays"];
        if (int.TryParse(raw, out var days) && days > 0)
            return days;

        return 90;
    }

    private static string CreateOpaqueToken()
    {
        return Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(64));
    }

    private static string ComputeTokenHash(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    private static string? NormalizeUserAgent(string? value)
    {
        var trimmed = (value ?? string.Empty).Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }
}
