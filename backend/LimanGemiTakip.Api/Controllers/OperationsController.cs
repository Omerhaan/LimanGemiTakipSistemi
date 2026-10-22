using LimanGemiTakip.Api.Models.Operations;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[ApiController]
[Route("api/operations")]
public class OperationsController : ControllerBase
{
    private readonly IOperationService _operationService;

    public OperationsController(IOperationService operationService)
    {
        _operationService = operationService;
    }

    /// <summary>
    /// GÖREV 4: Tek bir çağrıda ShipVisit, Cargo ve Mürettebat Atamalarını atomik transaction ile kaydeder.
    /// Herhangi bir hata durumunda tüm işlemler geri alınır (Rollback).
    /// </summary>
    [HttpPost("full-arrival")]
    [Authorize(Roles = "Admin,Operator")]
    public async Task<ActionResult<FullArrivalResponseDto>> RegisterFullArrival([FromBody] FullArrivalRequestDto request)
    {
        try
        {
            var result = await _operationService.RegisterFullArrivalAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message,
                transactionStatus = "RolledBack"
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message,
                transactionStatus = "RolledBack"
            });
        }
    }
}
