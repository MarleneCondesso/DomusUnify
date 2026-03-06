using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Subscrição Web Push associada a um utilizador/dispositivo.
/// </summary>
public sealed class WebPushSubscription : BaseEntity
{
    /// <summary>
    /// Identificador do utilizador.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Utilizador associado.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Endpoint da subscrição entregue pelo browser.
    /// </summary>
    public string Endpoint { get; set; } = null!;

    /// <summary>
    /// Hash SHA-256 do endpoint para indexação única.
    /// </summary>
    public string EndpointHash { get; set; } = null!;

    /// <summary>
    /// Chave pública P-256 do cliente.
    /// </summary>
    public string P256Dh { get; set; } = null!;

    /// <summary>
    /// Chave de autenticação do cliente.
    /// </summary>
    public string Auth { get; set; } = null!;

    /// <summary>
    /// Notificações push globais ativas para este dispositivo.
    /// </summary>
    public bool NotificationsEnabled { get; set; } = true;

    /// <summary>
    /// Notificações push de listas ativas.
    /// </summary>
    public bool ListsEnabled { get; set; } = true;

    /// <summary>
    /// Notificações push de orçamento ativas.
    /// </summary>
    public bool BudgetEnabled { get; set; } = true;

    /// <summary>
    /// Notificações push de calendário ativas.
    /// </summary>
    public bool CalendarEnabled { get; set; } = true;

    /// <summary>
    /// Descrição opcional do dispositivo/browser.
    /// </summary>
    public string? UserAgent { get; set; }
}
