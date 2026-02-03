namespace DomusUnify.Api.DTOs.Categories;

public sealed class UpdateCategoryRequest
{
    public string? Name { get; set; }
    public string? IconKey { get; set; }
    public string? ColorHex { get; set; }
    public int? SortOrder { get; set; }
}
