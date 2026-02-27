using DomusUnify.Application.Activity.Models;

namespace DomusUnify.Application.Notifications;

/// <summary>
/// Serviço de notificações (não vistas) baseado no feed de atividade.
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Obtém as notificações não vistas do utilizador na família.
    /// </summary>
    /// <param name="userId">Utilizador autenticado.</param>
    /// <param name="familyId">Família.</param>
    /// <param name="take">Número máximo a devolver.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de entradas de atividade não vistas.</returns>
    Task<IReadOnlyList<ActivityEntryModel>> GetUnreadAsync(Guid userId, Guid familyId, int take, CancellationToken ct);

    /// <summary>
    /// Marca todas as notificações como vistas (atualiza o marcador de última visualização).
    /// </summary>
    /// <param name="userId">Utilizador autenticado.</param>
    /// <param name="familyId">Família.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task MarkAllSeenAsync(Guid userId, Guid familyId, CancellationToken ct);
}

