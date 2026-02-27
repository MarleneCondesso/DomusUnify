namespace DomusUnify.Api.Services.Auth;

/// <summary>
/// Opções de autenticação externa.
/// </summary>
public sealed class ExternalAuthOptions
{
    /// <summary>
    /// Nome da secção no ficheiro de configuração.
    /// </summary>
    public const string SectionName = "ExternalAuth";

    public GoogleOptions Google { get; set; } = new();

    public sealed class GoogleOptions
    {
        /// <summary>
        /// OAuth Client ID (Web) do Google.
        /// </summary>
        public string? ClientId { get; set; }
    }
}
