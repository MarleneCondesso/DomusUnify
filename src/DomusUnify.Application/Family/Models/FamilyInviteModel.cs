namespace DomusUnify.Application.Family;

/// <summary>
/// Resultado da criação de um convite de família.
/// </summary>
/// <param name="InviteUrl">URL público do convite.</param>
/// <param name="ExpiresAtUtc">Data/hora de expiração do convite (UTC).</param>
public sealed record CreateInviteResult(string InviteUrl, DateTime ExpiresAtUtc);

/// <summary>
/// Informação de pré-visualização de um convite de família.
/// </summary>
/// <param name="FamilyId">Identificador da família.</param>
/// <param name="FamilyName">Nome da família.</param>
/// <param name="InvitedByUserId">Identificador do utilizador que criou o convite.</param>
/// <param name="InvitedByName">Nome do utilizador que criou o convite.</param>
/// <param name="ExpiresAtUtc">Data/hora de expiração do convite (UTC).</param>
/// <param name="IsExpired">Indica se o convite está expirado (ou se atingiu o limite de utilizações).</param>
/// <param name="IsRevoked">Indica se o convite foi revogado.</param>
public sealed record InvitePreviewModel(
    Guid FamilyId,
    string FamilyName,
    Guid InvitedByUserId,
    string InvitedByName,
    DateTime ExpiresAtUtc,
    bool IsExpired,
    bool IsRevoked
);
