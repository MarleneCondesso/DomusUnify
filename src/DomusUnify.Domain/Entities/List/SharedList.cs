using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma lista partilhada numa família (ex.: compras, tarefas, personalizada).
/// </summary>
public class SharedList : BaseEntity
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
    /// Identificador do utilizador proprietário (criador).
    /// </summary>
    public Guid OwnerUserId { get; set; }

    /// <summary>
    /// Utilizador proprietário (criador).
    /// </summary>
    public User OwnerUser { get; set; } = null!;

    /// <summary>
    /// Cor da lista em hexadecimal (opcional).
    /// </summary>
    public string? ColorHex { get; set; }

    /// <summary>
    /// Nome da lista.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Tipo de lista.
    /// </summary>
    public ListType Type { get; set; } = ListType.Custom;

    /// <summary>
    /// URL da imagem de capa da lista (gerada automaticamente).
    /// </summary>
    public string? CoverImageUrl { get; set; }

    /// <summary>
    /// Modo de visibilidade da lista dentro da família.
    /// </summary>
    public ListVisibilityMode VisibilityMode { get; set; } = ListVisibilityMode.AllMembers;

    /// <summary>
    /// Lista de utilizadores com acesso explícito quando a visibilidade é por membros específicos.
    /// </summary>
    public ICollection<SharedListUserAccess> AllowedUsers { get; set; } = new List<SharedListUserAccess>();

    /// <summary>
    /// Itens da lista.
    /// </summary>
    public ICollection<ListItem> Items { get; set; } = new List<ListItem>();
}
