using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Vínculo entre um utilizador e um provider externo (ex.: Google).
/// </summary>
public class UserExternalLogin : BaseEntity
{
    /// <summary>
    /// Identificador do utilizador (FK).
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Utilizador associado.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Nome do provider (ex.: "google").
    /// </summary>
    public string Provider { get; set; } = null!;

    /// <summary>
    /// Subject/identificador do utilizador no provider (claim "sub").
    /// </summary>
    public string ProviderSubject { get; set; } = null!;

    /// <summary>
    /// Email devolvido pelo provider (quando disponível).
    /// </summary>
    public string? Email { get; set; }
}
