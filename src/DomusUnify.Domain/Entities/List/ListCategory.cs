using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma categoria de listas (agrupamento) na família.
/// </summary>
public class ListCategory : BaseEntity
{
    /// <summary>
    /// Identificador da família.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Família associada.
    /// </summary>
    public Family Family { get; set; } = null!;

    /// <summary>
    /// Nome da categoria.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da categoria.
    /// </summary>
    public string IconKey { get; set; } = "tag";

    /// <summary>
    /// Cor em hexadecimal (opcional).
    /// </summary>
    public string? ColorHex { get; set; } = "";

    /// <summary>
    /// Ordem de apresentação.
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Listas associadas a esta categoria.
    /// </summary>
    public ICollection<SharedList> Lists { get; set; } = new List<SharedList>();
}
