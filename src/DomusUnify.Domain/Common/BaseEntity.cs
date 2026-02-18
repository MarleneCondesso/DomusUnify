namespace DomusUnify.Domain.Common;

/// <summary>
/// Entidade base com campos comuns (identificador e auditoria temporal).
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Identificador único da entidade.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Data/hora de criação (UTC).
    /// </summary>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Data/hora da última atualização (UTC), se aplicável.
    /// </summary>
    public DateTime? UpdatedAtUtc { get; set; }
}
