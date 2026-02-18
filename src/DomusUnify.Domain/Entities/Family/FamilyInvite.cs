using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

public sealed class FamilyInvite : BaseEntity
{
    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    public Guid InvitedByUserId { get; set; }
    public User InvitedByUser { get; set; } = null!;

    public string TokenHash { get; set; } = null!; // hash do token
    public DateTime ExpiresAtUtc { get; set; }

    public int? MaxUses { get; set; } // null = ilimitado
    public int Uses { get; set; }

    public bool IsRevoked { get; set; }
}
