using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LimanGemiTakip.Api.Models.Common;

namespace LimanGemiTakip.Api.Models;

public class Port : BaseEntity
{
    [Key]
    [Column("PortId")]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Country { get; set; } = string.Empty;

    [MaxLength(50)]
    public string City { get; set; } = string.Empty;

    public int Capacity { get; set; }
}
