using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Refresh token persistido para manter uma sessão iniciada entre reinícios da app.
/// </summary>
public sealed class UserRefreshToken : BaseEntity
{
    /// <summary>
    /// Identificador do utilizador dono desta sessão.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Utilizador associado.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Hash SHA-256 do refresh token em claro.
    /// </summary>
    public string TokenHash { get; set; } = null!;

    /// <summary>
    /// Data/hora limite de validade do refresh token (UTC).
    /// </summary>
    public DateTime ExpiresAtUtc { get; set; }

    /// <summary>
    /// Data/hora em que o refresh token foi revogado (UTC), se aplicável.
    /// </summary>
    public DateTime? RevokedAtUtc { get; set; }

    /// <summary>
    /// Hash do token novo gerado por rotação, quando existe.
    /// </summary>
    public string? ReplacedByTokenHash { get; set; }

    /// <summary>
    /// Momento do último uso desta sessão (UTC), se aplicável.
    /// </summary>
    public DateTime? LastUsedAtUtc { get; set; }

    /// <summary>
    /// Descrição opcional do dispositivo/browser.
    /// </summary>
    public string? UserAgent { get; set; }
}
