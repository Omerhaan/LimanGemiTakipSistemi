namespace LimanGemiTakip.Api.Models.Reports;

/// <summary>
/// Dashboard grafikleri için aggregate veri DTO'ları
/// </summary>
public class DashboardChartsDto
{
    public List<ShipTypeDistributionItem> ShipTypeDistribution { get; set; } = new();
    public List<MonthlyVisitItem> MonthlyVisits { get; set; } = new();
    public List<CargoTypeBreakdownItem> CargoTypeBreakdown { get; set; } = new();
    public List<PortOccupancyItem> TopPortOccupancy { get; set; } = new();
    public FleetSummary Fleet { get; set; } = new();
}

public class ShipTypeDistributionItem
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class MonthlyVisitItem
{
    public string Month { get; set; } = string.Empty;
    public int Scheduled { get; set; }
    public int Docked { get; set; }
    public int Departed { get; set; }
    public int Cancelled { get; set; }
}

public class CargoTypeBreakdownItem
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalWeightTons { get; set; }
}

public class PortOccupancyItem
{
    public string PortName { get; set; } = string.Empty;
    public int DockedCount { get; set; }
    public int Capacity { get; set; }
    public double OccupancyPercent { get; set; }
}

public class FleetSummary
{
    public int TotalShips { get; set; }
    public int ActiveVoyages { get; set; }
    public int DockedShips { get; set; }
    public decimal TotalCargoTons { get; set; }
    public int TotalCrew { get; set; }
    public int AssignedCrew { get; set; }
}
