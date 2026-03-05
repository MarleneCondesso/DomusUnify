using System.Text.RegularExpressions;
using DomusUnify.Api.DTOs.Users;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints relacionados com o utilizador autenticado.
/// </summary>
[ApiController]
[Route("api/v1/users")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    private static readonly Regex HexColorRegex = new(@"^#[0-9a-fA-F]{6}$", RegexOptions.Compiled);

    private readonly DomusUnifyDbContext _db;
    private readonly ICurrentUserContext _ctx;

    public UsersController(DomusUnifyDbContext db, ICurrentUserContext ctx)
    {
        _db = db;
        _ctx = ctx;
    }

    /// <summary>
    /// Obtém o perfil do utilizador autenticado.
    /// </summary>
    [HttpGet("me/profile")]
    public async Task<ActionResult<UserProfileResponse>> GetMyProfile(CancellationToken ct)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == _ctx.UserId, ct);

        if (user is null) return Unauthorized();

        return Ok(ToProfileResponse(user));
    }

    /// <summary>
    /// Atualiza o perfil do utilizador autenticado.
    /// </summary>
    /// <remarks>
    /// Define os campos recebidos; valores vazios são normalizados para <c>null</c>.
    /// </remarks>
    [HttpPut("me/profile")]
    public async Task<ActionResult<UserProfileResponse>> UpdateMyProfile(UpdateUserProfileRequest request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == _ctx.UserId, ct);
        if (user is null) return Unauthorized();

        var displayName = NormalizeOptional(request.DisplayName);
        if (displayName?.Length > 120) return BadRequest("DisplayName demasiado longo.");

        var profileColorHex = NormalizeOptional(request.ProfileColorHex);
        if (profileColorHex is not null && !HexColorRegex.IsMatch(profileColorHex))
            return BadRequest("ProfileColorHex inválido (usa #RRGGBB).");

        var gender = NormalizeOptional(request.Gender)?.ToLowerInvariant();
        if (gender is not null && gender is not "female" && gender is not "male" && gender is not "other")
            return BadRequest("Gender inválido.");

        var phone = NormalizeOptional(request.Phone);
        if (phone?.Length > 30) return BadRequest("Phone demasiado longo.");

        var address = NormalizeOptional(request.Address);
        if (address?.Length > 240) return BadRequest("Address demasiado longo.");

        user.DisplayName = displayName;
        user.ProfileColorHex = profileColorHex;
        user.Birthday = request.Birthday;
        user.Gender = gender;
        user.Phone = phone;
        user.Address = address;
        user.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(ToProfileResponse(user));
    }

    private static string? NormalizeOptional(string? value)
    {
        var trimmed = (value ?? string.Empty).Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static UserProfileResponse ToProfileResponse(DomusUnify.Domain.Entities.User user)
    {
        return new UserProfileResponse
        {
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            DisplayName = user.DisplayName,
            ProfileColorHex = user.ProfileColorHex,
            Birthday = user.Birthday,
            Gender = user.Gender,
            Phone = user.Phone,
            Address = user.Address,
        };
    }
}

