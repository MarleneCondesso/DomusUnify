namespace DomusUnify.Api.DTOs.Families;

/// <summary>
/// Resposta com informação de uma família no contexto do utilizador autenticado.
/// </summary>
public sealed class FamilyResponse
{
    /// <summary>
    /// Identificador da família.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Nome da família.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Papel do utilizador autenticado na família.
    /// </summary>
    public string Role { get; set; } = null!;
}
