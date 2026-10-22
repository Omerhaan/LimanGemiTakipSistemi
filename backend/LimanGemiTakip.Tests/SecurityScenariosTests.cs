using System.Security.Claims;
using LimanGemiTakip.Api.Controllers;
using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Auth;
using LimanGemiTakip.Api.Models.Security;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LimanGemiTakip.Tests;

public class SecurityScenariosTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly SecurityDemoController _controller;
    private readonly Mock<IAuditLogService> _auditMock;
    private readonly Mock<ILogger<SecurityDemoController>> _loggerMock;
    private readonly Mock<IWebHostEnvironment> _envMock;

    public SecurityScenariosTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _auditMock = new Mock<IAuditLogService>();
        _loggerMock = new Mock<ILogger<SecurityDemoController>>();
        _envMock = new Mock<IWebHostEnvironment>();
        _envMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        _controller = new SecurityDemoController(_context, _auditMock.Object, _loggerMock.Object, _envMock.Object);

        // SeedTestData
        _context.Ports.Add(new Port { Id = 1, Name = "Ambarlı Limanı", Code = "TRAMB", Country = "Türkiye", City = "İstanbul" });
        _context.Ports.Add(new Port { Id = 2, Name = "Mersin Uluslararası Limanı", Code = "TRMER", Country = "Türkiye", City = "Mersin" });
        _context.Ships.Add(new Ship { Id = 1, Name = "Barbaros Express", ImoNumber = "9176187", Type = "Konteyner", Flag = "Türkiye" });
        _context.Ships.Add(new Ship { Id = 2, Name = "Marmara Voyager", ImoNumber = "9241061", Type = "Tanker", Flag = "Türkiye" });
        _context.CrewMembers.Add(new CrewMember { Id = 1, FirstName = "Ahmet", LastName = "Yılmaz", Role = "Kaptan", Email = "ahmet@test.com", Phone = "+90 532 111 2233", Nationality = "T.C." });
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    private void SetUserContext(string username, string role, int? portId = null)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role)
        };
        if (portId.HasValue)
        {
            claims.Add(new Claim("PortId", portId.Value.ToString()));
        }

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    [Fact]
    public void Senaryo1_BrokenAccessControl_Vulnerable_AllowsAnonymousAccess()
    {
        // Act
        var result = _controller.AccessControlVulnerable() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.Equal("VULNERABLE", data.Mode);
        Assert.True(data.IsVulnerabilityExploited);
    }

    [Fact]
    public async Task Senaryo1_BrokenAccessControl_Secure_LogsAuditWhenAuthorized()
    {
        // Arrange
        SetUserContext("adminUser", "Admin");

        // Act
        var result = await _controller.AccessControlSecure() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.Equal("SECURE", data.Mode);
        Assert.False(data.IsVulnerabilityExploited);

        _auditMock.Verify(a => a.LogAsync(
            "SECURE_RESOURCE_ACCESSED",
            "SecurityLab",
            null,
            It.IsAny<string>(),
            It.IsAny<string>(),
            "adminUser",
            "Admin",
            It.IsAny<string>(),
            It.IsAny<string>(),
            true,
            "INFO"), Times.Once);
    }

    [Fact]
    public async Task Senaryo2_Idor_Vulnerable_AllowsAccessingOtherPortData()
    {
        // Act
        var result = await _controller.IdorVulnerable(1) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.True(data.IsVulnerabilityExploited);
        Assert.Equal("VULNERABLE", data.Mode);
    }

    [Fact]
    public async Task Senaryo2_Idor_Secure_BlocksUnauthorizedPortAndLogsCriticalAudit()
    {
        // Arrange: Kullanıcı Port 2 yetkilisi, ancak Port 1'i talep ediyor!
        SetUserContext("portManagerMersin", "PortManager", portId: 2);

        // Act
        var result = await _controller.IdorSecure(1) as ObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(StatusCodes.Status403Forbidden, result.StatusCode);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.False(data.IsVulnerabilityExploited);

        // IDOR girişimi Audit Log'a CRITICAL olarak işlenmeli
        _auditMock.Verify(a => a.LogAsync(
            "IDOR_ATTEMPT_BLOCKED",
            "Port",
            "1",
            It.Is<string>(d => d.Contains("IDOR Girişimi Engellendi")),
            It.IsAny<string>(),
            "portManagerMersin",
            "PortManager",
            It.IsAny<string>(),
            It.IsAny<string>(),
            false,
            "CRITICAL"), Times.Once);
    }

    [Fact]
    public async Task Senaryo3_Sqli_Secure_EvaluatesSearchTermAsLiteralString()
    {
        // Act
        var result = await _controller.SqliSecure("' OR '1'='1") as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.Equal("SECURE", data.Mode);
        Assert.False(data.IsVulnerabilityExploited);
    }

    [Fact]
    public async Task Senaryo4_SensitiveData_Secure_MasksDataForOperator()
    {
        // Arrange
        SetUserContext("operatorUser", "Operator");

        // Act
        var result = await _controller.SensitiveDataSecure() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.Equal("SECURE", data.Mode);

        var list = (data.Data as IEnumerable<CrewMaskedDto>)?.ToList();
        Assert.NotNull(list);
        Assert.NotEmpty(list);
        Assert.Contains("***", list.First().MaskedPhone);
        Assert.Contains("***", list.First().MaskedEmail);
    }

    [Fact]
    public void Senaryo5_MassAssignment_Secure_IgnoresAttackerRoleAndAssignsViewer()
    {
        // Arrange
        var maliciousRequest = new VulnerableUserRegisterDto
        {
            Username = "hacker",
            Email = "hacker@test.com",
            Password = "Password123!",
            Role = "Admin", // Attacker injected role
            IsAdmin = true
        };

        // Act
        var result = _controller.MassAssignmentSecure(maliciousRequest) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.False(data.IsVulnerabilityExploited);
        Assert.Equal("SECURE", data.Mode);
    }

    [Fact]
    public void Senaryo8_FileUpload_Secure_RejectsExecutableFiles()
    {
        // Arrange: Zararlı .exe dosyası simülasyonu
        var formFileMock = new Mock<IFormFile>();
        formFileMock.Setup(f => f.FileName).Returns("exploit.exe");
        formFileMock.Setup(f => f.Length).Returns(1024);

        // Act
        var result = _controller.FileUploadSecure(formFileMock.Object) as BadRequestObjectResult;

        // Assert
        Assert.NotNull(result);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.False(data.IsVulnerabilityExploited);
        Assert.Contains("GEÇERSİZ DOSYA TİPİ", data.ResultMessage);
    }

    [Fact]
    public void Senaryo8_FileUpload_Secure_AcceptsPdfAndAssignsSafeGuidName()
    {
        // Arrange
        var formFileMock = new Mock<IFormFile>();
        formFileMock.Setup(f => f.FileName).Returns("manifest.pdf");
        formFileMock.Setup(f => f.Length).Returns(1024 * 50);

        // Act
        var result = _controller.FileUploadSecure(formFileMock.Object) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.False(data.IsVulnerabilityExploited);
        Assert.Contains(".pdf", data.ResultMessage);
    }

    [Fact]
    public void Senaryo9_Xss_Secure_EncodesAndStripsScriptTags()
    {
        // Arrange
        var input = new XssInputDto
        {
            ShipName = "Test Gemi",
            Description = "<script>alert('XSS Saldırısı!')</script><b>Normal Metin</b>"
        };

        // Act
        var result = _controller.XssSecure(input) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.False(data.IsVulnerabilityExploited);
        Assert.Contains("&lt;script&gt;", data.Data!.ToString());
    }

    [Fact]
    public void Senaryo10_Dos_Secure_CapsPageSizeToMaximum100()
    {
        // Act: Saldırgan 1.000.000 kayıt talep ediyor
        var result = _controller.DosSecure(pageSize: 1000000) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var data = result.Value as SecurityScenarioResultDto;
        Assert.NotNull(data);
        Assert.False(data.IsVulnerabilityExploited);
        Assert.Contains("en fazla 100 kayıt", data.ResultMessage);
    }

    [Fact]
    public async Task RefreshToken_Rotation_WorksCorrectly()
    {
        // Arrange
        var repo = new Repository<User>(_context);
        var configValues = new Dictionary<string, string?>
        {
            { "Jwt:Key", "SuperSecretKeyForTestingJwtTokenValidation123!" },
            { "Jwt:Issuer", "TestIssuer" },
            { "Jwt:Audience", "TestAudience" },
            { "Jwt:ExpireMinutes", "15" }
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(configValues).Build();
        var authService = new AuthService(repo, config, _auditMock.Object, Mock.Of<ILogger<AuthService>>());

        // Kullanıcı giriş yapar
        _context.Users.Add(new User
        {
            Username = "testUser",
            Email = "test@test.com",
            PasswordHash = PasswordHasher.HashPassword("Pass123!"),
            Role = "Operator"
        });
        await _context.SaveChangesAsync();

        var loginResult = await authService.LoginAsync(new LoginRequestDto { Username = "testUser", Password = "Pass123!" });
        Assert.NotNull(loginResult);
        Assert.NotNull(loginResult.RefreshToken);

        var firstRefreshToken = loginResult.RefreshToken;

        // Act: Refresh token kullanarak yeni token alır
        var refreshResult = await authService.RefreshTokenAsync(new RefreshTokenRequestDto
        {
            AccessToken = loginResult.Token,
            RefreshToken = firstRefreshToken
        });

        // Assert: Yeni token dönmeli ve Refresh Token rotasyonu gerçekleşmeli (farklı olmalı)
        Assert.NotNull(refreshResult);
        Assert.NotNull(refreshResult.Token);
        Assert.NotNull(refreshResult.RefreshToken);
        Assert.NotEqual(firstRefreshToken, refreshResult.RefreshToken);

        // Eski refresh token artık çalışmamalı (Tek kullanımlık kuralı)
        var replayAttempt = await authService.RefreshTokenAsync(new RefreshTokenRequestDto
        {
            AccessToken = loginResult.Token,
            RefreshToken = firstRefreshToken
        });
        Assert.Null(replayAttempt);
    }

    [Fact]
    public async Task Senaryo_VulnerableEndpoints_WhenOutsideDevelopment_AreDisabledAndReturnForbidden()
    {
        // Arrange: Environment is Production
        var prodEnvMock = new Mock<IWebHostEnvironment>();
        prodEnvMock.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        var controller = new SecurityDemoController(_context, _auditMock.Object, _loggerMock.Object, prodEnvMock.Object);

        // Act & Assert 1: AccessControlVulnerable in Production returns 403 Forbidden
        var accessResult = controller.AccessControlVulnerable() as ObjectResult;
        Assert.NotNull(accessResult);
        Assert.Equal(StatusCodes.Status403Forbidden, accessResult.StatusCode);
        var accessDto = Assert.IsType<SecurityScenarioResultDto>(accessResult.Value);
        Assert.Equal("DISABLED", accessDto.Mode);
        Assert.False(accessDto.IsVulnerabilityExploited);

        // Act & Assert 2: IdorVulnerable in Production returns 403 Forbidden
        var idorResult = await controller.IdorVulnerable(1) as ObjectResult;
        Assert.NotNull(idorResult);
        Assert.Equal(StatusCodes.Status403Forbidden, idorResult.StatusCode);

        // Act & Assert 3: SqliVulnerable in Production returns 403 Forbidden
        var sqliResult = await controller.SqliVulnerable("test") as ObjectResult;
        Assert.NotNull(sqliResult);
        Assert.Equal(StatusCodes.Status403Forbidden, sqliResult.StatusCode);

        // Act & Assert 4: SensitiveDataVulnerable in Production returns 403 Forbidden
        var sensResult = await controller.SensitiveDataVulnerable() as ObjectResult;
        Assert.NotNull(sensResult);
        Assert.Equal(StatusCodes.Status403Forbidden, sensResult.StatusCode);

        // Act & Assert 5: MassAssignmentVulnerable in Production returns 403 Forbidden
        var massResult = controller.MassAssignmentVulnerable(new VulnerableUserRegisterDto { Username = "u", Password = "p" }) as ObjectResult;
        Assert.NotNull(massResult);
        Assert.Equal(StatusCodes.Status403Forbidden, massResult.StatusCode);

        // Act & Assert 6: BrokenAuthVulnerable in Production returns 403 Forbidden
        var authResult = controller.BrokenAuthVulnerable() as ObjectResult;
        Assert.NotNull(authResult);
        Assert.Equal(StatusCodes.Status403Forbidden, authResult.StatusCode);

        // Act & Assert 7: ErrorHandlingVulnerable in Production returns 403 Forbidden
        var errResult = controller.ErrorHandlingVulnerable() as ObjectResult;
        Assert.NotNull(errResult);
        Assert.Equal(StatusCodes.Status403Forbidden, errResult.StatusCode);

        // Act & Assert 8: FileUploadVulnerable in Production returns 403 Forbidden
        var fileResult = controller.FileUploadVulnerable(null) as ObjectResult;
        Assert.NotNull(fileResult);
        Assert.Equal(StatusCodes.Status403Forbidden, fileResult.StatusCode);

        // Act & Assert 9: XssVulnerable in Production returns 403 Forbidden
        var xssResult = controller.XssVulnerable(new XssInputDto { Description = "<script>" }) as ObjectResult;
        Assert.NotNull(xssResult);
        Assert.Equal(StatusCodes.Status403Forbidden, xssResult.StatusCode);

        // Act & Assert 10: DosVulnerable in Production returns 403 Forbidden
        var dosResult = controller.DosVulnerable() as ObjectResult;
        Assert.NotNull(dosResult);
        Assert.Equal(StatusCodes.Status403Forbidden, dosResult.StatusCode);
    }
}
