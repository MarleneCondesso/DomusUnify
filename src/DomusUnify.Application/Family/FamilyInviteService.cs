using System.Security.Cryptography;
using System.Text;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DomusUnify.Application.Family;

/// <summary>
/// Implementação do serviço de convites para famílias.
/// </summary>
/// <remarks>
/// Os tokens são gerados aleatoriamente e apenas o seu hash é persistido, para reduzir o impacto em caso de fuga de
/// dados. A URL pública do convite é construída a partir da configuração.
/// </remarks>
public sealed class FamilyInviteService : IFamilyInviteService
{
    private readonly IAppDbContext _db;
    private readonly string _publicAppBaseUrl; // vem de configuração

    /// <summary>
    /// Inicializa uma nova instância de <see cref="FamilyInviteService"/>.
    /// </summary>
    /// <param name="db">Contexto de base de dados.</param>
    /// <param name="opt">Opções de convites de família.</param>
    public FamilyInviteService(IAppDbContext db, IOptions<FamilyInviteOptions> opt)
    {
        _db = db;
        _publicAppBaseUrl = (opt.Value.PublicAppBaseUrl ?? "").TrimEnd('/');

        if (string.IsNullOrWhiteSpace(_publicAppBaseUrl))
            throw new InvalidOperationException("FamilyInvites:PublicAppBaseUrl não está configurado.");
    }

    /// <inheritdoc />
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

    /// <inheritdoc />
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

    /// <inheritdoc />
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
                Role = FamilyRole.Member, // ou Editor, conforme a regra pretendida
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

    /// <summary>
    /// Gera um token aleatório (URL-safe) para um convite.
    /// </summary>
    /// <returns>Token gerado.</returns>
    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Base64Url(bytes);
    }

    /// <summary>
    /// Calcula o hash SHA-256 de um token.
    /// </summary>
    /// <param name="token">Token em texto simples.</param>
    /// <returns>Hash do token em hexadecimal.</returns>
    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes); // string hex
    }

    /// <summary>
    /// Codifica bytes em Base64 URL-safe (sem padding).
    /// </summary>
    /// <param name="bytes">Bytes a codificar.</param>
    /// <returns>String Base64 URL-safe.</returns>
    private static string Base64Url(ReadOnlySpan<byte> bytes)
    {
        var s = Convert.ToBase64String(bytes);
        return s.Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}
