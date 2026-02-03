using DomusUnify.Api.Hubs;
using DomusUnify.Application.Common.Realtime;
using Microsoft.AspNetCore.SignalR;

namespace DomusUnify.Api.Realtime;

public sealed class SignalRRealtimeNotifier : IRealtimeNotifier
{
    private readonly IHubContext<FamilyHub> _hub;

    public SignalRRealtimeNotifier(IHubContext<FamilyHub> hub) => _hub = hub;

    public Task NotifyFamilyAsync(Guid familyId, string eventName, object payload, CancellationToken ct = default)
    {
        // SignalR não usa CancellationToken aqui, mas mantemos assinatura clean
        return _hub.Clients.Group(FamilyHub.GroupName(familyId))
            .SendAsync(eventName, payload);
    }
}
