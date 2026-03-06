namespace DomusUnify.Api.Push;

/// <summary>
/// Configuração VAPID para envio de Web Push.
/// </summary>
public sealed class WebPushOptions
{
    /// <summary>
    /// Nome da secção de configuração.
    /// </summary>
    public const string SectionName = "WebPush";

    /// <summary>
    /// Contacto/subject VAPID (ex.: mailto:equipa@domusunify.app).
    /// </summary>
    public string Subject { get; set; } = "";

    /// <summary>
    /// Chave pública VAPID.
    /// </summary>
    public string PublicKey { get; set; } = "";

    /// <summary>
    /// Chave privada VAPID.
    /// </summary>
    public string PrivateKey { get; set; } = "";
}
