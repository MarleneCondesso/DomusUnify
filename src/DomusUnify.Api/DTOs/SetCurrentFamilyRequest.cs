namespace DomusUnify.Api.DTOs.Families;

/// <summary>
/// Pedido para definir a família ativa (contexto atual) do utilizador autenticado.
/// </summary>
public sealed class SetCurrentFamilyRequest
{
    /// <summary>
    /// Identificador da família a definir como ativa.
    /// </summary>
    public Guid FamilyId { get; set; }
}
