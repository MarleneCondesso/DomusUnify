namespace DomusUnify.Api.Services.CurrentUser;

public interface ICurrentUserContext
{
    Guid UserId { get; }
    Task<Guid> GetCurrentFamilyIdAsync(CancellationToken ct = default);
}
