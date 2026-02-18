namespace DomusUnify.Api.DTOs.Finance;

public sealed class CategorySummaryResponse
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string CategoryIconKey { get; set; } = null!;
    public decimal Total { get; set; }
    public decimal Percentage { get; set; }
}

