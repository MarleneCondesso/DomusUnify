namespace DomusUnify.Api.DTOs.Finance;

public sealed class UpdateFinanceAccountRequest
{
    public string? Name { get; set; }
    public string? IconKey { get; set; }
    public int? SortOrder { get; set; }
}

