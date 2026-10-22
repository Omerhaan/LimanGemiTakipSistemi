using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Auth;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Microsoft.Extensions.Logging;

namespace LimanGemiTakip.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        var repo = new Repository<User>(_context);

        var configValues = new Dictionary<string, string?>
        {
            { "Jwt:Key", "TestSecretKeyThatIsAtLeast32BytesLongForHmacSha256!" },
            { "Jwt:Issuer", "TestIssuer" },
            { "Jwt:Audience", "TestAudience" },
            { "Jwt:ExpireMinutes", "60" }
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        var auditLogMock = new Mock<IAuditLogService>();
        var loggerMock = new Mock<ILogger<AuthService>>();

        _authService = new AuthService(repo, configuration, auditLogMock.Object, loggerMock.Object);

        SeedTestUsers();
    }

    private void SeedTestUsers()
    {
        _context.Users.AddRange(
            new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@test.com",
                PasswordHash = PasswordHasher.HashPassword("Admin123!"),
                Role = "Admin",
                FullName = "Admin User"
            },
            new User
            {
                Id = 2,
                Username = "operator",
                Email = "operator@test.com",
                PasswordHash = PasswordHasher.HashPassword("Operator123!"),
                Role = "Operator",
                FullName = "Operator User"
            },
            new User
            {
                Id = 3,
                Username = "viewer",
                Email = "viewer@test.com",
                PasswordHash = PasswordHasher.HashPassword("Viewer123!"),
                Role = "Viewer",
                FullName = "Viewer User"
            }
        );
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public void PasswordHasher_ShouldVerifyCorrectPassword()
    {
        var password = "SecureSecretPassword!2026";
        var hash = PasswordHasher.HashPassword(password);

        Assert.True(PasswordHasher.VerifyPassword(password, hash));
        Assert.False(PasswordHasher.VerifyPassword("WrongPassword", hash));
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsTokenAndUserDto()
    {
        var request = new LoginRequestDto
        {
            Username = "admin",
            Password = "Admin123!"
        };

        var response = await _authService.LoginAsync(request);

        Assert.NotNull(response);
        Assert.False(string.IsNullOrWhiteSpace(response.Token));
        Assert.Equal("admin", response.User.Username);
        Assert.Equal("Admin", response.User.Role);
        Assert.Equal("Admin User", response.User.FullName);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ReturnsNull()
    {
        var request = new LoginRequestDto
        {
            Username = "admin",
            Password = "WrongPassword!"
        };

        var response = await _authService.LoginAsync(request);

        Assert.Null(response);
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentUser_ReturnsNull()
    {
        var request = new LoginRequestDto
        {
            Username = "nonexistent",
            Password = "SomePassword123!"
        };

        var response = await _authService.LoginAsync(request);

        Assert.Null(response);
    }

    [Fact]
    public async Task LoginAsync_WhenJwtKeyIsMissing_ThrowsInvalidOperationException()
    {
        var emptyConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var repo = new Repository<User>(_context);
        var auditLogMock = new Mock<IAuditLogService>();
        var loggerMock = new Mock<ILogger<AuthService>>();
        var serviceWithEmptyConfig = new AuthService(repo, emptyConfig, auditLogMock.Object, loggerMock.Object);

        var request = new LoginRequestDto
        {
            Username = "admin",
            Password = "Admin123!"
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => serviceWithEmptyConfig.LoginAsync(request));
    }
}
