using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[Route("api/ships")]
public class ShipsController : CrudControllerBase<Ship>
{
    public ShipsController(IShipService service)
        : base(service)
    {
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public override Task<ActionResult<Ship>> Create(Ship entity)
    {
        return base.Create(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public override Task<ActionResult<Ship>> Update(int id, Ship entity)
    {
        return base.Update(id, entity);
    }
}
