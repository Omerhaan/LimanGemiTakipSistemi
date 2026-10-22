namespace LimanGemiTakip.Api.Models.Operations;

public class FullArrivalRequestDto
{
    public int ShipId { get; set; }
    public int PortId { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public string Purpose { get; set; } = "Yükleme & Personel Değişimi";
    public string? DockNumber { get; set; }

    public List<CargoItemRequestDto> Cargoes { get; set; } = new();
    public List<CrewAssignmentRequestDto> CrewAssignments { get; set; } = new();

    /// <summary>
    /// Görev 4: Rollback testi için kasıtlı hata fırlatma simülasyonu
    /// </summary>
    public bool SimulateFailureAtStep { get; set; } = false;
    public string? SimulationFailureReason { get; set; }
}

public class CargoItemRequestDto
{
    public string Description { get; set; } = string.Empty;
    public decimal WeightTons { get; set; }
    public string Type { get; set; } = "Konteyner";
    public int? ContainerCount { get; set; }
}

public class CrewAssignmentRequestDto
{
    public int CrewMemberId { get; set; }
    public string RoleOnShip { get; set; } = "Kaptan";
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class FullArrivalResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? CreatedVisitId { get; set; }
    public int CreatedCargoCount { get; set; }
    public int CreatedAssignmentCount { get; set; }
    public string TransactionStatus { get; set; } = string.Empty; // "Committed" or "RolledBack"
}
