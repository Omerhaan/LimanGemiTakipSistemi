using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Auth;
using LimanGemiTakip.Api.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace LimanGemiTakip.Api.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IConfiguration _configuration;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IRepository<User> userRepository,
        IConfiguration configuration,
        IAuditLogService auditLogService,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var username = request.Username.Trim();
        var user = await _userRepository.Query()
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());

        if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            await _auditLogService.LogAsync(
                "LOGIN_FAILED",
                "Auth",
                null,
                $"Başarısız giriş denemesi. Kullanıcı adı: {username}",
                username: username,
                isSuccess: false,
                severity: "WARNING");
            return null;
        }

        // OWASP A07: Kısa ömürlü Access Token (varsayılan 15 dakika)
        var expireMinutes = double.TryParse(_configuration["Jwt:ExpireMinutes"], out var exp) ? exp : 15;
        var expiresAt = DateTime.UtcNow.AddMinutes(expireMinutes);
        var token = GenerateJwtToken(user, expiresAt);

        // OWASP A07: Kriptografik güvenli Refresh Token ve tek kullanımlık rotasyon (7 gün)
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userRepository.UpdateAsync(user);

        await _auditLogService.LogAsync(
            "LOGIN_SUCCESS",
            "Auth",
            user.Id.ToString(),
            $"Başarılı oturum açıldı. Rol: {user.Role}",
            userId: user.Id.ToString(),
            username: user.Username,
            role: user.Role,
            severity: "INFO");

        return new LoginResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                FullName = user.FullName,
                PortId = user.PortId
            }
        };
    }

    public async Task<LoginResponseDto?> RefreshTokenAsync(RefreshTokenRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken)) return null;

        var user = await _userRepository.Query()
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

        if (user == null || !user.RefreshTokenExpiryTime.HasValue || user.RefreshTokenExpiryTime.Value <= DateTime.UtcNow)
        {
            await _auditLogService.LogAsync(
                "REFRESH_TOKEN_EXPIRED_OR_INVALID",
                "Auth",
                null,
                "Süresi dolmuş veya geçersiz refresh token ile yenileme denemesi engellendi.",
                isSuccess: false,
                severity: "WARNING");
            return null;
        }

        var expireMinutes = double.TryParse(_configuration["Jwt:ExpireMinutes"], out var exp) ? exp : 15;
        var expiresAt = DateTime.UtcNow.AddMinutes(expireMinutes);
        var newAccessToken = GenerateJwtToken(user, expiresAt);

        // Token Rotasyonu: Kullanılan refresh token hemen yenilenir
        var newRefreshToken = GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userRepository.UpdateAsync(user);

        await _auditLogService.LogAsync(
            "REFRESH_TOKEN_ROTATED",
            "Auth",
            user.Id.ToString(),
            "Oturum access token ve refresh token başarıyla yenilendi.",
            userId: user.Id.ToString(),
            username: user.Username,
            role: user.Role,
            severity: "INFO");

        return new LoginResponseDto
        {
            Token = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = expiresAt,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                FullName = user.FullName,
                PortId = user.PortId
            }
        };
    }

    public async Task<bool> LogoutAsync(string? username, string? refreshToken)
    {
        User? user = null;

        if (!string.IsNullOrWhiteSpace(username))
        {
            user = await _userRepository.Query()
                .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
        }
        else if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            user = await _userRepository.Query()
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
        }

        if (user != null)
        {
            // Token Revocation: Sunucu tarafında refresh token kalıcı olarak sıfırlanır
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _userRepository.UpdateAsync(user);

            await _auditLogService.LogAsync(
                "LOGOUT",
                "Auth",
                user.Id.ToString(),
                "Kullanıcı güvenli çıkış yaptı. Refresh token iptal edildi (Revocation).",
                userId: user.Id.ToString(),
                username: user.Username,
                role: user.Role,
                severity: "INFO");

            return true;
        }

        return false;
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            FullName = user.FullName,
            PortId = user.PortId
        };
    }

    private string GenerateJwtToken(User user, DateTime expiresAt)
    {
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException("Kritik Güvenlik Hatası: JWT imzalama anahtarı ('Jwt:Key') yapılandırmada bulunamadı.");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("FullName", user.FullName)
        };

        if (user.PortId.HasValue)
        {
            claims.Add(new Claim("PortId", user.PortId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "LimanGemiTakipApi",
            audience: _configuration["Jwt:Audience"] ?? "LimanGemiTakipApp",
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
