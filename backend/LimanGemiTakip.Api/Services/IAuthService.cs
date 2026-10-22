using LimanGemiTakip.Api.Models.Auth;

namespace LimanGemiTakip.Api.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
    Task<UserDto?> GetUserByIdAsync(int id);
    Task<LoginResponseDto?> RefreshTokenAsync(RefreshTokenRequestDto request);
    Task<bool> LogoutAsync(string? username, string? refreshToken);
}
