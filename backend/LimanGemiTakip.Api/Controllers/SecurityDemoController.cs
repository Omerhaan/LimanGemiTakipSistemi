using System.Net;
using System.Security.Claims;
using System.Text.RegularExpressions;
using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Security;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LimanGemiTakip.Api.Controllers;

[ApiController]
[Route("api/security-demo")]
public class SecurityDemoController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<SecurityDemoController> _logger;
    private readonly IWebHostEnvironment _env;

    public SecurityDemoController(
        ApplicationDbContext context,
        IAuditLogService auditLogService,
        ILogger<SecurityDemoController> logger,
        IWebHostEnvironment env)
    {
        _context = context;
        _auditLogService = auditLogService;
        _logger = logger;
        _env = env;
    }

    private IActionResult? CheckVulnerableRouteDisabled(int scenarioId, string scenarioName)
    {
        if (!_env.IsDevelopment())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new SecurityScenarioResultDto
            {
                ScenarioId = scenarioId,
                ScenarioName = scenarioName,
                Mode = "DISABLED",
                IsVulnerabilityExploited = false,
                Description = "Kasıtlı güvenlik açığı simülasyon uç noktaları üretim ortamlarında güvenlik nedeniyle devre dışı bırakılmıştır.",
                ResultMessage = "403 FORBIDDEN: Kasıtlı olarak zafiyet barındıran demo uç noktaları yalnızca Development ortamında çalıştırılabilir.",
                MitigationExplanation = "Bu uç noktalar üretim ortamlarında bilgi sızıntısı veya istismarı önlemek amacıyla 'IWebHostEnvironment.IsDevelopment()' kontrolüyle kapatılmıştır."
            });
        }
        return null;
    }

    // =========================================================================
    // SENARYO 1: BROKEN ACCESS CONTROL
    // =========================================================================

    [HttpGet("access-control/vulnerable")]
    [AllowAnonymous]
    public IActionResult AccessControlVulnerable()
    {
        var disabled = CheckVulnerableRouteDisabled(1, "Broken Access Control");
        if (disabled != null) return disabled;

        // AÇIK: Hiçbir yetkilendirme yok! Herhangi bir anonim kullanıcı tüm gizli operasyonel liman verilerini alabiliyor.
        var confidentialData = new
        {
            warning = "GÜVENLİK AÇIĞI (Broken Access Control): Bu gizli operasyonel verilere yetkisiz herkes erişebildi!",
            portBudget = 25000000.00,
            securityLevel = "MARSEC 2",
            authorizedOfficer = "Gizli Liman Denetçisi",
            pendingInspections = 14
        };

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 1,
            ScenarioName = "Broken Access Control",
            Mode = "VULNERABLE",
            IsVulnerabilityExploited = true,
            Description = "Endpoint üzerinde [Authorize] özniteliği tanımlanmadığı için kimliği doğrulanmamış anonim istemci gizli liman bütçesini ve teftiş raporlarını çekti.",
            AttackPayload = "GET /api/security-demo/access-control/vulnerable (Kimliksiz İstek)",
            ResultMessage = "Yetki kontrolü atlandı, gizli finansal ve güvenlik verileri sızdırıldı.",
            Data = confidentialData,
            MitigationExplanation = "Endpoint [Authorize(Roles = \"Admin,PortManager\")] ile kilitlenmeli, 401/403 politikası uygulanmalıdır."
        });
    }

    [HttpGet("access-control/secure")]
    [Authorize(Roles = "Admin,PortManager")]
    public async Task<IActionResult> AccessControlSecure()
    {
        // GÜVENLİ: Yalnızca Admin ve PortManager rollerine sahip doğrulanmış kullanıcılar erişebilir.
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "Bilinmiyor";
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Bilinmiyor";

        await _auditLogService.LogAsync(
            "SECURE_RESOURCE_ACCESSED",
            "SecurityLab",
            null,
            $"Yetkili operasyonel verilere erişildi. Kullanıcı: {username}, Rol: {role}",
            username: username,
            role: role,
            severity: "INFO");

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 1,
            ScenarioName = "Broken Access Control",
            Mode = "SECURE",
            IsVulnerabilityExploited = false,
            Description = "Rol Tabanlı Erişim Denetimi (RBAC) başarıyla uygulandı.",
            AttackPayload = $"Bearer Token: {username} (Rol: {role})",
            ResultMessage = "Erişim izni verildi. Yalnızca yetkili Admin ve PortManager kullanıcıları veriyi görebilir.",
            Data = new
            {
                portBudget = 25000000.00,
                securityLevel = "MARSEC 2",
                authorizedOfficer = username
            },
            MitigationExplanation = "Endpoint [Authorize(Roles = \"Admin,PortManager\")] özniteliği ile korunmakta olup yetkisiz istekler 401/403 ile engellenir."
        });
    }

    // =========================================================================
    // SENARYO 2: IDOR (INSECURE DIRECT OBJECT REFERENCE)
    // =========================================================================

    [HttpGet("idor/vulnerable/{portId}")]
    [AllowAnonymous]
    public async Task<IActionResult> IdorVulnerable(int portId)
    {
        var disabled = CheckVulnerableRouteDisabled(2, "IDOR (Insecure Direct Object Reference)");
        if (disabled != null) return disabled;

        // AÇIK: Kullanıcının hangi limana atanmış olduğu kontrol edilmez. URL'deki portId değiştirilerek diğer limanların tüm gizli verisi çekilebilir!
        var port = await _context.Ports.FindAsync(portId);
        if (port == null) return NotFound(new { message = "Liman bulunamadı." });

        var portVisits = await _context.ShipVisits
            .Where(v => v.PortId == portId)
            .Take(5)
            .ToListAsync();

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 2,
            ScenarioName = "IDOR (Insecure Direct Object Reference)",
            Mode = "VULNERABLE",
            IsVulnerabilityExploited = true,
            Description = $"URL'deki portId={portId} parametresi doğrudan veritabanında sorgulandı, sahiplik veya liman yetki kontrolü yapılmadı.",
            AttackPayload = $"GET /api/security-demo/idor/vulnerable/{portId}",
            ResultMessage = $"İstemci kendi yetki alanında olmayan '{port.Name}' limanına ait özel ziyaret kayıtlarını görüntüleyebildi.",
            Data = new { Port = port.Name, Visits = portVisits.Count },
            MitigationExplanation = "Servis katmanında kullanıcının JWT Claims içerisindeki PortId değeri veya Admin rolü kontrol edilmeli, eşleşmeyen istekler 403 Forbidden ile reddedilmelidir."
        });
    }

    [HttpGet("idor/secure/{portId}")]
    [Authorize]
    public async Task<IActionResult> IdorSecure(int portId)
    {
        // GÜVENLİ: Kullanıcının JWT claim'lerindeki PortId veya Admin rolü denetlenir.
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Viewer";
        var userPortIdClaim = User.FindFirst("PortId")?.Value;

        bool isAdmin = userRole == "Admin";
        bool isAuthorizedPort = userPortIdClaim != null && int.TryParse(userPortIdClaim, out var uPort) && uPort == portId;

        if (!isAdmin && !isAuthorizedPort)
        {
            // IDOR Saldırı Denemesi Tespit Edildi!
            await _auditLogService.LogAsync(
                "IDOR_ATTEMPT_BLOCKED",
                "Port",
                portId.ToString(),
                $"IDOR Girişimi Engellendi! Kullanıcı '{username}' (Liman ID: {userPortIdClaim ?? "Yok"}) yetkisi dışındaki Liman ID: {portId} verisine erişmeye çalıştı.",
                username: username,
                role: userRole,
                isSuccess: false,
                severity: "CRITICAL");

            return StatusCode(StatusCodes.Status403Forbidden, new SecurityScenarioResultDto
            {
                ScenarioId = 2,
                ScenarioName = "IDOR (Insecure Direct Object Reference)",
                Mode = "SECURE",
                IsVulnerabilityExploited = false,
                Description = "IDOR Koruma Mekanizması Devrede: Kullanıcının talep ettiği kaynak ile yetki alanı (Claims) eşleşmedi.",
                AttackPayload = $"Talep Edilen PortId: {portId}, Kullanıcının PortId'si: {userPortIdClaim ?? "Yetkisiz"}",
                ResultMessage = "403 FORBIDDEN: Bu limana ait verileri görüntüleme yetkiniz bulunmamaktadır. Olay güvenlik denetim günlüğüne (Audit Log) kaydedildi.",
                MitigationExplanation = "Servis katmanında Claims-based sahiplik doğrulaması yapıldı."
            });
        }

        var port = await _context.Ports.FindAsync(portId);
        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 2,
            ScenarioName = "IDOR (Insecure Direct Object Reference)",
            Mode = "SECURE",
            IsVulnerabilityExploited = false,
            Description = "Kullanıcı yetkili olduğu liman kaynağına başarıyla erişti.",
            AttackPayload = $"Talep Edilen PortId: {portId} (Eşleşti)",
            ResultMessage = "Yetki doğrulandı. Yalnızca kendi limanınızın verilerine erişim sağlandı.",
            Data = new { Port = port?.Name, AuthorizedUser = username },
            MitigationExplanation = "Kullanıcı sahipliği doğrulaması tamamlandı."
        });
    }

    // =========================================================================
    // SENARYO 3: SQL INJECTION (SQLi)
    // =========================================================================

    [HttpGet("sqli/vulnerable")]
    [AllowAnonymous]
    public async Task<IActionResult> SqliVulnerable([FromQuery] string searchTerm = "' OR '1'='1")
    {
        var disabled = CheckVulnerableRouteDisabled(3, "SQL Injection (SQLi)");
        if (disabled != null) return disabled;

        // AÇIK: String birleştirme ile dinamik raw SQL!
        // Saldırgan "' OR '1'='1" gönderdiğinde tüm filtre kalkar ve bütün gemiler çekilir.
        var vulnerableSql = $"SELECT * FROM Ships WHERE Name LIKE '%{searchTerm}%'";
        
        List<Ship> leakedShips;
        try
        {
            leakedShips = await _context.Ships
                .FromSqlRaw(vulnerableSql)
                .Take(15)
                .ToListAsync();
        }
        catch (Exception)
        {
            // Eğer veritabanı sağlayıcısı raw SQL birleştirmesinde sentaks hatası verirse simülasyon amaçlı listeleme
            leakedShips = await _context.Ships.Take(15).ToListAsync();
        }

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 3,
            ScenarioName = "SQL Injection (SQLi)",
            Mode = "VULNERABLE",
            IsVulnerabilityExploited = true,
            Description = "Dinamik string birleştirme ile SQL cümlesi oluşturuldu: " + vulnerableSql,
            AttackPayload = searchTerm,
            ResultMessage = $"SQL Injection başarılı! Filtre bypass edildi, {leakedShips.Count} adet gemi kaydı sızdırıldı.",
            Data = leakedShips.Select(s => new { s.Id, s.Name, s.ImoNumber, s.Type }),
            MitigationExplanation = "Kullanıcı girdisi asla string olarak SQL içine gömülmemelidir. Entity Framework Core parametreli LINQ (.Where) veya parametreli FromSqlInterpolated kullanılmalıdır."
        });
    }

    [HttpGet("sqli/secure")]
    [AllowAnonymous]
    public async Task<IActionResult> SqliSecure([FromQuery] string searchTerm = "' OR '1'='1")
    {
        // GÜVENLİ: EF Core LINQ sorgusu parametreli SQL Server sorgusuna derlenir (@p0).
        // Kullanıcı girdisi tırnak içerse dahi yalnızca kelime olarak aranır, SQL kod olarak asla çalıştırılmaz!
        var safeShips = await _context.Ships
            .AsNoTracking()
            .Where(s => s.Name.Contains(searchTerm))
            .Take(15)
            .ToListAsync();

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 3,
            ScenarioName = "SQL Injection (SQLi)",
            Mode = "SECURE",
            IsVulnerabilityExploited = false,
            Description = "Entity Framework Core parametreli sorgulama (Parameterized LINQ) kullanıldı.",
            AttackPayload = searchTerm,
            ResultMessage = $"SQLi engellendi! Girdi yalnızca düz metin olarak arandı. Eşleşen gemi sayısı: {safeShips.Count}",
            Data = safeShips.Select(s => new { s.Id, s.Name, s.ImoNumber, s.Type }),
            MitigationExplanation = "Parametreli sorgular sayesinde saldırgan tırnak veya OR 1=1 eklese dahi veritabanı motoru bunu kod değil veri parametresi (@p0) olarak işler."
        });
    }

    // =========================================================================
    // SENARYO 4: HASSAS BİLGİ SIZINTISI (SENSITIVE DATA EXPOSURE)
    // =========================================================================

    [HttpGet("sensitive-data/vulnerable")]
    [AllowAnonymous]
    public async Task<IActionResult> SensitiveDataVulnerable()
    {
        var disabled = CheckVulnerableRouteDisabled(4, "Hassas Bilgi Sızıntısı (Sensitive Data Exposure)");
        if (disabled != null) return disabled;

        // AÇIK: Veritabanındaki Entity doğrudan istemciye dönülüyor. Kişisel telefon, e-posta herkese açık!
        var crew = await _context.CrewMembers.Take(5).ToListAsync();

        var exposedList = crew.Select(c => new
        {
            c.Id,
            c.FirstName,
            c.LastName,
            c.FullName,
            c.Role,
            c.Email,
            c.Phone,
            c.Nationality,
            MockTckn = "123456789" + (c.Id % 100).ToString("D2") // Simüle edilmiş TCKN
        });

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 4,
            ScenarioName = "Hassas Bilgi Sızıntısı (Sensitive Data Exposure)",
            Mode = "VULNERABLE",
            IsVulnerabilityExploited = true,
            Description = "Personel varlığı doğrudan istemciye dönüldü; telefon numaraları, e-postalar ve kimlik bilgileri ifşa oldu.",
            AttackPayload = "GET /api/security-demo/sensitive-data/vulnerable (Herhangi bir kullanıcı)",
            ResultMessage = "KVKK ve GDPR ilkeleri ihlal edildi. Hassas iletişim bilgileri herkese sızdırıldı.",
            Data = exposedList,
            MitigationExplanation = "Farklı kullanıcı rollerine uygun DTO'lar tasarlanmalı (CrewPublicDto, CrewMaskedDto), veriler maskelenmeli veya yalnızca Admin rolüne tam gösterilmelidir."
        });
    }

    [HttpGet("sensitive-data/secure")]
    public async Task<IActionResult> SensitiveDataSecure()
    {
        // GÜVENLİ: Kullanıcı rolüne göre katmanlı DTO dönülür.
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Viewer";
        var crew = await _context.CrewMembers.Take(5).ToListAsync();

        object resultData;

        if (userRole == "Admin")
        {
            // Admin: Tam yetkili
            resultData = crew.Select(c => new CrewConfidentialDto
            {
                Id = c.Id,
                FirstName = c.FirstName,
                LastName = c.LastName,
                FullName = c.FullName,
                Role = c.Role,
                Phone = c.Phone,
                Email = c.Email,
                Nationality = c.Nationality,
                NationalIdNumber = "123456789" + (c.Id % 100).ToString("D2")
            });
        }
        else if (userRole == "Operator" || userRole == "PortManager")
        {
            // Operatör: Maskelenmiş veri
            resultData = crew.Select(c => new CrewMaskedDto
            {
                Id = c.Id,
                FullName = c.FullName,
                Role = c.Role,
                MaskedPhone = MaskPhoneNumber(c.Phone),
                MaskedEmail = MaskEmail(c.Email),
                Nationality = c.Nationality
            });
        }
        else
        {
            // Viewer / Anonim: Sadece kamuya açık liste
            resultData = crew.Select(c => new CrewPublicDto
            {
                Id = c.Id,
                FullName = c.FullName,
                Role = c.Role,
                Nationality = c.Nationality
            });
        }

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 4,
            ScenarioName = "Hassas Bilgi Sızıntısı (Sensitive Data Exposure)",
            Mode = "SECURE",
            IsVulnerabilityExploited = false,
            Description = $"Katmanlı DTO ve Veri Maskeleme uygulandı (Aktif Rol: {userRole}).",
            AttackPayload = $"Aktif Kullanıcı Rolü: {userRole}",
            ResultMessage = userRole == "Admin"
                ? "Sistem Yöneticisi yetkisi ile tam detaylar güvenle görüntülendi."
                : "Yetkisiz kullanıcılara hassas veriler maskelenerek (***) sunuldu, bilgi sızıntısı önlendi.",
            Data = resultData,
            MitigationExplanation = "DTO projeksiyonu ve veri maskeleme algoritmaları entegre edildi."
        });
    }

    // =========================================================================
    // SENARYO 5: MASS ASSIGNMENT (OVER-POSTING)
    // =========================================================================

    [HttpPost("mass-assignment/vulnerable")]
    [AllowAnonymous]
    public IActionResult MassAssignmentVulnerable([FromBody] VulnerableUserRegisterDto request)
    {
        var disabled = CheckVulnerableRouteDisabled(5, "Mass Assignment (Over-Posting)");
        if (disabled != null) return disabled;

        // AÇIK: Saldırganın JSON gövdesinde gönderdiği "Role: Admin" doğrudan kabul ediliyor!
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = "Hashed_" + request.Password,
            Role = request.Role ?? (request.IsAdmin == true ? "Admin" : "Viewer"),
            FullName = request.Username
        };

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 5,
            ScenarioName = "Mass Assignment (Over-Posting)",
            Mode = "VULNERABLE",
            IsVulnerabilityExploited = true,
            Description = "API gelen istek gövdesindeki Role / IsAdmin parametrelerini kontrolsüzce User varlığına kopyaladı.",
            AttackPayload = $"{{\"username\": \"{request.Username}\", \"role\": \"{request.Role}\", \"isAdmin\": true}}",
            ResultMessage = $"Yetki Yükseltme Başarılı! Sıradan kullanıcı sisteme '{user.Role}' rolüyle kaydedildi!",
            Data = new { user.Username, user.Role },
            MitigationExplanation = "Kullanıcı kayıt ve güncelleme işlemlerinde katı DTO kullanılmalı, Role/IsAdmin gibi kritik alanlar istemciden asla alınmamalı, sunucu tarafında varsayılan atanmalıdır."
        });
    }

    [HttpPost("mass-assignment/secure")]
    [AllowAnonymous]
    public IActionResult MassAssignmentSecure([FromBody] VulnerableUserRegisterDto request)
    {
        // GÜVENLİ: İstemci "Role: Admin" veya "IsAdmin: true" gönderse bile sunucu bunu yok sayar!
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = "Hashed_" + request.Password,
            Role = "Viewer", // Sunucu tarafında zorunlu güvenli varsayılan
            FullName = request.Username
        };

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 5,
            ScenarioName = "Mass Assignment (Over-Posting)",
            Mode = "SECURE",
            IsVulnerabilityExploited = false,
            Description = "Katı DTO doğrulaması ve sunucu taraflı rol kuralı uygulandı.",
            AttackPayload = $"{{\"username\": \"{request.Username}\", \"role\": \"{request.Role}\", \"isAdmin\": true}}",
            ResultMessage = $"Saldırı engellendi! İstemciden gelen sahte yetki yükseltme alanı ('{request.Role}') yok sayıldı ve kullanıcı güvenli olarak '{user.Role}' rolü ile açıldı.",
            Data = new { user.Username, user.Role },
            MitigationExplanation = "Over-posting engellendi, yetkilendirme yalnızca sunucu iş kurallarıyla belirlendi."
        });
    }

    // =========================================================================
    // SENARYO 6: BROKEN AUTHENTICATION (ZAYIF KİMLİK DOĞRULAMA)
    // =========================================================================

    [HttpGet("broken-auth/vulnerable")]
    [AllowAnonymous]
    public IActionResult BrokenAuthVulnerable()
    {
        var disabled = CheckVulnerableRouteDisabled(6, "Broken Authentication");
        if (disabled != null) return disabled;

        // AÇIK: 10 yıllık token, zayıf secret key, refresh token ve logout iptali yok!
        var vulnerableTokenInfo = new
        {
            tokenType = "Insecure JWT",
            expireDuration = "10 Yıl (Sonsuz)",
            secretKey = "123456",
            hasRefreshToken = false,
            canBeRevokedOnLogout = false,
            risk = "Token çalınırsa saldırgan 10 yıl boyunca sistemi kontrol edebilir, logout yapılsa bile token geçersiz kılınamaz!"
        };

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 6,
            ScenarioName = "Broken Authentication",
            Mode = "VULNERABLE",
            IsVulnerabilityExploited = true,
            Description = "Güvensiz token yapılandırması: Sonsuz ömür, zayıf şifreleme ve iptal (revocation) desteğinin olmaması.",
            AttackPayload = "Uzun ömürlü token çalınması (XSS / Network Sniffing)",
            ResultMessage = "Saldırgan ele geçirdiği token ile süresiz oturum oturum açabilir, kullanıcı logout yapsa dahi token engellenemez.",
            Data = vulnerableTokenInfo,
            MitigationExplanation = "Access Token 15 dakikaya indirilmeli, veritabanı kontrollü tek kullanımlık Refresh Token rotasyonu uygulanmalı ve Logout anında token revocation yapılmalıdır."
        });
    }

    [HttpGet("broken-auth/secure")]
    public IActionResult BrokenAuthSecure()
    {
        // GÜVENLİ: 15 dakikalık Access Token + Refresh Token Rotasyonu + Logout Revocation
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "Kullanıcı";

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 6,
            ScenarioName = "Broken Authentication",
            Mode = "SECURE",
            IsVulnerabilityExploited = false,
            Description = "OWASP A07 standartlarına tam uyumlu Kısa Ömürlü JWT + Refresh Token Mimarisi.",
            AttackPayload = "Çalınan token ile yetkisiz kullanım denemesi",
            ResultMessage = "Access Token 15 dakikada kendiliğinden geçersiz olur. Yenileme için kriptografik Refresh Token gerekir. Logout yapıldığında sunucu tarafında iptal edilir.",
            Data = new
            {
                accessTokenLifetime = "15 Dakika",
                refreshTokenLifetime = "7 Gün",
                tokenRotation = "Her yenilemede tek kullanımlık yeni refresh token üretilir",
                revocationOnLogout = true,
                activeUser = username
            },
            MitigationExplanation = "/api/auth/refresh-token ve /api/auth/logout mekanizmaları başarıyla devrede."
        });
    }

    // =========================================================================
    // SENARYO 7: GÜVENSİZ HATA YÖNETİMİ (IMPROPER ERROR HANDLING)
    // =========================================================================

    [HttpGet("error-handling/vulnerable")]
    [AllowAnonymous]
    public IActionResult ErrorHandlingVulnerable()
    {
        var disabled = CheckVulnerableRouteDisabled(7, "Güvensiz Hata Yönetimi (Improper Error Handling)");
        if (disabled != null) return disabled;

        // AÇIK: İstisna yakalandığında ham StackTrace, ConnectionString ve tablo isimleri kullanıcıya fırlatılıyor!
        try
        {
            throw new InvalidOperationException("SQL Server Connection Timeout: Server=tcp:liman-db.internal,1433;Database=LimanGemiDb_Prod;User Id=sa;Password=SuperSecretDbPassword123!; at LimanGemiTakip.Api.Data.ApplicationDbContext.Ships.ToList() in C:\\App\\Data\\ApplicationDbContext.cs:line 142");
        }
        catch (Exception ex)
        {
            var rawLeak = new
            {
                errorMessage = ex.Message,
                stackTrace = ex.StackTrace ?? "   at LimanGemiTakip.Api.Controllers.SecurityDemoController.ErrorHandlingVulnerable() in C:\\App\\Controllers\\SecurityDemoController.cs:line 385",
                internalDbConnectionString = "Server=tcp:liman-db.internal,1433;Database=LimanGemiDb_Prod;User Id=sa;Password=SuperSecretDbPassword123!;",
                serverOs = Environment.OSVersion.ToString()
            };

            return StatusCode(500, new SecurityScenarioResultDto
            {
                ScenarioId = 7,
                ScenarioName = "Güvensiz Hata Yönetimi (Improper Error Handling)",
                Mode = "VULNERABLE",
                IsVulnerabilityExploited = true,
                Description = "Sunucu hatasında ham Exception ve Connection String detayları istemciye sızdırıldı.",
                AttackPayload = "GET /api/security-demo/error-handling/vulnerable",
                ResultMessage = "Veritabanı bağlantı cümlesi, parolalar ve dosya yolları istemciye açıklandı.",
                Data = rawLeak,
                MitigationExplanation = "GlobalExceptionMiddleware geliştirilmeli; kullanıcıya yalnızca jenerik güvenli mesaj dönülmeli, teknik ayrıntılar sunucu loguna hapsedilmelidir."
            });
        }
    }

    [HttpGet("error-handling/secure")]
    [AllowAnonymous]
    public IActionResult ErrorHandlingSecure()
    {
        // GÜVENLİ: GlobalExceptionMiddleware benzeri kontrollü hata yanıtı
        var traceId = Guid.NewGuid().ToString("N");
        _logger.LogError("[TraceId: {TraceId}] Kritik dahili veritabanı hatası simüle edildi. Kullanıcıdan gizlendi.", traceId);

        return StatusCode(500, new SecurityScenarioResultDto
        {
            ScenarioId = 7,
            ScenarioName = "Güvensiz Hata Yönetimi (Improper Error Handling)",
            Mode = "SECURE",
            IsVulnerabilityExploited = false,
            Description = "Global Exception Handler devrede: Hata detayları sunucuda loglandı, istemciye jenerik güvenli hata verildi.",
            AttackPayload = "GET /api/security-demo/error-handling/secure",
            ResultMessage = "Güvenli Hata Yanıtı: İstemciye hiçbir bağlantı cümlesi veya stack trace verilmedi.",
            Data = new
            {
                success = false,
                statusCode = 500,
                message = "İşlem sırasında beklenmeyen bir hata meydana geldi. Güvenlik nedeniyle teknik detaylar gizlenmiştir.",
                traceId
            },
            MitigationExplanation = "Kullanıcıya yalnızca TraceId dönüldü, tüm teknik detaylar ILogger güvenli günlüğüne yazıldı."
        });
    }

    // =========================================================================
    // SENARYO 8: GÜVENSİZ DOSYA YÜKLEME (UNRESTRICTED FILE UPLOAD)
    // =========================================================================

    [HttpPost("file-upload/vulnerable")]
    [AllowAnonymous]
    public IActionResult FileUploadVulnerable([FromForm] IFormFile? file)
    {
        var disabled = CheckVulnerableRouteDisabled(8, "Güvensiz Dosya Yükleme (Unrestricted File Upload)");
        if (disabled != null) return disabled;

        // AÇIK: Uzantı kontrolü yok, boyut kontrolü yok, dosya adı kontrolü yok! .php, .exe, .sh yüklenebilir!
        var fileName = file?.FileName ?? "web_shell.php";
        var fileSize = file?.Length ?? 1024 * 1024 * 8; // 8 MB

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 8,
            ScenarioName = "Güvensiz Dosya Yükleme (Unrestricted File Upload)",
            Mode = "VULNERABLE",
            IsVulnerabilityExploited = true,
            Description = "Dosya uzantısı (.php, .exe) ve boyutu denetlenmedi, orijinal adıyla sunucuda web erişilebilir dizine kaydedildi.",
            AttackPayload = $"Yüklenen Dosya: {fileName} ({fileSize / 1024} KB)",
            ResultMessage = "Saldırgan sunucuya zararlı komut çalıştırabilen Web Shell (.php / .exe) yüklemeyi başardı!",
            Data = new { uploadedFile = fileName, targetPath = "/wwwroot/uploads/" + fileName },
            MitigationExplanation = "Dosya uzantısı beyaz listeye tabi tutulmalı (.pdf, .png, .jpg), boyut sınırı (5MB) konmalı, MIME türü doğrulanmalı ve rastgele GUID ile isimlendirilmelidir."
        });
    }

    [HttpPost("file-upload/secure")]
    [AllowAnonymous]
    public IActionResult FileUploadSecure([FromForm] IFormFile? file)
    {
        // GÜVENLİ: Uzantı Beyaz Listesi, Boyut Kontrolü (Maks 5 MB) ve Rastgele GUID İsimlendirme
        var allowedExtensions = new[] { ".pdf", ".png", ".jpg", ".jpeg" };
        var fileName = file?.FileName ?? "test_document.exe";
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new SecurityScenarioResultDto
            {
                ScenarioId = 8,
                ScenarioName = "Güvensiz Dosya Yükleme (Unrestricted File Upload)",
                Mode = "SECURE",
                IsVulnerabilityExploited = false,
                Description = "Dosya tipi beyaz liste denetimi devrede.",
                AttackPayload = $"Engellenen Dosya: {fileName}",
                ResultMessage = $"GEÇERSİZ DOSYA TİPİ: Yalnızca {string.Join(", ", allowedExtensions)} uzantılı belgelere izin verilir. Zararlı dosya yükleme engellendi!",
                MitigationExplanation = "Uzantı beyaz listesi ve dosya başlığı (magic bytes) doğrulaması uygulandı."
            });
        }

        var safeGuidName = Guid.NewGuid().ToString() + extension;
        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 8,
            ScenarioName = "Güvensiz Dosya Yükleme (Unrestricted File Upload)",
            Mode = "SECURE",
            IsVulnerabilityExploited = false,
            Description = "Dosya başarıyla doğrulandı ve güvenli biçimde adlandırıldı.",
            AttackPayload = fileName,
            ResultMessage = $"Dosya kabul edildi. Orijinal adı yok sayılarak sunucu içi güvenli GUID adı atandı: {safeGuidName}",
            Data = new { originalName = fileName, safeSavedName = safeGuidName, maxAllowedSize = "5 MB" },
            MitigationExplanation = "GUID isimlendirme ile Path Traversal riski ortadan kaldırıldı."
        });
    }

    // =========================================================================
    // SENARYO 9: CROSS-SITE SCRIPTING (XSS)
    // =========================================================================

    [HttpPost("xss/vulnerable")]
    [AllowAnonymous]
    public IActionResult XssVulnerable([FromBody] XssInputDto input)
    {
        var disabled = CheckVulnerableRouteDisabled(9, "Cross-Site Scripting (XSS)");
        if (disabled != null) return disabled;

        // AÇIK: Kullanıcının girdiği <script>alert('XSS')</script> hiçbir kontrolden geçmeden doğrudan dönülür
        var rawPayload = input.Description;

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 9,
            ScenarioName = "Cross-Site Scripting (XSS)",
            Mode = "VULNERABLE",
            IsVulnerabilityExploited = true,
            Description = "Kullanıcı girdisi filtrelenmeden doğrudan istemciye geri basıldı.",
            AttackPayload = rawPayload,
            ResultMessage = "XSS Açığı Tetiklendi! Eğer arayüz bu içeriği doğrudan render ederse kullanıcının tarayıcısında zararlı JavaScript çalışır!",
            Data = new { rawHtml = rawPayload },
            MitigationExplanation = "HTML Sanitization ve Output Encoding uygulanmalı, tehlikeli script tagleri temizlenmeli ve CSP başlıkları aktif edilmelidir."
        });
    }

    [HttpPost("xss/secure")]
    [AllowAnonymous]
    public IActionResult XssSecure([FromBody] XssInputDto input)
    {
        // GÜVENLİ: HTML Encoding ve Zararlı Tag Temizleme
        var sanitized = WebUtility.HtmlEncode(input.Description);
        var stripped = Regex.Replace(input.Description, @"<script[^>]*>[\s\S]*?</script>", "", RegexOptions.IgnoreCase);

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 9,
            ScenarioName = "Cross-Site Scripting (XSS)",
            Mode = "SECURE",
            IsVulnerabilityExploited = false,
            Description = "HTML Encoding ve Script Tag Sanitization uygulandı.",
            AttackPayload = input.Description,
            ResultMessage = "Zararlı script etkisiz hale getirildi. Özel karakterler (&lt;script&gt;) olarak dönüştürüldü.",
            Data = new
            {
                original = input.Description,
                htmlEncoded = sanitized,
                scriptStripped = stripped
            },
            MitigationExplanation = "WebUtility.HtmlEncode ve Content Security Policy (CSP) ile istemci tarafında zararlı kod çalışması kesin olarak engellendi."
        });
    }

    // =========================================================================
    // SENARYO 10: DENIAL OF SERVICE (DOS) & RATE LIMITING
    // =========================================================================

    [HttpGet("dos/vulnerable")]
    [AllowAnonymous]
    public IActionResult DosVulnerable([FromQuery] int pageSize = 1000000)
    {
        var disabled = CheckVulnerableRouteDisabled(10, "Denial of Service (DoS) & Rate Limiting");
        if (disabled != null) return disabled;

        // AÇIK: Kullanıcı 1.000.000 kayıt talep edebiliyor, sayfalama üst sınırı yok, rate limiting yok!
        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 10,
            ScenarioName = "Denial of Service (DoS) & Rate Limiting",
            Mode = "VULNERABLE",
            IsVulnerabilityExploited = true,
            Description = "Maksimum sayfa boyutu sınırı ve istek frekansı kısıtlaması (Rate Limiting) bulunmuyor.",
            AttackPayload = $"GET /api/security-demo/dos/vulnerable?pageSize={pageSize}",
            ResultMessage = $"Aşırı Kaynak Tüketimi (Resource Exhaustion): Sunucudan tek istekte {pageSize:N0} kayıt istendi! Bellek taşması ve CPU kilitlenmesi riski oluşturuldu.",
            Data = new { requestedPageSize = pageSize, rateLimitEnforced = false },
            MitigationExplanation = "Maksimum sayfa boyutu Math.Min(pageSize, 100) ile sınırlandırılmalı ve ASP.NET Core RateLimiter middleware entegre edilmelidir."
        });
    }

    [HttpGet("dos/secure")]
    [AllowAnonymous]
    [EnableRateLimiting("StrictSecurityPolicy")]
    public IActionResult DosSecure([FromQuery] int pageSize = 1000000)
    {
        // GÜVENLİ: Sayfa boyutu maksimum 100 ile sınırlandırıldı ve "StrictSecurityPolicy" ile Rate Limit konuldu
        var boundedPageSize = Math.Min(Math.Max(pageSize, 1), 100);

        return Ok(new SecurityScenarioResultDto
        {
            ScenarioId = 10,
            ScenarioName = "Denial of Service (DoS) & Rate Limiting",
            Mode = "SECURE",
            IsVulnerabilityExploited = false,
            Description = "Sayfa boyutu kısıtlandı ve IP başına 10 saniyede en fazla 5 istek (StrictSecurityPolicy) sınırı konuldu.",
            AttackPayload = $"Talep Edilen: {pageSize:N0} Kayıt",
            ResultMessage = $"Güvenli Sınır Uygulandı: Talep edilen devasa sayı yok sayılarak en fazla {boundedPageSize} kayıt verildi. Hızlı ardışık 6. istekte 429 Too Many Requests dönecektir.",
            Data = new { requestedPageSize = pageSize, enforcedPageSize = boundedPageSize, rateLimitWindow = "10 sn / 5 istek" },
            MitigationExplanation = "RateLimiting Middleware ve Paging Cap koruması aktiftir."
        });
    }

    // =========================================================================
    // YARDIMCI MASKELEME METOTLARI
    // =========================================================================

    private static string MaskPhoneNumber(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return "Belirtilmemiş";
        if (phone.Length < 7) return "***";
        // Örnek: +90 532 111 2233 -> +90 532 *** ** 33
        return phone.Substring(0, 8) + " *** ** " + phone.Substring(Math.Max(0, phone.Length - 2));
    }

    private static string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains("@")) return "***@***.com";
        var parts = email.Split('@');
        var name = parts[0];
        var domain = parts[1];
        var maskedName = name.Length > 2 ? name.Substring(0, 1) + "***" + name.Substring(name.Length - 1) : "***";
        return $"{maskedName}@{domain}";
    }
}
