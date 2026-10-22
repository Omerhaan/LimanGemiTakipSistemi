using System.ComponentModel.DataAnnotations;

namespace LimanGemiTakip.Api.Models.Security;

public class VulnerableUserRegisterDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Role { get; set; } // Saldırganın parametre kirliliği ile eklediği alan
    public bool? IsAdmin { get; set; } // Saldırganın parametre kirliliği ile eklediği alan
}

public class SecureShipCreateDto
{
    [Required(ErrorMessage = "Gemi adı zorunludur.")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "IMO numarası zorunludur.")]
    [RegularExpression(@"^\d{7}$", ErrorMessage = "IMO numarası geçerli 7 haneli rakam olmalıdır.")]
    public string ImoNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Gemi tipi zorunludur.")]
    public string Type { get; set; } = string.Empty;

    [Required(ErrorMessage = "Bayrak zorunludur.")]
    public string Flag { get; set; } = string.Empty;

    [Range(1900, 2100, ErrorMessage = "Yapım yılı 1900 ile 2100 arasında olmalıdır.")]
    public int BuiltYear { get; set; }

    [Range(0, 500000, ErrorMessage = "DWT tonajı 0 ile 500.000 arasında olmalıdır.")]
    public decimal DeadweightTonnage { get; set; }
}

public class CrewPublicDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
}

public class CrewMaskedDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string MaskedPhone { get; set; } = string.Empty;
    public string MaskedEmail { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
}

public class CrewConfidentialDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
    public string NationalIdNumber { get; set; } = string.Empty;
}

public class XssInputDto
{
    public string ShipName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class SecurityScenarioResultDto
{
    public int ScenarioId { get; set; }
    public string ScenarioName { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty; // "VULNERABLE" or "SECURE"
    public bool IsVulnerabilityExploited { get; set; }
    public string Description { get; set; } = string.Empty;
    public string AttackPayload { get; set; } = string.Empty;
    public string ResultMessage { get; set; } = string.Empty;
    public object? Data { get; set; }
    public string MitigationExplanation { get; set; } = string.Empty;
}
