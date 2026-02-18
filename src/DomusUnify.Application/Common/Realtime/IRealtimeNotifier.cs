namespace DomusUnify.Application.Common.Realtime;

/// <summary>
/// Contrato para envio de notificações em tempo real.
/// </summary>
public interface IRealtimeNotifier
{
    /// <summary>
    /// Notifica todos os clientes ligados a uma família.
    /// </summary>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="eventName">Nome do evento a emitir.</param>
    /// <param name="payload">Payload serializável a enviar no evento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task NotifyFamilyAsync(Guid familyId, string eventName, object payload, CancellationToken ct = default);
}
