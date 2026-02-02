using DomusUnify.Domain.Entities;

namespace DomusUnify.Api.Services.Auth;

public interface IJwtTokenService
{
    (string token, DateTime expiresAtUtc) CreateToken(User user);
}
