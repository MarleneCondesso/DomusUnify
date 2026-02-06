using DomusUnify.Api.Auth;
using DomusUnify.Api.DTOs.Families;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Api.Controllers;

[ApiController]
[Route("api/v1/families")]
[Authorize]
public class FamiliesController : ControllerBase
{
    private readonly DomusUnifyDbContext _db;

    public FamiliesController(DomusUnifyDbContext db) => _db = db;

    /// <summary>
    /// Cria uma nova família e atribui o utilizador autenticado como administrador.
    /// </summary>
    /// <remarks>
    /// O nome da família é obrigatório. O utilizador torna-se membro com papel de admin.
    /// </remarks>
    /// <param name="request">O pedido contendo o nome da família.</param>
    /// <returns>A resposta da família criada.</returns>
    [HttpPost]
    public async Task<ActionResult<FamilyResponse>> CreateFamily(CreateFamilyRequest request)
    {
        var userId = User.GetUserId();

        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest("Nome da família é obrigatório.");

        // (opcional) limitar para 1 família por user no MVP
        // if (await _db.FamilyMembers.AnyAsync(m => m.UserId == userId))
        //     return BadRequest("Já pertence a uma família.");

        var family = new Family { Name = name };
        _db.Families.Add(family);

        var membership = new FamilyMember
        {
            FamilyId = family.Id,
            UserId = userId,
            Role = FamilyRole.Admin
        };

        _db.FamilyMembers.Add(membership);

        var user = await _db.Users.FirstAsync(u => u.Id == userId);
        user.CurrentFamilyId = family.Id;

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMyFamily), new { }, new FamilyResponse
        {
            Id = family.Id,
            Name = family.Name,
            Role = membership.Role.ToString()
        });
    }

    /// <summary>
    /// Obtém a família atual do utilizador autenticado.
    /// </summary>
    /// <remarks>
    /// Retorna a família definida como atual. Se não houver família ativa, sugere usar /api/v1/families/my para selecionar uma.
    /// </remarks>
    /// <returns>A resposta da família atual.</returns>
    // GET api/v1/families/me
    [HttpGet("me")]
    public async Task<ActionResult<FamilyResponse>> GetMyFamily()
    {
        var userId = User.GetUserId();

        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            return Unauthorized();

        if (user.CurrentFamilyId is null)
            return NotFound("Não tens família ativa. Usa /api/v1/families/my e seleciona uma.");

        var membership = await _db.FamilyMembers
            .AsNoTracking()
            .Include(m => m.Family)
            .FirstOrDefaultAsync(m => m.UserId == userId && m.FamilyId == user.CurrentFamilyId);

        if (membership is null)
            return NotFound("Família ativa inválida (não és membro).");

        return Ok(new FamilyResponse
        {
            Id = membership.Family.Id,
            Name = membership.Family.Name,
            Role = membership.Role.ToString()
        });
    }


    /// <summary>
    /// Obtém todas as famílias das quais o utilizador autenticado é membro.
    /// </summary>
    /// <remarks>
    /// Lista todas as famílias associadas ao utilizador, ordenadas por nome.
    /// </remarks>
    /// <returns>Uma lista de respostas de famílias.</returns>
    [HttpGet("my")]
    public async Task<ActionResult<List<FamilyResponse>>> GetMyFamilies()
    {
        var userId = User.GetUserId();

        var memberships = await _db.FamilyMembers
            .AsNoTracking()
            .Include(m => m.Family)
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.Family.Name)
            .ToListAsync();

        var result = memberships.Select(m => new FamilyResponse
        {
            Id = m.Family.Id,
            Name = m.Family.Name,
            Role = m.Role.ToString()
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// Define a família atual para o utilizador autenticado.
    /// </summary>
    /// <remarks>
    /// O utilizador deve ser membro da família especificada. Caso contrário, retorna erro de proibido.
    /// </remarks>
    /// <param name="request">O pedido contendo o ID da família a definir como atual.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpPost("set-current")]
    public async Task<IActionResult> SetCurrentFamily(SetCurrentFamilyRequest request)
    {
        var userId = User.GetUserId();

        var isMember = await _db.FamilyMembers
            .AnyAsync(m => m.UserId == userId && m.FamilyId == request.FamilyId);

        if (!isMember)
            return Forbid();

        var user = await _db.Users.FirstAsync(u => u.Id == userId);
        user.CurrentFamilyId = request.FamilyId;
        await _db.SaveChangesAsync();

        return NoContent();
    }

}
