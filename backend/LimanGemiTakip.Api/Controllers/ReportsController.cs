using LimanGemiTakip.Api.Models.Reports;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// GÖREV 2: N+1 Query Problemli Rapor (Bilinçli Olarak Verimsiz)
    /// </summary>
    [HttpGet("operation-summary-inefficient")]
    public async Task<ActionResult<OperationReportResponseDto>> GetInefficientReport(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _reportService.GetOperationsSlowAsync(pageNumber, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// GÖREV 3: Optimize Edilmiş Tek Sorgulu Rapor (AsNoTracking + DTO Projection + Paging)
    /// </summary>
    [HttpGet("operation-summary-optimized")]
    public async Task<ActionResult<OperationReportResponseDto>> GetOptimizedReport(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _reportService.GetOperationsOptimizedAsync(pageNumber, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// GÖREV 3: İki Yaklaşımın Karşılaştırmalı Performans Analiz Raporu
    /// </summary>
    [HttpGet("performance-comparison")]
    public async Task<ActionResult<PerformanceComparisonResultDto>> GetPerformanceComparison(
        [FromQuery] int sampleSize = 50)
    {
        var result = await _reportService.GetPerformanceComparisonAsync(sampleSize);
        return Ok(result);
    }

    /// <summary>
    /// Dashboard grafikleri için aggregate veriler
    /// </summary>
    [HttpGet("dashboard-charts")]
    public async Task<ActionResult<DashboardChartsDto>> GetDashboardCharts()
    {
        var result = await _reportService.GetDashboardChartsAsync();
        return Ok(result);
    }
}
