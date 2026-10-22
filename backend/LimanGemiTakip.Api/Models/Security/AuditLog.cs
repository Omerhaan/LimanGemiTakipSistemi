using System.ComponentModel.DataAnnotations;

namespace LimanGemiTakip.Api.Models.Security;

/// <summary>
/// OWASP Bonus 3: Sistem Güvenlik ve Denetim Günlüğü (Audit Log)
/// Login, Logout, Veri Değişiklikleri, Yetkisiz Erişim ve Güvenlik Olaylarını kaydeder.
/// </summary>
public class AuditLog
{
    [Key]
    public int Id { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string? UserId { get; set; }

    [MaxLength(100)]
    public string? Username { get; set; }

    [MaxLength(50)]
    public string? UserRole { get; set; }

    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty; // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, ACCESS_DENIED, IDOR_ATTEMPT, SQLI_DETECTED, RATE_LIMIT_EXCEEDED

    [Required]
    [MaxLength(100)]
    public string EntityName { get; set; } = string.Empty; // Ship, Port, CrewMember, ShipVisit, Auth, SecurityLab

    [MaxLength(100)]
    public string? EntityId { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    [MaxLength(255)]
    public string? UserAgent { get; set; }

    [MaxLength(2000)]
    public string Details { get; set; } = string.Empty;

    public bool IsSuccess { get; set; } = true;

    [MaxLength(20)]
    public string Severity { get; set; } = "INFO"; // INFO, WARNING, CRITICAL
}
