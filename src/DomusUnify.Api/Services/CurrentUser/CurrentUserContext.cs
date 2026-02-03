using DomusUnify.Api.Auth;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Api.Services.CurrentUser;

public sealed class CurrentUserContext : ICurrentUserContext
{
    private readonly DomusUnifyDbContext _db;
    private readonly IHttpContextAccessor _http;

    public CurrentUserContext(DomusUnifyDbContext db, IHttpContextAccessor http)
    {
        _db = db;
        _http = http;
    }

    public Guid UserId => _http.HttpContext!.User.GetUserId();

    public async Task<Guid> GetCurrentFamilyIdAsync(CancellationToken ct = default)
    {
        var userId = UserId;

        var currentFamilyId = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.CurrentFamilyId)
            .FirstOrDefaultAsync(ct);

        if (currentFamilyId is null)
            throw new InvalidOperationException("Sem família ativa. Usa /api/v1/families/set-current.");

        return currentFamilyId.Value;
    }
}
