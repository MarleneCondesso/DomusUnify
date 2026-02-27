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

    /// <summary>
    /// Identificador do utilizador a quem o item estÃ¡ atribuÃ­do (opcional).
    /// </summary>
    /// <remarks>
    /// Tipicamente Ã© um GUID; Ã© recebido como JSON para suportar pedidos onde o valor pode vir nulo/variÃ¡vel.
    /// </remarks>
    public JsonElement? AssigneeUserId { get; set; }

    /// <summary>
    /// Nota do item (opcional).
    /// </summary>
    /// <remarks>
    /// Recebido como JSON para distinguir entre "nÃ£o alterar" (propriedade ausente) e "limpar" (null).
    /// </remarks>
    public JsonElement? Note { get; set; }

    /// <summary>
    /// URL (ou data URL) da foto do item (opcional).
    /// </summary>
    /// <remarks>
    /// Recebido como JSON para distinguir entre "nÃ£o alterar" (propriedade ausente) e "limpar" (null).
    /// </remarks>
    public JsonElement? PhotoUrl { get; set; }
}
