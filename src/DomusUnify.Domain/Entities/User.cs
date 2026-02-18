using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa um utilizador da aplicação.
/// </summary>
public class User : BaseEntity
{
    /// <summary>
    /// Nome do utilizador.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Endereço de email (único).
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// Hash da palavra-passe.
    /// </summary>
    public string PasswordHash { get; set; } = null!;

    /// <summary>
    /// Identificador da família atualmente ativa para este utilizador (opcional).
    /// </summary>
    public Guid? CurrentFamilyId { get; set; }

    /// <summary>
    /// Família atualmente ativa (opcional).
    /// </summary>
    public Family? CurrentFamily { get; set; }

    /// <summary>
    /// Associações do utilizador a famílias.
    /// </summary>
    public ICollection<FamilyMember> FamilyMemberships { get; set; } = new List<FamilyMember>();

    /// <summary>
    /// Eventos de calendário criados pelo utilizador.
    /// </summary>
    public ICollection<CalendarEvent> CreatedEvents  { get; set; } = new List<CalendarEvent>();
}
