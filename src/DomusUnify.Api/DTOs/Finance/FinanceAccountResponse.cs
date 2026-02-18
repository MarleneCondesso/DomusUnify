namespace DomusUnify.Api.DTOs.Finance;

public sealed class FinanceAccountResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = null!;
    public int SortOrder { get; set; }
}

