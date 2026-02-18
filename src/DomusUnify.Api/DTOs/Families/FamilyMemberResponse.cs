namespace DomusUnify.Api.DTOs.Families;

/// <summary>
/// Resposta com informação de um membro de uma família.
/// </summary>
public sealed class FamilyMemberResponse
{
    /// <summary>
    /// Identificador do utilizador.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Nome do utilizador.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Email do utilizador.
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// Papel do utilizador na família.
    /// </summary>
    public string Role { get; set; } = null!;
}
