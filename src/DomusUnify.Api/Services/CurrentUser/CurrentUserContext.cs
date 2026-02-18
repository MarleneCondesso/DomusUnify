using DomusUnify.Api.Auth;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Api.Services.CurrentUser;

/// <summary>
/// Implementação do contexto do utilizador atual baseada no <see cref="IHttpContextAccessor"/>.
/// </summary>
public sealed class CurrentUserContext : ICurrentUserContext
{
    private readonly DomusUnifyDbContext _db;
    private readonly IHttpContextAccessor _http;

    public CurrentUserContext(DomusUnifyDbContext db, IHttpContextAccessor http)
    {
        _db = db;
        _http = http;
    }

    /// <inheritdoc />
    public Guid UserId => _http.HttpContext!.User.GetUserId();

    /// <inheritdoc />
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
