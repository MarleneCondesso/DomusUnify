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
    /// Nome de exibição (opcional). Se definido, pode sobrepor o <see cref="Name"/> no frontend.
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// Cor do perfil (hex), ex.: <c>#8b5cf6</c> (opcional).
    /// </summary>
    public string? ProfileColorHex { get; set; }

    /// <summary>
    /// Data de aniversário (opcional).
    /// </summary>
    public DateOnly? Birthday { get; set; }

    /// <summary>
    /// Género (opcional): <c>female</c>, <c>male</c>, <c>other</c>.
    /// </summary>
    public string? Gender { get; set; }

    /// <summary>
    /// Telefone (opcional).
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// Morada/endereço (opcional).
    /// </summary>
    public string? Address { get; set; }

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
    public ICollection<CalendarEvent> CreatedEvents { get; set; } = new List<CalendarEvent>();

    /// <summary>
    /// Logins externos associados ao utilizador.
    /// </summary>
    public ICollection<UserExternalLogin> ExternalLogins { get; set; } = new List<UserExternalLogin>();
}
