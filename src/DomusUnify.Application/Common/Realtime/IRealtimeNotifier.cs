namespace DomusUnify.Application.Common.Realtime;

public interface IRealtimeNotifier
{
    Task NotifyFamilyAsync(Guid familyId, string eventName, object payload, CancellationToken ct = default);
}
