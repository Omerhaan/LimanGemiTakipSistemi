using System.ComponentModel.DataAnnotations;

namespace LimanGemiTakip.Api.Models.Auth;

public class LoginRequestDto
{
    [Required(ErrorMessage = "Kullanıcı adı zorunludur.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifre zorunludur.")]
    public string Password { get; set; } = string.Empty;
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int? PortId { get; set; }
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public UserDto User { get; set; } = new();
    public int Id => User?.Id ?? 0;
    public string Username => User?.Username ?? string.Empty;
    public string Email => User?.Email ?? string.Empty;
    public string Role => User?.Role ?? string.Empty;
    public string FullName => User?.FullName ?? string.Empty;
    public int? PortId => User?.PortId;
    public DateTime ExpiresAt { get; set; }
}

public class RefreshTokenRequestDto
{
    [Required(ErrorMessage = "Access token zorunludur.")]
    public string AccessToken { get; set; } = string.Empty;

    [Required(ErrorMessage = "Refresh token zorunludur.")]
    public string RefreshToken { get; set; } = string.Empty;
}

public class LogoutRequestDto
{
    public string? RefreshToken { get; set; }
}
