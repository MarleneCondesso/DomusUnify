using DomusUnify.Domain.Entities;

namespace DomusUnify.Application.Notifications;

/// <summary>
/// Envia notificações push com base em entradas do feed de atividade.
/// </summary>
public interface IActivityPushNotifier
{
    /// <summary>
    /// Processa uma entrada de atividade e envia push aos destinatários elegíveis.
    /// </summary>
    /// <param name="entry">Entrada de atividade já persistida.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task NotifyAsync(ActivityEntry entry, CancellationToken ct);
}
