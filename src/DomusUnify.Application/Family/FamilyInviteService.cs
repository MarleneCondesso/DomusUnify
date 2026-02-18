using System.Security.Cryptography;
using System.Text;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DomusUnify.Application.Family;

public sealed class FamilyInviteService : IFamilyInviteService
{
    private readonly IAppDbContext _db;
    private readonly string _publicAppBaseUrl; // vem de config

    public FamilyInviteService(IAppDbContext db, IOptions<FamilyInviteOptions> opt)
    {
        _db = db;
        _publicAppBaseUrl = (opt.Value.PublicAppBaseUrl ?? "").TrimEnd('/');

        if (string.IsNullOrWhiteSpace(_publicAppBaseUrl))
            throw new InvalidOperationException("FamilyInvites:PublicAppBaseUrl não está configurado.");
    }

    public async Task<CreateInviteResult> CreateInviteAsync(Guid userId, Guid familyId, int daysValid, int? maxUses, CancellationToken ct)
    {
        // só admin/editor cria
        var role = await _db.FamilyMembers.AsNoTracking()
            .Where(m => m.UserId == userId && m.FamilyId == familyId)
            .Select(m => (FamilyRole?)m.Role)
            .FirstOrDefaultAsync(ct);

        if (role is null) throw new UnauthorizedAccessException("Não és membro desta família.");
        if (role == FamilyRole.Viewer) throw new UnauthorizedAccessException("Sem permissões para convidar.");

        var token = GenerateToken();
        var tokenHash = HashToken(token);

        var expires = DateTime.UtcNow.AddDays(Math.Clamp(daysValid, 1, 30));

        var invite = new FamilyInvite
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            InvitedByUserId = userId,
            TokenHash = tokenHash,
            ExpiresAtUtc = expires,
            MaxUses = maxUses,
            Uses = 0,
            IsRevoked = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.FamilyInvites.Add(invite);
        await _db.SaveChangesAsync(ct);

        var url = $"{_publicAppBaseUrl}/invite/{token}";
        return new CreateInviteResult(url, expires);
    }

    public async Task<InvitePreviewModel> PreviewInviteAsync(Guid userId, string token, CancellationToken ct)
    {
        var tokenHash = HashToken(token);

        var data = await _db.FamilyInvites.AsNoTracking()
            .Where(i => i.TokenHash == tokenHash)
            .Select(i => new
            {
                i.FamilyId,
                FamilyName = i.Family.Name,
                i.InvitedByUserId,
                InvitedByName = i.InvitedByUser.Name,
                i.ExpiresAtUtc,
                i.IsRevoked,
                i.MaxUses,
                i.Uses
            })
            .FirstOrDefaultAsync(ct);

        if (data is null) throw new KeyNotFoundException("Convite inválido.");

        var expired = data.ExpiresAtUtc <= DateTime.UtcNow;
        var usedUp = data.MaxUses.HasValue && data.Uses >= data.MaxUses.Value;

        return new InvitePreviewModel(
            data.FamilyId,
            data.FamilyName,
            data.InvitedByUserId,
            data.InvitedByName,
            data.ExpiresAtUtc,
            IsExpired: expired || usedUp,
            IsRevoked: data.IsRevoked
        );
    }

    public async Task JoinByInviteAsync(Guid userId, string token, CancellationToken ct)
    {
        var tokenHash = HashToken(token);

        var invite = await _db.FamilyInvites
            .Include(i => i.Family)
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash, ct);

        if (invite is null) throw new KeyNotFoundException("Convite inválido.");
        if (invite.IsRevoked) throw new InvalidOperationException("Convite revogado.");
        if (invite.ExpiresAtUtc <= DateTime.UtcNow) throw new InvalidOperationException("Convite expirado.");
        if (invite.MaxUses.HasValue && invite.Uses >= invite.MaxUses.Value) throw new InvalidOperationException("Convite já atingiu o limite de usos.");

        var alreadyMember = await _db.FamilyMembers
            .AnyAsync(m => m.FamilyId == invite.FamilyId && m.UserId == userId, ct);

        if (!alreadyMember)
        {
            _db.FamilyMembers.Add(new FamilyMember
            {
                Id = Guid.NewGuid(),
                FamilyId = invite.FamilyId,
                UserId = userId,
                Role = FamilyRole.Member, // ou Editor se quiseres
                CreatedAtUtc = DateTime.UtcNow
            });

            invite.Uses += 1;
            invite.UpdatedAtUtc = DateTime.UtcNow;
        }

        // define current family se não tiver
        var user = await _db.Users.FirstAsync(u => u.Id == userId, ct);
        if (user.CurrentFamilyId is null)
        {
            user.CurrentFamilyId = invite.FamilyId;
            user.UpdatedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
    }

    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Base64Url(bytes);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes); // string hex
    }

    private static string Base64Url(ReadOnlySpan<byte> bytes)
    {
        var s = Convert.ToBase64String(bytes);
        return s.Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}
