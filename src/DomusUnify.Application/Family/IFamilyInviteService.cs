
namespace DomusUnify.Application.Family;

public interface IFamilyInviteService
{
    Task<CreateInviteResult> CreateInviteAsync(Guid userId, Guid familyId, int daysValid, int? maxUses, CancellationToken ct);
    Task<InvitePreviewModel> PreviewInviteAsync(Guid userId, string token, CancellationToken ct);
    Task JoinByInviteAsync(Guid userId, string token, CancellationToken ct);
}