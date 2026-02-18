namespace DomusUnify.Api.DTOs.Families;

/// <summary>
/// Pedido para criar uma nova família.
/// </summary>
public sealed class CreateFamilyRequest
{
    /// <summary>
    /// Nome da família.
    /// </summary>
    public string Name { get; set; } = null!;
}
