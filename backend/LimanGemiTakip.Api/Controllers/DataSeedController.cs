using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/test-data")]
public class DataSeedController : ControllerBase
{
    private readonly IDataSeederService _seederService;
    private readonly IWebHostEnvironment _env;

    public DataSeedController(IDataSeederService seederService, IWebHostEnvironment env)
    {
        _seederService = seederService;
        _env = env;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DatabaseStatsDto>> GetStats()
    {
        var stats = await _seederService.GetDatabaseStatsAsync();
        return Ok(stats);
    }

    [HttpPost("generate-mass-data")]
    public async Task<ActionResult<DataSeedResultDto>> GenerateMassData(
        [FromQuery] int ships = 1000,
        [FromQuery] int ports = 100,
        [FromQuery] int visits = 5000,
        [FromQuery] int cargo = 10000,
        [FromQuery] int crew = 5000,
        [FromQuery] int assignments = 15000)
    {
        if (!_env.IsDevelopment())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new DataSeedResultDto
            {
                Success = false,
                Message = "403 FORBIDDEN: Toplu test verisi üretimi üretim ortamlarında güvenlik nedeniyle devre dışıdır. Yalnızca Development ortamında çalıştırılabilir."
            });
        }

        var result = await _seederService.SeedMassDataAsync(ships, ports, visits, cargo, crew, assignments);
        return Ok(result);
    }

    [HttpPost("reset-to-initial")]
    public async Task<ActionResult<DataSeedResultDto>> ResetToInitial()
    {
        if (!_env.IsDevelopment())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new DataSeedResultDto
            {
                Success = false,
                Message = "403 FORBIDDEN: Veritabanı fabrika ayarlarına sıfırlama işlemi üretim ortamlarında güvenlik nedeniyle devre dışıdır. Yalnızca Development ortamında çalıştırılabilir."
            });
        }

        var result = await _seederService.ResetToInitialDataAsync();
        return Ok(result);
    }
}
