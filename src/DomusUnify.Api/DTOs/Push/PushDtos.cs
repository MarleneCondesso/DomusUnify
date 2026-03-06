namespace DomusUnify.Api.DTOs.Push;

/// <summary>
/// Resposta com a chave pública VAPID.
/// </summary>
public sealed class PushPublicKeyResponse
{
    /// <summary>
    /// Chave pública VAPID.
    /// </summary>
    public string PublicKey { get; set; } = "";
}

/// <summary>
/// Pedido para registar ou atualizar uma subscrição Web Push.
/// </summary>
public sealed class UpsertWebPushSubscriptionRequest
{
    /// <summary>
    /// Endpoint da subscrição.
    /// </summary>
    public string Endpoint { get; set; } = "";

    /// <summary>
    /// Chave pública P-256 do browser.
    /// </summary>
    public string P256Dh { get; set; } = "";

    /// <summary>
    /// Chave de autenticação do browser.
    /// </summary>
    public string Auth { get; set; } = "";

    /// <summary>
    /// Estado global das notificações push.
    /// </summary>
    public bool NotificationsEnabled { get; set; } = true;

    /// <summary>
    /// Push para listas.
    /// </summary>
    public bool ListsEnabled { get; set; } = true;

    /// <summary>
    /// Push para orçamento.
    /// </summary>
    public bool BudgetEnabled { get; set; } = true;

    /// <summary>
    /// Push para calendário.
    /// </summary>
    public bool CalendarEnabled { get; set; } = true;

    /// <summary>
    /// Informação opcional do browser/dispositivo.
    /// </summary>
    public string? UserAgent { get; set; }
}
