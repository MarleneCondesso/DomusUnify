namespace DomusUnify.Api.DTOs.Lists;
using System.Text.Json;

/// <summary>
/// Pedido para atualizar um item de lista.
/// </summary>
public sealed class UpdateListItemRequest
{
    /// <summary>
    /// Novo nome do item (opcional).
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Indica se o item passa a estar concluído (opcional).
    /// </summary>
    public bool? IsCompleted { get; set; }

    /// <summary>
    /// Identificador da categoria do item (opcional).
    /// </summary>
    /// <remarks>
    /// Tipicamente é um GUID; é recebido como JSON para suportar pedidos onde o valor pode vir nulo/variável.
    /// </remarks>
    public JsonElement? CategoryId { get; set; }
}
