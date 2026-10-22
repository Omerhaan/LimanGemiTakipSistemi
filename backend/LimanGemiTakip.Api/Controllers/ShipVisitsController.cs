using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Operations;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[Route("api/ship-visits")]
public class ShipVisitsController : CrudControllerBase<ShipVisit>
{
    private readonly IShipVisitService _visitService;

    public ShipVisitsController(IShipVisitService service)
        : base(service)
    {
        _visitService = service;
    }

    [HttpGet("available-ships")]
    [Authorize]
    public async Task<ActionResult<List<AvailableShipDto>>> GetAvailableShips(
        [FromQuery] DateTime departureDate,
        [FromQuery] DateTime arrivalDate)
    {
        var ships = await _visitService.GetAvailableShipsAsync(departureDate, arrivalDate);
        return Ok(ships);
    }

    [HttpGet("available-crew")]
    [Authorize]
    public async Task<ActionResult<List<AvailableCrewDto>>> GetAvailableCrew(
        [FromQuery] DateTime departureDate,
        [FromQuery] DateTime arrivalDate,
        [FromQuery] string? role = null)
    {
        var crew = await _visitService.GetAvailableCrewAsync(departureDate, arrivalDate, role);
        return Ok(crew);
    }

    [HttpPost("validate-safe-manning")]
    [Authorize]
    public async Task<ActionResult<SafeManningValidationResult>> ValidateSafeManning(
        [FromBody] ValidateManningRequest request)
    {
        var result = await _visitService.ValidateSafeManningAsync(request.ShipId, request.CrewMemberIds);
        return Ok(result);
    }

    [HttpPost("dispatch")]
    [Authorize(Roles = "Admin,Operator")]
    public async Task<ActionResult<DispatchVoyageResponse>> DispatchVoyage(
        [FromBody] DispatchVoyageRequest request)
    {
        var result = await _visitService.DispatchVoyageAsync(request);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}

public class ValidateManningRequest
{
    public int ShipId { get; set; }
    public List<int> CrewMemberIds { get; set; } = new();
}
