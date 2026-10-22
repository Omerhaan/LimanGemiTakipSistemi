using System.ComponentModel.DataAnnotations;

namespace LimanGemiTakip.Api.Models.Operations;

public class AvailableShipDto
{
    public int ShipId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ImoNumber { get; set; } = string.Empty;
    public string Flag { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal DeadweightTonnage { get; set; }
    public bool IsAvailable { get; set; } = true;
    public string CurrentStatus { get; set; } = "Müsait";
    public string? LastKnownPortName { get; set; }
}

public class AvailableCrewDto
{
    public int CrewId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool IsAvailable { get; set; } = true;
    public string? ConflictDescription { get; set; }
}

public class SafeManningValidationResult
{
    public bool IsCompliant { get; set; }
    public bool HasMaster { get; set; }
    public bool HasChiefEngineer { get; set; }
    public int TotalCrewCount { get; set; }
    public List<string> Warnings { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}

public class DispatchVoyageRequest
{
    [Required]
    public int ShipId { get; set; }

    [Required]
    public int OriginPortId { get; set; }

    [Required]
    public int DestinationPortId { get; set; }

    [Required]
    public DateTime DepartureDate { get; set; }

    [Required]
    public DateTime ArrivalDate { get; set; }

    [MaxLength(100)]
    public string Purpose { get; set; } = "Ticari Sefer";

    [MaxLength(20)]
    public string? DockNumber { get; set; }

    public List<int> CrewMemberIds { get; set; } = new();
}

public class DispatchVoyageResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public ShipVisit? Visit { get; set; }
    public SafeManningValidationResult ManningStatus { get; set; } = new();
}
