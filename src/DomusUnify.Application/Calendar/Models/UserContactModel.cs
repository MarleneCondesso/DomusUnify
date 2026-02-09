namespace DomusUnify.Application.Calendar.Models;

public sealed record UserContactModel(
    Guid UserId,
    string Name,
    string Email
);
