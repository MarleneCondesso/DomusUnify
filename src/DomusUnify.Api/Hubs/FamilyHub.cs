using DomusUnify.Api.Auth;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Api.Hubs;

[Authorize]
public sealed class FamilyHub : Hub
{
    private readonly DomusUnifyDbContext _db;

    public FamilyHub(DomusUnifyDbContext db) => _db = db;

    // Cliente chama isto quando quer receber eventos de uma family
    public async Task JoinFamily(Guid familyId)
    {
        var userId = Context.User!.GetUserId();

        var isMember = await _db.FamilyMembers
            .AsNoTracking()
            .AnyAsync(m => m.UserId == userId && m.FamilyId == familyId);

        if (!isMember)
            throw new HubException("Not a member of this family.");

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(familyId));
    }

    public async Task LeaveFamily(Guid familyId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(familyId));
    }

    public static string GroupName(Guid familyId) => $"family:{familyId}";
}
