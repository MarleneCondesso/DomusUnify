using DomusUnify.Api.Auth;
using DomusUnify.Api.DTOs.Families;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Family;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints de gestão de famílias (criação, seleção da família atual e listagens).
/// </summary>
/// <remarks>
/// A maioria dos endpoints opera sobre a “família atual” do utilizador autenticado, definida em <c>/set-current</c>.
/// </remarks>
[ApiController]
[Route("api/v1/families")]
[Authorize]
public class FamiliesController : ControllerBase
{
    private readonly DomusUnifyDbContext _db;
    private readonly IFamilyInviteService _svc;
    private readonly ICurrentUserContext _ctx;


    public FamiliesController(DomusUnifyDbContext db, IFamilyInviteService svc, ICurrentUserContext ctx) => (_db, _svc, _ctx) = (db, svc, ctx);

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
    /// Cria um convite para uma família.
    /// </summary>
    /// <remarks>
    /// O utilizador autenticado deve ter permissões na família indicada. O convite tem validade limitada e pode ter um
    /// número máximo de utilizações.
    /// </remarks>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="daysValid">Número de dias de validade do convite (por omissão, 7).</param>
    /// <param name="maxUses">Número máximo de utilizações (opcional).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Dados do convite criado.</returns>
    [HttpPost("{familyId:guid}/invites")]
    public async Task<ActionResult<CreateInviteResult>> CreateInvite(Guid familyId, [FromQuery] int daysValid = 7, [FromQuery] int? maxUses = null, CancellationToken ct = default)
    {
        var res = await _svc.CreateInviteAsync(_ctx.UserId, familyId, daysValid, maxUses, ct);
        return Ok(res);
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

    /// <summary>
    /// Lista os membros da família atual (para seleções como "visível para" e "pago por").
    /// </summary>
    /// <remarks>
    /// Devolve os utilizadores membros da família atual, com o respetivo papel (Admin/Member/Viewer).
    /// </remarks>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de membros da família atual.</returns>
    [HttpGet("members")]
    public async Task<ActionResult<List<FamilyMemberResponse>>> GetCurrentFamilyMembers(CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var isMember = await _db.FamilyMembers
            .AsNoTracking()
            .AnyAsync(m => m.FamilyId == familyId && m.UserId == _ctx.UserId, ct);

        if (!isMember) return Forbid();

        var rows = await _db.FamilyMembers
            .AsNoTracking()
            .Include(m => m.User)
            .Where(m => m.FamilyId == familyId)
            .OrderBy(m => m.User.Name)
            .Select(m => new FamilyMemberResponse
            {
                UserId = m.UserId,
                Name = m.User.Name,
                Email = m.User.Email,
                Role = m.Role.ToString()
            })
            .ToListAsync(ct);

        return Ok(rows);
    }

    /// <summary>
    /// ObtÃ©m uma famÃ­lia especÃ­fica (apenas se o utilizador autenticado for membro).
    /// </summary>
    /// <param name="familyId">Identificador da famÃ­lia.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Dados da famÃ­lia no contexto do utilizador.</returns>
    [HttpGet("{familyId:guid}")]
    public async Task<ActionResult<FamilyResponse>> GetFamilyById(Guid familyId, CancellationToken ct)
    {
        var userId = User.GetUserId();

        var membership = await _db.FamilyMembers
            .AsNoTracking()
            .Include(m => m.Family)
            .FirstOrDefaultAsync(m => m.FamilyId == familyId && m.UserId == userId, ct);

        if (membership is null) return Forbid();

        return Ok(new FamilyResponse
        {
            Id = membership.Family.Id,
            Name = membership.Family.Name,
            Role = membership.Role.ToString()
        });
    }

    /// <summary>
    /// Lista os membros de uma famÃ­lia especÃ­fica (apenas se o utilizador autenticado for membro).
    /// </summary>
    /// <param name="familyId">Identificador da famÃ­lia.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de membros.</returns>
    [HttpGet("{familyId:guid}/members")]
    public async Task<ActionResult<List<FamilyMemberResponse>>> GetFamilyMembersByFamilyId(Guid familyId, CancellationToken ct)
    {
        var userId = User.GetUserId();

        var isMember = await _db.FamilyMembers
            .AsNoTracking()
            .AnyAsync(m => m.FamilyId == familyId && m.UserId == userId, ct);

        if (!isMember) return Forbid();

        var rows = await _db.FamilyMembers
            .AsNoTracking()
            .Include(m => m.User)
            .Where(m => m.FamilyId == familyId)
            .OrderBy(m => m.User.Name)
            .Select(m => new FamilyMemberResponse
            {
                UserId = m.UserId,
                Name = m.User.Name,
                Email = m.User.Email,
                Role = m.Role.ToString()
            })
            .ToListAsync(ct);

        return Ok(rows);
    }

    /// <summary>
    /// ObtÃ©m o perfil de um membro dentro de uma famÃ­lia especÃ­fica.
    /// </summary>
    /// <remarks>
    /// O utilizador autenticado tem de ser membro da famÃ­lia indicada.
    /// </remarks>
    /// <param name="familyId">Identificador da famÃ­lia.</param>
    /// <param name="userId">Identificador do membro.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Perfil do membro.</returns>
    [HttpGet("{familyId:guid}/members/{userId:guid}/profile")]
    public async Task<ActionResult<FamilyMemberProfileResponse>> GetFamilyMemberProfile(Guid familyId, Guid userId, CancellationToken ct)
    {
        var actorRole = await GetUserRoleInFamilyAsync(familyId, _ctx.UserId, ct);
        if (actorRole is null) return Forbid();

        var row = await _db.FamilyMembers
            .AsNoTracking()
            .Include(m => m.User)
            .Where(m => m.FamilyId == familyId && m.UserId == userId)
            .Select(m => new FamilyMemberProfileResponse
            {
                UserId = m.UserId,
                Name = m.User.Name,
                Email = m.User.Email,
                DisplayName = m.User.DisplayName,
                ProfileColorHex = m.User.ProfileColorHex,
                Birthday = m.User.Birthday,
                Role = m.Role.ToString()
            })
            .FirstOrDefaultAsync(ct);

        if (row is null) return NotFound();
        return Ok(row);
    }

    /// <summary>
    /// Promove um membro a administrador (apenas admins da famÃ­lia).
    /// </summary>
    /// <param name="familyId">Identificador da famÃ­lia.</param>
    /// <param name="userId">Identificador do utilizador a promover.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteÃºdo se bem-sucedido.</returns>
    [HttpPost("{familyId:guid}/members/{userId:guid}/make-admin")]
    public async Task<IActionResult> MakeMemberAdmin(Guid familyId, Guid userId, CancellationToken ct)
    {
        var actorUserId = User.GetUserId();

        var actorRole = await GetUserRoleInFamilyAsync(familyId, actorUserId, ct);
        if (actorRole != FamilyRole.Admin) return Forbid();

        var membership = await _db.FamilyMembers
            .FirstOrDefaultAsync(m => m.FamilyId == familyId && m.UserId == userId, ct);

        if (membership is null) return NotFound();

        if (membership.Role != FamilyRole.Admin)
        {
            membership.Role = FamilyRole.Admin;
            membership.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        return NoContent();
    }

    /// <summary>
    /// Remove um membro de uma famÃ­lia (apenas admins da famÃ­lia).
    /// </summary>
    /// <param name="familyId">Identificador da famÃ­lia.</param>
    /// <param name="userId">Identificador do utilizador a remover.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteÃºdo se bem-sucedido.</returns>
    [HttpDelete("{familyId:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid familyId, Guid userId, CancellationToken ct)
    {
        var actorUserId = User.GetUserId();

        var actorRole = await GetUserRoleInFamilyAsync(familyId, actorUserId, ct);
        if (actorRole != FamilyRole.Admin) return Forbid();

        var membership = await _db.FamilyMembers
            .FirstOrDefaultAsync(m => m.FamilyId == familyId && m.UserId == userId, ct);

        if (membership is null) return NotFound();

        if (membership.Role == FamilyRole.Admin)
        {
            var adminCount = await _db.FamilyMembers
                .AsNoTracking()
                .CountAsync(m => m.FamilyId == familyId && m.Role == FamilyRole.Admin, ct);

            if (adminCount <= 1)
                return BadRequest("NÃ£o podes remover o Ãºltimo administrador. Promove outro membro ou elimina o grupo.");
        }

        _db.FamilyMembers.Remove(membership);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is not null && user.CurrentFamilyId == familyId)
        {
            user.CurrentFamilyId = null;
            user.UpdatedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>
    /// Elimina uma famÃ­lia (grupo) e todos os seus dados (apenas admins da famÃ­lia).
    /// </summary>
    /// <param name="familyId">Identificador da famÃ­lia.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteÃºdo se bem-sucedido.</returns>
    [HttpDelete("{familyId:guid}")]
    public async Task<IActionResult> DeleteFamily(Guid familyId, CancellationToken ct)
    {
        var actorUserId = User.GetUserId();

        var actorRole = await GetUserRoleInFamilyAsync(familyId, actorUserId, ct);
        if (actorRole != FamilyRole.Admin) return Forbid();

        var exists = await _db.Families.AsNoTracking().AnyAsync(f => f.Id == familyId, ct);
        if (!exists) return NotFound();

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var now = DateTime.UtcNow;

        // Solta a FK (Restrict) de CurrentFamilyId antes de apagar a famÃ­lia
        await _db.Users
            .Where(u => u.CurrentFamilyId == familyId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.CurrentFamilyId, (Guid?)null)
                .SetProperty(u => u.UpdatedAtUtc, now), ct);

        // ActivityEntries estÃ¡ com DeleteBehavior.NoAction -> temos de remover manualmente
        await _db.ActivityEntries
            .Where(a => a.FamilyId == familyId)
            .ExecuteDeleteAsync(ct);

        await _db.Families
            .Where(f => f.Id == familyId)
            .ExecuteDeleteAsync(ct);

        await tx.CommitAsync(ct);
        return NoContent();
    }

    private async Task<FamilyRole?> GetUserRoleInFamilyAsync(Guid familyId, Guid userId, CancellationToken ct)
    {
        return await _db.FamilyMembers
            .AsNoTracking()
            .Where(m => m.FamilyId == familyId && m.UserId == userId)
            .Select(m => (FamilyRole?)m.Role)
            .FirstOrDefaultAsync(ct);
    }

}
