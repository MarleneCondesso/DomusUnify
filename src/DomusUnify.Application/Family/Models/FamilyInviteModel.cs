namespace DomusUnify.Application.Family;

public sealed record CreateInviteResult(string InviteUrl, DateTime ExpiresAtUtc);

public sealed record InvitePreviewModel(
    Guid FamilyId,
    string FamilyName,
    Guid InvitedByUserId,
    string InvitedByName,
    DateTime ExpiresAtUtc,
    bool IsExpired,
    bool IsRevoked
);
