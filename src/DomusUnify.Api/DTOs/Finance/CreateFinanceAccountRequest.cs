namespace DomusUnify.Api.DTOs.Finance;

public sealed class CreateFinanceAccountRequest
{
    public string Type { get; set; } = "Checking";
    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = "credit-card";
    public int SortOrder { get; set; } = 0;
}

