using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LimanGemiTakip.Api.Services;

public interface IDataSeederService
{
    Task<DataSeedResultDto> SeedMassDataAsync(int targetShips = 1000, int targetPorts = 100, int targetVisits = 5000, int targetCargo = 10000, int targetCrew = 5000, int targetAssignments = 15000);
    Task<DataSeedResultDto> ResetToInitialDataAsync();
    Task<DatabaseStatsDto> GetDatabaseStatsAsync();
}

public class DatabaseStatsDto
{
    public int ShipCount { get; set; }
    public int PortCount { get; set; }
    public int VisitCount { get; set; }
    public int CargoCount { get; set; }
    public int CrewCount { get; set; }
    public int AssignmentCount { get; set; }
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}

public class DataSeedResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public double ElapsedMilliseconds { get; set; }
    public DatabaseStatsDto FinalStats { get; set; } = new();
}

public class DataSeederService : IDataSeederService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DataSeederService> _logger;

    public DataSeederService(ApplicationDbContext context, ILogger<DataSeederService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DatabaseStatsDto> GetDatabaseStatsAsync()
    {
        return new DatabaseStatsDto
        {
            ShipCount = await _context.Ships.IgnoreQueryFilters().CountAsync(),
            PortCount = await _context.Ports.IgnoreQueryFilters().CountAsync(),
            VisitCount = await _context.ShipVisits.IgnoreQueryFilters().CountAsync(),
            CargoCount = await _context.Cargoes.IgnoreQueryFilters().CountAsync(),
            CrewCount = await _context.CrewMembers.IgnoreQueryFilters().CountAsync(),
            AssignmentCount = await _context.ShipCrewAssignments.IgnoreQueryFilters().CountAsync()
        };
    }

    public async Task<DataSeedResultDto> SeedMassDataAsync(
        int targetShips = 1000,
        int targetPorts = 100,
        int targetVisits = 5000,
        int targetCargo = 10000,
        int targetCrew = 5000,
        int targetAssignments = 15000)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        _logger.LogInformation("Toplu test verisi üretimi başlatılıyor...");

        // 1. Limanlar (100+ Gerçek Dünya Limanları - UN/LOCODE)
        var currentPorts = await _context.Ports.IgnoreQueryFilters().CountAsync();
        if (currentPorts < targetPorts)
        {
            var existingCodes = await _context.Ports.IgnoreQueryFilters().Select(p => p.Code).ToListAsync();
            var existingCodeSet = new HashSet<string>(existingCodes, StringComparer.OrdinalIgnoreCase);

            var catalog = GetGlobalPortCatalog();
            var portsToAdd = new List<Port>();

            foreach (var item in catalog)
            {
                if (!existingCodeSet.Contains(item.Code))
                {
                    portsToAdd.Add(new Port
                    {
                        Name = item.Name,
                        Code = item.Code,
                        Country = item.Country,
                        City = item.City,
                        Capacity = item.Capacity,
                        CreatedBy = "MassDataSeeder"
                    });
                    existingCodeSet.Add(item.Code);

                    if (currentPorts + portsToAdd.Count >= targetPorts)
                    {
                        break;
                    }
                }
            }

            // Eğer hedef sayı katalogdan fazlaysa tamamlayıcı limanlar ekle
            int counter = 1;
            while (currentPorts + portsToAdd.Count < targetPorts)
            {
                var code = $"WLD{counter:D3}";
                if (!existingCodeSet.Contains(code))
                {
                    portsToAdd.Add(new Port
                    {
                        Name = $"Uluslararası Ticaret Terminali #{counter}",
                        Code = code,
                        Country = "Uluslararası Sular",
                        City = $"Serbest Bölge {counter}",
                        Capacity = 45,
                        CreatedBy = "MassDataSeeder"
                    });
                    existingCodeSet.Add(code);
                }
                counter++;
            }

            if (portsToAdd.Any())
            {
                await _context.Ports.AddRangeAsync(portsToAdd);
                await _context.SaveChangesAsync();
            }
        }

        // 2. Gemiler (Geçerli IMO Numaraları ile)
        var currentShips = await _context.Ships.IgnoreQueryFilters().CountAsync();
        if (currentShips < targetShips)
        {
            var shipsToAdd = new List<Ship>();
            for (int i = currentShips + 1; i <= targetShips; i++)
            {
                int baseNum = 900000 + i;
                int d1 = (baseNum / 100000) % 10;
                int d2 = (baseNum / 10000) % 10;
                int d3 = (baseNum / 1000) % 10;
                int d4 = (baseNum / 100) % 10;
                int d5 = (baseNum / 10) % 10;
                int d6 = baseNum % 10;
                int chk = (d1 * 7 + d2 * 6 + d3 * 5 + d4 * 4 + d5 * 3 + d6 * 2) % 10;
                string imo = $"{baseNum}{chk}";

                shipsToAdd.Add(new Ship
                {
                    Name = $"Ticari Gemi {i}",
                    ImoNumber = imo,
                    Type = (i % 6) switch
                    {
                        0 => "Konteyner",
                        1 => "Tanker",
                        2 => "Kuru Yük",
                        3 => "Ro-Ro",
                        4 => "Genel Kargo",
                        _ => "Dökme Yük"
                    },
                    Flag = (i % 4) switch { 0 => "Türkiye", 1 => "Panama", 2 => "Malta", _ => "Liberya" },
                    BuiltYear = 2000 + (i % 24),
                    DeadweightTonnage = 20000m + ((i * 137) % 60000),
                    CreatedBy = "MassDataSeeder"
                });
            }
            await _context.Ships.AddRangeAsync(shipsToAdd);
            await _context.SaveChangesAsync();
        }

        // 3. Mürettebat
        var currentCrew = await _context.CrewMembers.IgnoreQueryFilters().CountAsync();
        if (currentCrew < targetCrew)
        {
            var crewToAdd = new List<CrewMember>();
            for (int i = currentCrew + 1; i <= targetCrew; i++)
            {
                crewToAdd.Add(new CrewMember
                {
                    FirstName = $"Denizci{i}",
                    LastName = $"Soyad{i}",
                    FullName = $"Denizci{i} Soyad{i}",
                    Role = (i % 5) switch
                    {
                        0 => "Kaptan (Master)",
                        1 => "Çarkçıbaşı (Chief Engineer)",
                        2 => "1. Zabit (Chief Officer)",
                        3 => "Usta Gemici (Able Seaman)",
                        _ => "Yağcı (Oiler)"
                    },
                    Email = $"denizci{i}@denizcilik.com",
                    Phone = $"+90 532 {i % 1000:D3} {(i * 17) % 10000:D4}",
                    Nationality = "T.C.",
                    CreatedBy = "MassDataSeeder"
                });
            }
            await _context.CrewMembers.AddRangeAsync(crewToAdd);
            await _context.SaveChangesAsync();
        }

        // 4. Kargo / Yükler
        var currentCargo = await _context.Cargoes.IgnoreQueryFilters().CountAsync();
        if (currentCargo < targetCargo)
        {
            var shipIds = await _context.Ships.Select(s => s.Id).Take(1000).ToListAsync();
            var cargoToAdd = new List<Cargo>();
            for (int i = currentCargo + 1; i <= targetCargo; i++)
            {
                int shipId = shipIds[(i % shipIds.Count)];
                cargoToAdd.Add(new Cargo
                {
                    ShipId = shipId,
                    Description = $"Ticari Sevkiyat Lot #{i}",
                    WeightTons = 50m + ((i * 43) % 2500),
                    Type = (i % 4) switch { 0 => "Konteyner", 1 => "Sıvı Yakıt", 2 => "Dökme Tahıl", _ => "Kuru Yük" },
                    ContainerCount = (i % 4 == 0) ? 20 + (i % 150) : null,
                    CreatedBy = "MassDataSeeder"
                });
            }
            await _context.Cargoes.AddRangeAsync(cargoToAdd);
            await _context.SaveChangesAsync();
        }

        // 5. Gemi Ziyaretleri (ShipVisits)
        var currentVisits = await _context.ShipVisits.IgnoreQueryFilters().CountAsync();
        if (currentVisits < targetVisits)
        {
            var shipIds = await _context.Ships.Select(s => s.Id).ToListAsync();
            var ports = await _context.Ports.Select(p => new { p.Id, p.Capacity }).ToListAsync();
            var visitsToAdd = new List<ShipVisit>();
            var now = DateTime.UtcNow;

            int neededVisits = targetVisits - currentVisits;

            // 1. Rıhtımdaki Gemiler (Docked)
            // Gerçekçi denizcilik kuralı: 1.000 gemilik filoda anlık olarak ~%25-30'u (yaklaşık 250 gemi) limanlarda yanaşıktır.
            // Hiçbir gemi aynı anda 2 farklı limana yanaşık olamaz; her rıhtımdaki gemi benzersiz (distinct) olmalıdır.
            int targetDocked = Math.Min(250, shipIds.Count);
            int dockedAdded = 0;
            int portIndex = 0;

            for (int i = 0; i < targetDocked && visitsToAdd.Count < neededVisits; i++)
            {
                var port = ports[portIndex % ports.Count];
                portIndex++;
                int shipId = shipIds[i];

                var arr = now.AddHours(-4 - ((i * 7 + port.Id) % 36));
                var dep = now.AddHours(8 + ((i * 11 + port.Id) % 48));

                var origPort = ports[(portIndex + 1) % ports.Count];
                visitsToAdd.Add(new ShipVisit
                {
                    ShipId = shipId,
                    PortId = port.Id,
                    OriginPortId = origPort.Id,
                    ArrivalDate = arr,
                    DepartureDate = dep,
                    Purpose = (i % 3) switch { 0 => "Yük Boşaltma ve İkmal", 1 => "Yükleme Operasyonu", _ => "Rıhtım İkmali" },
                    Status = "Docked",
                    DockNumber = $"Rıhtım-{(i % 10) + 1}",
                    CreatedBy = "MassDataSeeder"
                });
                dockedAdded++;
            }

            // 2. Gelecek / Planlanan Seferler (Scheduled)
            // Filodaki farklı gemiler için önümüzdeki günlere planlanan seferler (~200 adet)
            int targetScheduled = Math.Min(200, Math.Max(0, shipIds.Count - dockedAdded));
            for (int s = 0; s < targetScheduled && visitsToAdd.Count < neededVisits; s++)
            {
                int shipId = shipIds[(dockedAdded + s) % shipIds.Count];
                var port = ports[(portIndex++) % ports.Count];
                var origPort = ports[(portIndex + 2) % ports.Count];

                var arr = now.AddDays(1 + ((s * 5 + port.Id) % 25));
                var dep = arr.AddDays(2 + (s % 4));

                visitsToAdd.Add(new ShipVisit
                {
                    ShipId = shipId,
                    PortId = port.Id,
                    OriginPortId = origPort.Id,
                    ArrivalDate = arr,
                    DepartureDate = dep,
                    Purpose = (s % 2 == 0) ? "Planlı Yükleme" : "Periyodik Sefer",
                    Status = "Scheduled",
                    DockNumber = $"Rıhtım-{(s % 10) + 1}",
                    CreatedBy = "MassDataSeeder"
                });
            }

            // 3. Geçmiş / Tamamlanan Seferler (Departed)
            // Kalan tüm hedef ziyaretler (yaklaşık 4.550 adet) geçmiş 1-2 yılda tamamlanan sefer kayıtlarıdır.
            int visitCounter = 1;
            while (visitsToAdd.Count < neededVisits)
            {
                var port = ports[visitCounter % ports.Count];
                var origPort = ports[(visitCounter + 3) % ports.Count];
                int shipId = shipIds[visitCounter % shipIds.Count];

                var dep = now.AddDays(-2 - (visitCounter % 360));
                var arr = dep.AddDays(-2 - (visitCounter % 4));

                visitsToAdd.Add(new ShipVisit
                {
                    ShipId = shipId,
                    PortId = port.Id,
                    OriginPortId = origPort.Id,
                    ArrivalDate = arr,
                    DepartureDate = dep,
                    Purpose = (visitCounter % 4) switch
                    {
                        0 => "Konteyner Tahliyesi",
                        1 => "Genel Kargo Yükleme",
                        2 => "Dökme Yük İkmali",
                        _ => "Sefer Tamamlandı"
                    },
                    Status = "Departed",
                    DockNumber = $"Rıhtım-{(visitCounter % 15) + 1}",
                    CreatedBy = "MassDataSeeder"
                });
                visitCounter++;
            }

            await _context.ShipVisits.AddRangeAsync(visitsToAdd);
            await _context.SaveChangesAsync();
        }

        // 6. Gemi-Mürettebat Atamaları
        var currentAssignments = await _context.ShipCrewAssignments.IgnoreQueryFilters().CountAsync();
        if (currentAssignments < targetAssignments)
        {
            var shipIds = await _context.Ships.Select(s => s.Id).Take(1000).ToListAsync();
            var crewIds = await _context.CrewMembers.Select(c => c.Id).Take(5000).ToListAsync();
            var assignmentsToAdd = new List<ShipCrewAssignment>();
            var now = DateTime.UtcNow;

            for (int i = currentAssignments + 1; i <= targetAssignments; i++)
            {
                int shipId = shipIds[(i % shipIds.Count)];
                int crewId = crewIds[(i % crewIds.Count)];
                var start = now.AddMonths(-12 + (i % 24));
                var end = start.AddMonths(3 + (i % 6));

                assignmentsToAdd.Add(new ShipCrewAssignment
                {
                    ShipId = shipId,
                    CrewMemberId = crewId,
                    StartDate = start,
                    EndDate = end,
                    RoleOnShip = (i % 4) switch { 0 => "Kaptan", 1 => "Başmühendis", 2 => "2. Kaptan", _ => "Usta Gemici" },
                    CreatedBy = "MassDataSeeder"
                });
            }
            await _context.ShipCrewAssignments.AddRangeAsync(assignmentsToAdd);
            await _context.SaveChangesAsync();
        }

        sw.Stop();
        var finalStats = await GetDatabaseStatsAsync();

        return new DataSeedResultDto
        {
            Success = true,
            Message = "Toplu test verileri başarıyla oluşturuldu.",
            ElapsedMilliseconds = sw.ElapsedMilliseconds,
            FinalStats = finalStats
        };
    }

    public async Task<DataSeedResultDto> ResetToInitialDataAsync()
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        _logger.LogInformation("Veritabanı fabrika ayarlarına döndürülüyor...");

        try
        {
            _context.Database.SetCommandTimeout(180);

            if (_context.Database.IsSqlServer())
            {
                await _context.Database.ExecuteSqlRawAsync(@"
                    DELETE FROM ShipCrewAssignments WHERE CreatedBy = 'MassDataSeeder';
                    DELETE FROM Cargoes WHERE CreatedBy = 'MassDataSeeder';
                    DELETE FROM ShipVisits WHERE CreatedBy = 'MassDataSeeder';
                    DELETE FROM CrewMembers WHERE CreatedBy = 'MassDataSeeder';
                    DELETE FROM Ships WHERE CreatedBy = 'MassDataSeeder';
                    DELETE FROM Ports WHERE CreatedBy = 'MassDataSeeder';
                ");
            }
            else
            {
                var massAssignments = await _context.ShipCrewAssignments.IgnoreQueryFilters().Where(a => a.CreatedBy == "MassDataSeeder").ToListAsync();
                _context.ShipCrewAssignments.RemoveRange(massAssignments);

                var massCargoes = await _context.Cargoes.IgnoreQueryFilters().Where(c => c.CreatedBy == "MassDataSeeder").ToListAsync();
                _context.Cargoes.RemoveRange(massCargoes);

                var massVisits = await _context.ShipVisits.IgnoreQueryFilters().Where(v => v.CreatedBy == "MassDataSeeder").ToListAsync();
                _context.ShipVisits.RemoveRange(massVisits);

                var massCrew = await _context.CrewMembers.IgnoreQueryFilters().Where(c => c.CreatedBy == "MassDataSeeder").ToListAsync();
                _context.CrewMembers.RemoveRange(massCrew);

                var massShips = await _context.Ships.IgnoreQueryFilters().Where(s => s.CreatedBy == "MassDataSeeder").ToListAsync();
                _context.Ships.RemoveRange(massShips);

                var massPorts = await _context.Ports.IgnoreQueryFilters().Where(p => p.CreatedBy == "MassDataSeeder").ToListAsync();
                _context.Ports.RemoveRange(massPorts);

                await _context.SaveChangesAsync();
            }

            sw.Stop();
            var finalStats = await GetDatabaseStatsAsync();

            return new DataSeedResultDto
            {
                Success = true,
                Message = "Test verileri başarıyla temizlendi ve sistem fabrika ayarlarına (temiz orijinal veritabanına) döndürüldü.",
                ElapsedMilliseconds = sw.ElapsedMilliseconds,
                FinalStats = finalStats
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Veri sıfırlama sırasında hata oluştu");
            return new DataSeedResultDto
            {
                Success = false,
                Message = $"Sıfırlama hatası: {ex.Message}",
                ElapsedMilliseconds = sw.ElapsedMilliseconds,
                FinalStats = await GetDatabaseStatsAsync()
            };
        }
    }

    private static List<(string Name, string Code, string Country, string City, int Capacity)> GetGlobalPortCatalog()
    {
        return new List<(string, string, string, string, int)>
        {
            // 1. Türkiye, Karadeniz & Boğazlar
            ("İstanbul Ambarlı Limanı", "TRIST", "Türkiye", "İstanbul", 65),
            ("Tekirdağ Asyaport", "TRASY", "Türkiye", "Tekirdağ", 50),
            ("Mersin Uluslararası Limanı (MIP)", "TRMER", "Türkiye", "Mersin", 60),
            ("İzmir Alsancak Limanı", "TRIZM", "Türkiye", "İzmir", 45),
            ("Nemrut / Nemport Körfezi", "TRNMP", "Türkiye", "Aliağa", 40),
            ("İskenderun Limanı", "TRISK", "Türkiye", "İskenderun", 40),
            ("Kocaeli / Derince Limanı", "TRKOC", "Türkiye", "Kocaeli", 55),
            ("Gemlik Borusan Limanı", "TRGEM", "Türkiye", "Bursa", 35),
            ("Samsun Port", "TRSSX", "Türkiye", "Samsun", 30),
            ("Trabzon Limanı", "TRTZX", "Türkiye", "Trabzon", 25),
            ("Filyos Limanı", "TRFLY", "Türkiye", "Zonguldak", 35),
            ("Bandırma Limanı", "TRBND", "Türkiye", "Balıkesir", 30),
            ("Çanakkale Kepez Limanı", "TRCKZ", "Türkiye", "Çanakkale", 25),
            ("Antalya Port Akdeniz", "TRANT", "Türkiye", "Antalya", 30),
            ("Haydarpaşa Limanı", "TRHAY", "Türkiye", "İstanbul", 35),
            ("Bodrum Kruvaziyer Limanı", "TRBDM", "Türkiye", "Muğla", 20),
            ("Köstence Limanı (Constanta)", "ROCND", "Romanya", "Constanta", 60),
            ("Odesa Limanı", "UAODS", "Ukrayna", "Odesa", 45),
            ("Varna Limanı", "BGVAR", "Bulgaristan", "Varna", 35),
            ("Burgaz Limanı (Burgas)", "BGBOJ", "Bulgaristan", "Burgas", 30),
            ("Poti Limanı", "GEPTI", "Gürcistan", "Poti", 30),
            ("Batum Limanı (Batumi)", "GEBUS", "Gürcistan", "Batumi", 25),

            // 2. Akdeniz & Ege & Adriyatik
            ("Piraeus Port (Atina)", "GRPIR", "Yunanistan", "Atina", 75),
            ("Selanik Limanı (Thessaloniki)", "GRSKG", "Yunanistan", "Selanik", 40),
            ("Kandiye Limanı (Heraklion)", "GRHER", "Yunanistan", "Girit", 30),
            ("Valensiya Limanı (Valencia)", "ESVLC", "İspanya", "Valensiya", 70),
            ("Barselona Limanı (Barcelona)", "ESBCN", "İspanya", "Barselona", 65),
            ("Algeciras Limanı", "ESALG", "İspanya", "Algeciras", 70),
            ("Cenova Limanı (Genoa)", "ITGOA", "İtalya", "Cenova", 60),
            ("Taranto Limanı", "ITTAR", "İtalya", "Taranto", 40),
            ("Trieste Limanı", "ITTRS", "İtalya", "Trieste", 50),
            ("Livorno Limanı", "ITLIV", "İtalya", "Livorno", 35),
            ("Marsilya Limanı (Marseille Fos)", "FRMRS", "Fransa", "Marsilya", 60),
            ("Marsaxlokk Freeport (Malta)", "MTMLA", "Malta", "Marsaxlokk", 55),
            ("Limasol Limanı (Limassol)", "CYLMS", "Kıbrıs", "Limasol", 35),
            ("Beyrut Limanı (Beirut)", "LBBEY", "Lübnan", "Beyrut", 35),
            ("Hayfa Limanı (Haifa)", "ILHFA", "İsrail", "Hayfa", 45),
            ("Aşdod Limanı (Ashdod)", "ILASH", "İsrail", "Aşdod", 40),
            ("Port Said (Süveyş Girişi)", "EGPSD", "Mısır", "Port Said", 70),
            ("İskenderiye Limanı (Alexandria)", "EGALY", "Mısır", "İskenderiye", 55),
            ("Dekheila Limanı", "EGEDK", "Mısır", "İskenderiye", 40),
            ("Dimyat Limanı (Damietta)", "EGDAM", "Mısır", "Dimyat", 45),

            // 3. Kuzey Afrika & Atlantik & Cebelitarık
            ("Tanca Med Limanı (Tanger Med)", "MAPTM", "Fas", "Tanca", 75),
            ("Kazablanka Limanı (Casablanca)", "MACAS", "Fas", "Kazablanka", 45),
            ("Cezayir Limanı (Algiers)", "DZALG", "Cezayir", "Cezayir", 40),
            ("Oran Limanı", "DZORN", "Cezayir", "Oran", 35),
            ("Rades Limanı (Tunis)", "TNTUN", "Tunus", "Tunus", 35),
            ("Trablus Limanı (Tripoli)", "LYTIP", "Libya", "Trablus", 30),
            ("Bingazi Limanı (Benghazi)", "LYBEN", "Libya", "Bingazi", 25),
            ("Lizbon Limanı (Lisbon)", "PTLIS", "Portekiz", "Lizbon", 45),
            ("Sines Limanı", "PTSIE", "Portekiz", "Sines", 50),
            ("Vigo Limanı", "ESVGO", "İspanya", "Vigo", 35),

            // 4. Kuzey Avrupa, Baltık & Birleşik Krallık
            ("Rotterdam Limanı (Port of Rotterdam)", "NLRTM", "Hollanda", "Rotterdam", 90),
            ("Anvers Limanı (Antwerp-Bruges)", "BEANR", "Belçika", "Anvers", 85),
            ("Hamburg Limanı", "DEHAM", "Almanya", "Hamburg", 80),
            ("Bremerhaven Limanı", "DEBRE", "Almanya", "Bremerhaven", 60),
            ("Felixstowe Limanı", "GBFXT", "Birleşik Krallık", "Felixstowe", 65),
            ("Southampton Limanı", "GBSOU", "Birleşik Krallık", "Southampton", 55),
            ("London Gateway", "GBLON", "Birleşik Krallık", "Londra", 55),
            ("Le Havre Limanı (HAROPA)", "FRLEH", "Fransa", "Le Havre", 60),
            ("Dunkirk Limanı", "FRDKK", "Fransa", "Dunkirk", 40),
            ("Gdansk Limanı (Baltic Hub)", "PLGDN", "Polonya", "Gdansk", 55),
            ("Gdynia Limanı", "PLGDY", "Polonya", "Gdynia", 40),
            ("Kopenhag Limanı", "DKCPH", "Danimarka", "Kopenhag", 40),
            ("Göteborg Limanı", "SEGOT", "İsveç", "Göteborg", 45),
            ("Oslo Limanı", "NOOSL", "Norveç", "Oslo", 35),
            ("Helsinki Limanı (Vuosaari)", "FIHEL", "Finlandiya", "Helsinki", 40),

            // 5. Kızıldeniz, Basra Körfezi & Orta Doğu
            ("Süveyş Limanı (Port Tewfik)", "EGSUZ", "Mısır", "Süveyş", 50),
            ("Cidde İslam Limanı (Jeddah)", "SAJED", "Suudi Arabistan", "Cidde", 75),
            ("Kral Abdullah Limanı (Rabigh)", "SAKAP", "Suudi Arabistan", "Rabigh", 60),
            ("Akabe Limanı (Aqaba)", "JOAQJ", "Ürdün", "Akabe", 40),
            ("Cibuti Limanı (Doraleh)", "DJJIB", "Cibuti", "Cibuti", 45),
            ("Salalah Limanı", "OMSLL", "Umman", "Salalah", 65),
            ("Sohar Limanı", "OMSOH", "Umman", "Sohar", 45),
            ("Jebel Ali Limanı (DP World Dubai)", "AEJEA", "BAE", "Dubai", 90),
            ("Khalifa Limanı (Abu Dhabi)", "AEKHL", "BAE", "Abu Dabi", 60),
            ("Fujairah Tanker Limanı", "AEFJR", "BAE", "Fujairah", 55),
            ("Hamad Limanı (Doha)", "QAHMD", "Katar", "Doha", 55),
            ("Khalifa Bin Salman Limanı", "BHKBS", "Bahreyn", "Manama", 40),
            ("Dammam Kral Abdülaziz Limanı", "SADMM", "Suudi Arabistan", "Dammam", 65),
            ("Shuwaikh Limanı", "KWSHU", "Kuveyt", "Kuveyt", 45),
            ("Shahid Rajaee Limanı (Bandar Abbas)", "IRBND", "İran", "Bender Abbas", 50),

            // 6. Hint Okyanusu, Güney & Güneydoğu Asya
            ("Singapur Limanı (PSA Singapore)", "SGSIN", "Singapur", "Singapur", 95),
            ("Port Klang (Westports)", "MYPKG", "Malezya", "Kuala Lumpur", 75),
            ("Tanjung Pelepas Limanı (PTP)", "MYTPP", "Malezya", "Johor", 70),
            ("Kolombo Limanı (Port of Colombo)", "LKCMB", "Sri Lanka", "Kolombo", 65),
            ("Nhava Sheva Limanı (JNPT Mumbai)", "INNSA", "Hindistan", "Navi Mumbai", 65),
            ("Mundra Limanı (Adani)", "INMUN", "Hindistan", "Gujarat", 60),
            ("Chennai Limanı", "INMAA", "Hindistan", "Chennai", 50),
            ("Karaçi Limanı (Karachi)", "PKKHI", "Pakistan", "Karaçi", 50),
            ("Port Qasim", "PKBQM", "Pakistan", "Karaçi", 45),
            ("Chittagong Limanı", "BDCGP", "Bangladeş", "Chittagong", 50),
            ("Laem Chabang Limanı", "THLCH", "Tayland", "Chonburi", 65),
            ("Saygon Limanı (Cat Lai)", "VNSGN", "Vietnam", "Ho Chi Minh", 60),
            ("Cai Mep Uluslararası Terminali", "VNVUT", "Vietnam", "Vung Tau", 55),
            ("Tanjung Priok Limanı", "IDTPP", "Endonezya", "Cakarta", 65),
            ("Manila Limanı", "PHMNL", "Filipinler", "Manila", 55),

            // 7. Doğu Asya & Çin Denizi
            ("Şanghay Yangshan Limanı", "CNSHA", "Çin", "Şanghay", 95),
            ("Ningbo-Zhoushan Limanı", "CNNGB", "Çin", "Ningbo", 90),
            ("Shenzhen Yantian Limanı", "CNSZX", "Çin", "Shenzhen", 85),
            ("Qingdao Limanı", "CNQDG", "Çin", "Qingdao", 80),
            ("Hong Kong Limanı (Kwai Tsing)", "CNHKG", "Hong Kong", "Hong Kong", 80),
            ("Busan New Port", "KRPUS", "Güney Kore", "Busan", 85),
            ("Incheon Limanı", "KRICN", "Güney Kore", "Incheon", 55),
            ("Tokyo Limanı (Ohi Terminal)", "JPTYO", "Japonya", "Tokyo", 65),
            ("Yokohama Limanı", "JPYOK", "Japonya", "Yokohama", 60),
            ("Kaohsiung Limanı", "TWKHH", "Tayvan", "Kaohsiung", 70),

            // 8. Akdeniz & Avrupa Ek Limanlar
            ("Lizbon Limanı", "PTLIS", "Portekiz", "Lizbon", 70),
            ("Sines Limanı", "PTSIE", "Portekiz", "Sines", 65),
            ("Bilbao Limanı", "ESBIO", "İspanya", "Bilbao", 60),
            ("Kandiye Limanı (Girit)", "GRHER", "Yunanistan", "Heraklion", 55),
            ("Rijeka Limanı", "HRRJK", "Hırvatistan", "Rijeka", 50),
            ("Koper Limanı", "SIKOP", "Slovenya", "Koper", 60),
            ("Catania Limanı", "ITCTA", "İtalya", "Katanya", 50),
            ("Palermo Limanı", "ITPMO", "İtalya", "Palermo", 55),
            ("Varna Limanı", "BGVAR", "Bulgaristan", "Varna", 50),
            ("Burgaz Limanı", "BGBOJ", "Bulgaristan", "Burgaz", 50)
        };
    }
}
