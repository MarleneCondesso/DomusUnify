using DomusUnify.Api.Auth;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Api.Hubs;

/// <summary>
/// Hub SignalR para comunicação em tempo real ao nível da família.
/// </summary>
/// <remarks>
/// Os clientes podem juntar-se a um grupo por família para receber eventos (ex.: alterações a transações, listas,
/// calendário, etc.).
/// </remarks>
[Authorize]
public sealed class FamilyHub : Hub
{
    private readonly DomusUnifyDbContext _db;

    public FamilyHub(DomusUnifyDbContext db) => _db = db;

    /// <summary>
    /// Associa a ligação atual ao grupo da família, permitindo receber eventos dessa família.
    /// </summary>
    /// <param name="familyId">Identificador da família.</param>
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

    /// <summary>
    /// Remove a ligação atual do grupo da família.
    /// </summary>
    /// <param name="familyId">Identificador da família.</param>
    public async Task LeaveFamily(Guid familyId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(familyId));
    }

    /// <summary>
    /// Constrói o nome do grupo SignalR para uma família.
    /// </summary>
    /// <param name="familyId">Identificador da família.</param>
    /// <returns>Nome do grupo.</returns>
    public static string GroupName(Guid familyId) => $"family:{familyId}";
}
