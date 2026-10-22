using LimanGemiTakip.Api.Models.Security;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,PortManager")]
[Route("api/security/audit-logs")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// OWASP Bonus 3: Sistem Güvenlik ve Denetim Günlüğü Listesi
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,PortManager")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? action = null,
        [FromQuery] string? severity = null)
    {
        var logs = await _auditLogService.GetLogsAsync(pageNumber, pageSize, action, severity);
        var totalCount = await _auditLogService.GetTotalCountAsync(action, severity);

        return Ok(new
        {
            items = logs,
            totalCount,
            pageNumber,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    /// <summary>
    /// Güvenlik Denetim Günlüğü Simülasyonu / Örnek Olay Ekleme
    /// </summary>
    [HttpPost("simulated-event")]
    [Authorize(Roles = "Admin,PortManager")]
    public async Task<IActionResult> CreateSimulatedEvent(
        [FromQuery] string action = "UNAUTHORIZED_ACCESS_ATTEMPT",
        [FromQuery] string entity = "ShipVisits",
        [FromQuery] string details = "Yetkisiz IP adresinden rıhtım operasyonu güncelleme denemesi tespit edildi.",
        [FromQuery] string severity = "WARNING")
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "192.168.1.105";
        var userAgent = Request.Headers.UserAgent.ToString();

        await _auditLogService.LogAsync(
            action,
            entity,
            "SEC-" + DateTime.UtcNow.Ticks.ToString()[^6..],
            details,
            username: "Saldırgan_Simülasyon",
            role: "None",
            ipAddress: ip,
            userAgent: userAgent,
            isSuccess: false,
            severity: severity);

        return Ok(new { success = true, message = "Güvenlik denetim günlüğü başarıyla kaydedildi." });
    }
}
