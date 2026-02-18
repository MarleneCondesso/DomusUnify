namespace DomusUnify.Api.DTOs.Finance;

public sealed class MemberSummaryResponse
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public decimal Total { get; set; }
    public decimal Percentage { get; set; }
}

