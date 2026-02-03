namespace DomusUnify.Api.DTOs.Lists;
using System.Text.Json;

public sealed class UpdateListItemRequest
{
    public string? Name { get; set; }
    public bool? IsCompleted { get; set; }
    public JsonElement? CategoryId { get; set; }
}
