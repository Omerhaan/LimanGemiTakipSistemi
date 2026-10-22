using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models.Security;
using Microsoft.EntityFrameworkCore;

namespace LimanGemiTakip.Api.Services;

public interface IAuditLogService
{
    Task LogAsync(string action, string entityName, string? entityId, string details, string? userId = null, string? username = null, string? role = null, string? ipAddress = null, string? userAgent = null, bool isSuccess = true, string severity = "INFO");
    Task<List<AuditLog>> GetLogsAsync(int pageNumber = 1, int pageSize = 50, string? action = null, string? severity = null);
    Task<int> GetTotalCountAsync(string? action = null, string? severity = null);
}

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(ApplicationDbContext context, ILogger<AuditLogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(
        string action,
        string entityName,
        string? entityId,
        string details,
        string? userId = null,
        string? username = null,
        string? role = null,
        string? ipAddress = null,
        string? userAgent = null,
        bool isSuccess = true,
        string severity = "INFO")
    {
        try
        {
            var log = new AuditLog
            {
                Timestamp = DateTime.UtcNow,
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                Details = details,
                UserId = userId,
                Username = username ?? "Anonymous",
                UserRole = role ?? "None",
                IpAddress = ipAddress,
                UserAgent = userAgent,
                IsSuccess = isSuccess,
                Severity = severity
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();

            _logger.LogInformation("[AuditLog] {Action} on {Entity} ({EntityId}) by {User} [{Severity}]",
                action, entityName, entityId, username ?? "Anonymous", severity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Audit log kaydedilirken hata oluştu: {Message}", ex.Message);
        }
    }

    public async Task<List<AuditLog>> GetLogsAsync(int pageNumber = 1, int pageSize = 50, string? action = null, string? severity = null)
    {
        var query = _context.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(l => l.Action == action);
        }

        if (!string.IsNullOrWhiteSpace(severity))
        {
            query = query.Where(l => l.Severity == severity);
        }

        return await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetTotalCountAsync(string? action = null, string? severity = null)
    {
        var query = _context.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(l => l.Action == action);
        }

        if (!string.IsNullOrWhiteSpace(severity))
        {
            query = query.Where(l => l.Severity == severity);
        }

        return await query.CountAsync();
    }
}
