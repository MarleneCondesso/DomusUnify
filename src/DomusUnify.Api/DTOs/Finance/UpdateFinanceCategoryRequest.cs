namespace DomusUnify.Api.DTOs.Finance;

public sealed class UpdateFinanceCategoryRequest
{
    public string? Name { get; set; }
    public string? IconKey { get; set; }
    public int? SortOrder { get; set; }
}

