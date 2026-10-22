using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LimanGemiTakip.Api.Models.Common;

namespace LimanGemiTakip.Api.Models;

public class CrewMember : BaseEntity
{
    [Key]
    [Column("CrewId")]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    [NotMapped]
    public string FullName
    {
        get => $"{FirstName} {LastName}".Trim();
        set { /* Computed property, not persisted in database */ }
    }

    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    [Column("PhoneNumber")]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Nationality { get; set; } = "T.C.";
}
