using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Common;
using LimanGemiTakip.Api.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace LimanGemiTakip.Api.Services;

public class CrewMemberService : ICrewMemberService
{
    private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);
    private static readonly Regex PhoneRegex = new(@"^\+?[0-9\s()\-]{7,20}$", RegexOptions.Compiled);
    private readonly IRepository<CrewMember> _repository;

    public CrewMemberService(IRepository<CrewMember> repository)
    {
        _repository = repository;
    }

    public Task<List<CrewMember>> GetAllAsync() => _repository.GetAllAsync();

    public async Task<PagedResult<CrewMember>> GetPagedAsync(PaginationParams paginationParams)
    {
        var query = _repository.Query();

        if (!string.IsNullOrWhiteSpace(paginationParams.SearchTerm))
        {
            var term = paginationParams.SearchTerm.Trim();
            query = query.Where(c => c.FirstName.Contains(term) ||
                                     c.LastName.Contains(term) ||
                                     c.Role.Contains(term) ||
                                     c.Email.Contains(term) ||
                                     c.Nationality.Contains(term));
        }

        // Not: PaginationParams içindeki Status alanı, personel listesinde Role (Görev) filtresi olarak kullanılmaktadır.
        if (!string.IsNullOrWhiteSpace(paginationParams.Status))
        {
            query = query.Where(c => c.Role == paginationParams.Status);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(c => c.FirstName)
            .ThenBy(c => c.LastName)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();

        return new PagedResult<CrewMember>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize
        };
    }

    public Task<CrewMember?> GetByIdAsync(int id) => _repository.GetByIdAsync(id);



    public Task<CrewMember> CreateAsync(CrewMember entity)
    {
        Validate(entity);
        return _repository.AddAsync(entity);
    }



    public async Task<CrewMember?> UpdateAsync(int id, CrewMember entity)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return null;
        }

        Validate(entity);
        existing.FirstName = entity.FirstName;
        existing.LastName = entity.LastName;
        existing.Role = entity.Role;
        existing.Email = entity.Email;
        existing.Phone = entity.Phone;
        existing.Nationality = entity.Nationality;
        return await _repository.UpdateAsync(existing);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return false;
        }

        await _repository.DeleteAsync(existing);
        return true;
    }

    private static void Validate(CrewMember entity)
    {
        if (string.IsNullOrWhiteSpace(entity.FirstName))
        {
            throw new ArgumentException("Personel adı (FirstName) zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(entity.LastName))
        {
            throw new ArgumentException("Personel soyadı (LastName) zorunludur.");
        }

        entity.FullName = $"{entity.FirstName} {entity.LastName}".Trim();

        if (string.IsNullOrWhiteSpace(entity.Role))
        {
            throw new ArgumentException("Görev alanı zorunludur.");
        }

        if (!EmailRegex.IsMatch(entity.Email))
        {
            throw new ArgumentException("Geçerli bir e-posta adresi giriniz.");
        }

        if (!PhoneRegex.IsMatch(entity.Phone))
        {
            throw new ArgumentException("Geçerli bir telefon numarası giriniz.");
        }
    }
}
