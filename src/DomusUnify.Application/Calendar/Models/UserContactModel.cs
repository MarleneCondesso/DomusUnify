namespace DomusUnify.Application.Calendar.Models;

/// <summary>
/// Modelo de contacto simplificado de um utilizador (nome e email).
/// </summary>
/// <param name="UserId">Identificador do utilizador.</param>
/// <param name="Name">Nome do utilizador.</param>
/// <param name="Email">Email do utilizador.</param>
public sealed record UserContactModel(
    Guid UserId,
    string Name,
    string Email
);
