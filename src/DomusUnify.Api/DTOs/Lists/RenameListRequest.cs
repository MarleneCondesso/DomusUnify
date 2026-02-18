namespace DomusUnify.Api.DTOs.Lists;

/// <summary>
/// Pedido para renomear uma lista.
/// </summary>
public sealed class RenameListRequest
{
    /// <summary>
    /// Novo nome da lista.
    /// </summary>
    public string Name { get; set; } = null!;
}
