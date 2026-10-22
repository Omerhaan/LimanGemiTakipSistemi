using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Security;
using Microsoft.EntityFrameworkCore;

namespace LimanGemiTakip.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Ship> Ships => Set<Ship>();

    public DbSet<Port> Ports => Set<Port>();

    public DbSet<ShipVisit> ShipVisits => Set<ShipVisit>();

    public DbSet<Cargo> Cargoes => Set<Cargo>();

    public DbSet<CrewMember> CrewMembers => Set<CrewMember>();

    public DbSet<ShipCrewAssignment> ShipCrewAssignments => Set<ShipCrewAssignment>();

    public DbSet<User> Users => Set<User>();

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Kullanıcılar
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Denetim Günlüğü (AuditLog - OWASP Bonus 3)
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.Timestamp);

        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.Action);

        // Gemiler (IMO Numarası Benzersizlik İndeksi - Soft Delete uyumlu filtrelenmiş indeks)
        modelBuilder.Entity<Ship>()
            .HasIndex(ship => ship.ImoNumber)
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // Limanlar (Liman Kodu UN/LOCODE Benzersizlik İndeksi - Soft Delete uyumlu filtrelenmiş indeks)
        modelBuilder.Entity<Port>()
            .HasIndex(port => port.Code)
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // Seferler / Ziyaretler ve Performans İndeksleri
        modelBuilder.Entity<ShipVisit>()
            .HasOne(visit => visit.Ship)
            .WithMany()
            .HasForeignKey(visit => visit.ShipId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ShipVisit>()
            .HasOne(visit => visit.Port)
            .WithMany()
            .HasForeignKey(visit => visit.PortId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ShipVisit>()
            .HasOne(visit => visit.OriginPort)
            .WithMany()
            .HasForeignKey(visit => visit.OriginPortId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ShipVisit>()
            .HasIndex(v => new { v.ShipId, v.ArrivalDate, v.DepartureDate });

        modelBuilder.Entity<ShipVisit>()
            .HasIndex(v => new { v.PortId, v.ArrivalDate, v.DepartureDate });

        modelBuilder.Entity<ShipVisit>()
            .HasIndex(v => v.OriginPortId);

        // Yük / Kargo
        modelBuilder.Entity<Cargo>()
            .HasOne(cargo => cargo.Ship)
            .WithMany()
            .HasForeignKey(cargo => cargo.ShipId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Cargo>()
            .HasIndex(c => c.ShipId);

        modelBuilder.Entity<Cargo>()
            .HasIndex(c => c.BillOfLadingNumber);

        // Personel & Gemi Atamaları
        modelBuilder.Entity<ShipCrewAssignment>()
            .HasOne(assignment => assignment.Ship)
            .WithMany()
            .HasForeignKey(assignment => assignment.ShipId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ShipCrewAssignment>()
            .HasOne(assignment => assignment.CrewMember)
            .WithMany()
            .HasForeignKey(assignment => assignment.CrewMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ShipCrewAssignment>()
            .HasIndex(a => a.CrewMemberId);

        modelBuilder.Entity<ShipCrewAssignment>()
            .HasIndex(assignment => new { assignment.ShipId, assignment.CrewMemberId, assignment.StartDate })
            .IsUnique();

        // Görev 5: Optimistic Concurrency Token (RowVersion)
        modelBuilder.Entity<ShipVisit>()
            .Property(v => v.RowVersion)
            .IsRowVersion();

        // Görev 6: Global Query Filters (Soft Delete)
        modelBuilder.Entity<Ship>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Port>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ShipVisit>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Cargo>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<CrewMember>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ShipCrewAssignment>().HasQueryFilter(e => !e.IsDeleted);
    }

    public override int SaveChanges()
    {
        ApplyAuditAndSoftDelete();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditAndSoftDelete();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditAndSoftDelete()
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<LimanGemiTakip.Api.Models.Common.BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy ??= "System";
                    entry.Entity.IsDeleted = false;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy ??= "System";
                    break;

                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy ??= "System";
                    break;
            }
        }
    }
}
