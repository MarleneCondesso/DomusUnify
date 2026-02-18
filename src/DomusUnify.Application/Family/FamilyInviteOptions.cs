namespace DomusUnify.Application.Family;

/// <summary>
/// Opções de configuração para convites de família.
/// </summary>
public sealed class FamilyInviteOptions
{
    /// <summary>
    /// Nome da secção de configuração.
    /// </summary>
    public const string SectionName = "FamilyInvites";

    /// <summary>
    /// URL base público da aplicação, usado para construir o link do convite.
    /// </summary>
    public string PublicAppBaseUrl { get; set; } = "";
}
