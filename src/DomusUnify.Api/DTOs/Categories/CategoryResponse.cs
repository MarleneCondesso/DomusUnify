namespace DomusUnify.Api.DTOs.Categories;

public sealed class CategoryResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = null!;
    public int SortOrder { get; set; }
}
