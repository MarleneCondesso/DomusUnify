namespace DomusUnify.Api.DTOs.Categories;

public sealed class CreateCategoryRequest
{
    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = "tag";
   // public string? ColorHex { get; set; }
    public int SortOrder { get; set; } = 0;
}
