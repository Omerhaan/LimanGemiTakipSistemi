using LimanGemiTakip.Api.Models.Common;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[ApiController]
[Authorize]
public abstract class CrudControllerBase<T> : ControllerBase where T : class
{
    private readonly IEntityService<T> _service;

    protected CrudControllerBase(IEntityService<T> service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize]
    public virtual async Task<ActionResult<List<T>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("paged")]
    [Authorize]
    public virtual async Task<ActionResult<PagedResult<T>>> GetPaged([FromQuery] PaginationParams paginationParams)
    {
        return Ok(await _service.GetPagedAsync(paginationParams));
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public virtual async Task<ActionResult<T>> GetById(int id)
    {
        var entity = await _service.GetByIdAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        return Ok(entity);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Operator")]
    public virtual async Task<ActionResult<T>> Create(T entity)
    {
        try
        {
            var created = await _service.CreateAsync(entity);
            var idProperty = typeof(T).GetProperty("Id");
            var id = idProperty?.GetValue(created);
            return CreatedAtAction(nameof(GetById), new { id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Operator")]
    public virtual async Task<ActionResult<T>> Update(int id, T entity)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, entity);
            if (updated is null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            return Conflict(new
            {
                message = "Eş Zamanlı Güncelleme Çakışması (Optimistic Concurrency): Bu kayıt sizden önce başka bir kullanıcı tarafından değiştirilmiştir. Değişikliklerinizin üzerine yazılmaması için işlem durduruldu. Lütfen sayfayı yenileyip en güncel veri üzerinden tekrar deneyiniz.",
                code = "CONCURRENCY_CONFLICT"
            });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public virtual async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
