namespace LimanGemiTakip.Api.Models.Reports;

public class OperationReportItemDto
{
    public int VisitId { get; set; }
    public string ShipName { get; set; } = string.Empty;
    public string PortName { get; set; } = string.Empty;
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CargoCount { get; set; }
    public decimal TotalCargoWeightTons { get; set; }
    public int CrewCount { get; set; }
}

public class OperationReportResponseDto
{
    public List<OperationReportItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int QueryCount { get; set; }
    public double ExecutionTimeMs { get; set; }
    public string Approach { get; set; } = string.Empty;
}

public class PerformanceComparisonResultDto
{
    public int TotalRecordsAnalyzed { get; set; }
    public ApproachMetric InefficientNPlusOne { get; set; } = new();
    public ApproachMetric OptimizedSingleQuery { get; set; } = new();
    public double SpeedupFactor { get; set; }
    public double QueryReductionPercentage { get; set; }
    public string AnalysisSummary { get; set; } = string.Empty;
}

public class ApproachMetric
{
    public int SqlQueryCount { get; set; }
    public double ExecutionTimeMs { get; set; }
    public string MemoryUsage { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
