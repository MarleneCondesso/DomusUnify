namespace DomusUnify.Api.DTOs.Finance;

public sealed class CreateFinanceCategoryRequest
{
    public string Type { get; set; } = "Expense";
    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = "tag";
    public int SortOrder { get; set; } = 0;
}

