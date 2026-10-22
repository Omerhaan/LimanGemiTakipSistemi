using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[Route("api/ports")]
public class PortsController : CrudControllerBase<Port>
{
    public PortsController(IPortService service)
        : base(service)
    {
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public override Task<ActionResult<Port>> Create(Port entity)
    {
        return base.Create(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public override Task<ActionResult<Port>> Update(int id, Port entity)
    {
        return base.Update(id, entity);
    }
}
