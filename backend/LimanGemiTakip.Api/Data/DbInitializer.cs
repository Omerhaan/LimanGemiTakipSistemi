using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace LimanGemiTakip.Api.Data;

public static class DbInitializer
{
    public static void Initialize(ApplicationDbContext context, bool isDevelopment = true, IConfiguration? configuration = null)
    {
        context.Database.EnsureCreated();

        if (context.Database.IsSqlServer())
        {
            context.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
                BEGIN
                    CREATE TABLE [Users] (
                        [Id] int NOT NULL IDENTITY,
                        [Username] nvarchar(50) NOT NULL,
                        [Email] nvarchar(100) NOT NULL,
                        [PasswordHash] nvarchar(255) NOT NULL,
                        [Role] nvarchar(20) NOT NULL,
                        [FullName] nvarchar(100) NOT NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
                        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
                    );
                    CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);
                END;

                IF COL_LENGTH('CrewMembers', 'FirstName') IS NULL
                BEGIN
                    ALTER TABLE [CrewMembers] ADD [FirstName] nvarchar(50) NOT NULL DEFAULT '';
                    ALTER TABLE [CrewMembers] ADD [LastName] nvarchar(50) NOT NULL DEFAULT '';
                END;

                IF COL_LENGTH('CrewMembers', 'FullName') IS NOT NULL
                BEGIN
                    ALTER TABLE [CrewMembers] ALTER COLUMN [FullName] nvarchar(100) NULL;
                END;

                -- BaseEntity ve Audit kolonlarının varlığını sağlama
                DECLARE @tName nvarchar(50);
                DECLARE table_cursor CURSOR FOR
                SELECT name FROM (VALUES ('Ships'), ('Ports'), ('ShipVisits'), ('Cargoes'), ('CrewMembers'), ('ShipCrewAssignments')) AS T(name);

                OPEN table_cursor;
                FETCH NEXT FROM table_cursor INTO @tName;
                WHILE @@FETCH_STATUS = 0
                BEGIN
                    EXEC('
                        IF COL_LENGTH(''' + @tName + ''', ''CreatedAt'') IS NULL
                            ALTER TABLE [' + @tName + '] ADD [CreatedAt] datetime2 NOT NULL DEFAULT(GETUTCDATE());
                        IF COL_LENGTH(''' + @tName + ''', ''CreatedBy'') IS NULL
                            ALTER TABLE [' + @tName + '] ADD [CreatedBy] nvarchar(100) NOT NULL DEFAULT(''System'');
                        IF COL_LENGTH(''' + @tName + ''', ''UpdatedAt'') IS NULL
                            ALTER TABLE [' + @tName + '] ADD [UpdatedAt] datetime2 NULL;
                        IF COL_LENGTH(''' + @tName + ''', ''UpdatedBy'') IS NULL
                            ALTER TABLE [' + @tName + '] ADD [UpdatedBy] nvarchar(100) NULL;
                        IF COL_LENGTH(''' + @tName + ''', ''IsDeleted'') IS NULL
                            ALTER TABLE [' + @tName + '] ADD [IsDeleted] bit NOT NULL DEFAULT(0);
                    ');
                    FETCH NEXT FROM table_cursor INTO @tName;
                END;
                CLOSE table_cursor;
                DEALLOCATE table_cursor;

                -- ShipVisits için RowVersion (Optimistic Concurrency)
                IF COL_LENGTH('ShipVisits', 'RowVersion') IS NULL
                BEGIN
                    ALTER TABLE [ShipVisits] ADD [RowVersion] rowversion NOT NULL;
                END;

                -- ShipVisits için OriginPortId (Kalkış Limanı - Çift Limanlı Sefer Modeli)
                IF COL_LENGTH('ShipVisits', 'OriginPortId') IS NULL
                BEGIN
                    ALTER TABLE [ShipVisits] ADD [OriginPortId] int NULL;
                END;

                -- Cargoes için Konşimento ve IMDG / Sevkiyat alanları
                IF COL_LENGTH('Cargoes', 'BillOfLadingNumber') IS NULL
                BEGIN
                    ALTER TABLE [Cargoes] ADD [BillOfLadingNumber] nvarchar(50) NULL;
                END;
                IF COL_LENGTH('Cargoes', 'ImdgClass') IS NULL
                BEGIN
                    ALTER TABLE [Cargoes] ADD [ImdgClass] nvarchar(30) NULL;
                END;
                IF COL_LENGTH('Cargoes', 'Shipper') IS NULL
                BEGIN
                    ALTER TABLE [Cargoes] ADD [Shipper] nvarchar(100) NULL;
                END;
                IF COL_LENGTH('Cargoes', 'Consignee') IS NULL
                BEGIN
                    ALTER TABLE [Cargoes] ADD [Consignee] nvarchar(100) NULL;
                END;
                IF COL_LENGTH('Cargoes', 'SealNumber') IS NULL
                BEGIN
                    ALTER TABLE [Cargoes] ADD [SealNumber] nvarchar(50) NULL;
                END;

                -- Users için PortId, RefreshToken, RefreshTokenExpiryTime
                IF COL_LENGTH('Users', 'PortId') IS NULL
                BEGIN
                    ALTER TABLE [Users] ADD [PortId] int NULL;
                END;
                IF COL_LENGTH('Users', 'RefreshToken') IS NULL
                BEGIN
                    ALTER TABLE [Users] ADD [RefreshToken] nvarchar(255) NULL;
                END;
                IF COL_LENGTH('Users', 'RefreshTokenExpiryTime') IS NULL
                BEGIN
                    ALTER TABLE [Users] ADD [RefreshTokenExpiryTime] datetime2 NULL;
                END;

                -- AuditLogs tablosu (OWASP Denetim Günlüğü)
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
                BEGIN
                    CREATE TABLE [AuditLogs] (
                        [Id] int NOT NULL IDENTITY,
                        [Timestamp] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
                        [UserId] nvarchar(50) NULL,
                        [Username] nvarchar(100) NULL,
                        [UserRole] nvarchar(50) NULL,
                        [Action] nvarchar(100) NOT NULL,
                        [EntityName] nvarchar(100) NOT NULL,
                        [EntityId] nvarchar(100) NULL,
                        [IpAddress] nvarchar(50) NULL,
                        [UserAgent] nvarchar(255) NULL,
                        [Details] nvarchar(2000) NOT NULL DEFAULT (''),
                        [IsSuccess] bit NOT NULL DEFAULT (1),
                        [Severity] nvarchar(20) NOT NULL DEFAULT ('INFO'),
                        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
                    );
                    CREATE INDEX [IX_AuditLogs_Timestamp] ON [AuditLogs] ([Timestamp]);
                    CREATE INDEX [IX_AuditLogs_Action] ON [AuditLogs] ([Action]);
                END;
            ");
        }

        if (!context.Users.Any())
        {
            if (isDevelopment)
            {
                // Development ortamında hızlı test ve değerlendirme için varsayılan demo hesaplar
                var users = new[]
                {
                    new User
                    {
                        Username = "admin",
                        Email = "admin@limangemi.com",
                        PasswordHash = PasswordHasher.HashPassword("Admin123!"),
                        Role = "Admin",
                        FullName = "Sistem Yöneticisi"
                    },
                    new User
                    {
                        Username = "operator",
                        Email = "operator@limangemi.com",
                        PasswordHash = PasswordHasher.HashPassword("Operator123!"),
                        Role = "Operator",
                        FullName = "Liman Operatörü"
                    },
                    new User
                    {
                        Username = "portmanager",
                        Email = "portmanager@limangemi.com",
                        PasswordHash = PasswordHasher.HashPassword("PortManager123!"),
                        Role = "PortManager",
                        FullName = "Liman Müdürü (Ambarlı)",
                        PortId = 1
                    },
                    new User
                    {
                        Username = "viewer",
                        Email = "viewer@limangemi.com",
                        PasswordHash = PasswordHasher.HashPassword("Viewer123!"),
                        Role = "Viewer",
                        FullName = "Misafir Gözlemci"
                    }
                };
                context.Users.AddRange(users);
                context.SaveChanges();
            }
            else
            {
                // Canlı / Prodüksiyon ortamında varsayılan şifreli demo hesaplar ASLA otomatik oluşturulmaz.
                // Güvenli ilk kurulum için yapılandırma veya ortam değişkenlerinden yönetici hesabı alınır.
                var initialAdminUser = configuration?["AdminSetup:Username"] ?? Environment.GetEnvironmentVariable("INITIAL_ADMIN_USERNAME");
                var initialAdminPass = configuration?["AdminSetup:Password"] ?? Environment.GetEnvironmentVariable("INITIAL_ADMIN_PASSWORD");
                var initialAdminEmail = configuration?["AdminSetup:Email"] ?? Environment.GetEnvironmentVariable("INITIAL_ADMIN_EMAIL") ?? "admin@liman.gov.tr";

                if (!string.IsNullOrWhiteSpace(initialAdminUser) && !string.IsNullOrWhiteSpace(initialAdminPass))
                {
                    context.Users.Add(new User
                    {
                        Username = initialAdminUser.Trim(),
                        Email = initialAdminEmail.Trim(),
                        PasswordHash = PasswordHasher.HashPassword(initialAdminPass),
                        Role = "Admin",
                        FullName = "Sistem Yöneticisi (Güvenli Kurulum)"
                    });
                    context.SaveChanges();
                }
            }
        }

        // PortManager demo hesabı yalnızca Development ortamında garanti edilir
        if (isDevelopment && !context.Users.Any(u => u.Username == "portmanager"))
        {
            context.Users.Add(new User
            {
                Username = "portmanager",
                Email = "portmanager@limangemi.com",
                PasswordHash = PasswordHasher.HashPassword("PortManager123!"),
                Role = "PortManager",
                FullName = "Liman Müdürü (Ambarlı)",
                PortId = 1
            });
            context.SaveChanges();
        }

        if (context.Ships.Any())
        {
            FixTurkishCharacters(context);
            SeedTwentyShipsAndVisits(context);
            EnsureAllShipsHaveCrewAssignments(context);
            return; // DB already seeded
        }

        var ships = new[]
        {
            new Ship
            {
                Name = "TCG Barbaros Express",
                ImoNumber = "9176187",
                Flag = "Türkiye",
                Type = "Konteyner",
                BuiltYear = 2018,
                DeadweightTonnage = 45000m
            },
            new Ship
            {
                Name = "Aegean Voyager",
                ImoNumber = "9241061",
                Flag = "Yunanistan",
                Type = "Kuru Yük",
                BuiltYear = 2015,
                DeadweightTonnage = 32000m
            },
            new Ship
            {
                Name = "Blue Horizon Tanker",
                ImoNumber = "9074729",
                Flag = "Malta",
                Type = "Tanker",
                BuiltYear = 2020,
                DeadweightTonnage = 65000m
            },
            new Ship
            {
                Name = "Marmara Pearl",
                ImoNumber = "9318852",
                Flag = "Türkiye",
                Type = "Ro-Ro",
                BuiltYear = 2019,
                DeadweightTonnage = 18500m
            }
        };
        context.Ships.AddRange(ships);
        context.SaveChanges();

        var ports = new[]
        {
            new Port
            {
                Name = "İstanbul Ambarlı Limanı",
                Code = "TRIST",
                Country = "Türkiye",
                City = "İstanbul",
                Capacity = 250
            },
            new Port
            {
                Name = "Mersin Uluslararası Limanı (MIP)",
                Code = "TRMER",
                Country = "Türkiye",
                City = "Mersin",
                Capacity = 320
            },
            new Port
            {
                Name = "İzmir Alsancak Limanı",
                Code = "TRIZM",
                Country = "Türkiye",
                City = "İzmir",
                Capacity = 180
            },
            new Port
            {
                Name = "Piraeus Port",
                Code = "GRPIR",
                Country = "Yunanistan",
                City = "Atina",
                Capacity = 400
            }
        };
        context.Ports.AddRange(ports);
        context.SaveChanges();

        var crew = new[]
        {
            new CrewMember
            {
                FirstName = "Ahmet",
                LastName = "Yılmaz",
                Role = "Kaptan (Master)",
                Email = "ahmet.yilmaz@liman.gov.tr",
                Phone = "+90 532 111 2233",
                Nationality = "T.C."
            },
            new CrewMember
            {
                FirstName = "Mehmet",
                LastName = "Demir",
                Role = "Çarkçıbaşı (Chief Engineer)",
                Email = "mehmet.demir@deniz.com",
                Phone = "+90 533 222 3344",
                Nationality = "T.C."
            },
            new CrewMember
            {
                FirstName = "Elena",
                LastName = "Rostova",
                Role = "1. Zabit (Chief Officer)",
                Email = "elena.rostova@oceancrew.org",
                Phone = "+30 694 555 6677",
                Nationality = "Yunanistan"
            },
            new CrewMember
            {
                FirstName = "Ali",
                LastName = "Kaya",
                Role = "Usta Gemici (Able Seaman)",
                Email = "ali.kaya@denizcilik.net",
                Phone = "+90 542 333 4455",
                Nationality = "T.C."
            }
        };
        context.CrewMembers.AddRange(crew);
        context.SaveChanges();

        var visits = new[]
        {
            new ShipVisit
            {
                ShipId = ships[0].Id,
                PortId = ports[0].Id,
                OriginPortId = ports[2].Id,
                ArrivalDate = DateTime.Now.AddDays(-1),
                DepartureDate = DateTime.Now.AddDays(2),
                Status = "Docked",
                DockNumber = "Rıhtım 3",
                Purpose = "Konteyner Tahliye"
            },
            new ShipVisit
            {
                ShipId = ships[1].Id,
                PortId = ports[1].Id,
                OriginPortId = ports[0].Id,
                ArrivalDate = DateTime.Now.AddDays(1),
                DepartureDate = DateTime.Now.AddDays(4),
                Status = "Scheduled",
                DockNumber = "Rıhtım 1A",
                Purpose = "Dökme Yük Yükleme"
            }
        };
        context.ShipVisits.AddRange(visits);

        var cargoes = new[]
        {
            new Cargo
            {
                ShipId = ships[0].Id,
                Description = "Elektronik Cihazlar & Otomotiv Parçaları",
                WeightTons = 12500m,
                Type = "Container",
                ContainerCount = 820
            },
            new Cargo
            {
                ShipId = ships[1].Id,
                Description = "Buğday & Tahıl Ürünleri",
                WeightTons = 28000m,
                Type = "Bulk"
            }
        };
        context.Cargoes.AddRange(cargoes);

        var assignments = new[]
        {
            new ShipCrewAssignment
            {
                ShipId = ships[0].Id,
                CrewMemberId = crew[0].Id,
                StartDate = DateTime.Today.AddDays(-30),
                EndDate = DateTime.Today.AddDays(90),
                RoleOnShip = "Kaptan"
            },
            new ShipCrewAssignment
            {
                ShipId = ships[0].Id,
                CrewMemberId = crew[1].Id,
                StartDate = DateTime.Today.AddDays(-30),
                EndDate = DateTime.Today.AddDays(60),
                RoleOnShip = "Çarkçıbaşı"
            }
        };
        context.ShipCrewAssignments.AddRange(assignments);

        context.SaveChanges();
        EnsureAllShipsHaveCrewAssignments(context);
    }

    private static void FixTurkishCharacters(ApplicationDbContext context)
    {
        var shipsToFix = new Dictionary<string, (string Name, string Type, string Flag)>
        {
            ["9381201"] = ("Anadolu Kargo", "Kuru Yük", "Türkiye"),
            ["9412359"] = ("Oruç Reis Tanker", "Tanker", "Türkiye"),
            ["9534121"] = ("Bosphorus Star", "Konteyner", "Panama"),
            ["9287417"] = ("Ege Güneşi", "Ro-Ro", "Türkiye"),
            ["9621455"] = ("Qatar LNG Pioneer", "LNG / LPG Gaz Tankeri", "Katar"),
            ["9145621"] = ("Karadeniz Fırtınası", "Genel Kargo", "Türkiye"),
            ["9741255"] = ("Mediterranean Queen", "Yolcu Gemisi", "İtalya"),
            ["9082348"] = ("Kurtarma-8", "Römorkör", "Türkiye"),
            ["9812456"] = ("Polar Explorer", "Buzkıran & Destek", "Norveç"),
            ["9365219"] = ("Ziya Kalkavan", "Konteyner", "Türkiye"),
            ["9456123"] = ("Kaptan İbrahim", "Kuru Yük", "Liberya"),
            ["9176187"] = ("TCG Barbaros Express", "Konteyner", "Türkiye"),
            ["9354220"] = ("Aegean Voyager", "Kuru Yük", "Yunanistan"),
            ["9488316"] = ("Blue Horizon Tanker", "Tanker", "Malta"),
            ["9215840"] = ("Marmara Pearl", "Ro-Ro", "Türkiye")
        };

        foreach (var s in context.Ships.ToList())
        {
            if (shipsToFix.TryGetValue(s.ImoNumber, out var fix))
            {
                s.Name = fix.Name;
                s.Type = fix.Type;
                s.Flag = fix.Flag;
            }
        }

        var crewToFix = new Dictionary<string, (string First, string Last, string Role, string Nat)>
        {
            ["ali.vural@limangemi.com"] = ("Ali", "Vural", "Kaptan (Master)", "T.C."),
            ["burak.celik@limangemi.com"] = ("Burak", "Çelik", "2. Kaptan (Chief Mate)", "T.C."),
            ["serkan.ozturk@limangemi.com"] = ("Serkan", "Öztürk", "Çarkçıbaşı (Chief Engineer)", "T.C."),
            ["caner.aydin@limangemi.com"] = ("Caner", "Aydın", "2. Mühendis (Second Engineer)", "T.C."),
            ["murat.koc@limangemi.com"] = ("Murat", "Koç", "Güverte Zabiti (Deck Officer)", "T.C."),
            ["deniz.arslan@limangemi.com"] = ("Deniz", "Arslan", "Makine Zabiti (Engine Officer)", "T.C."),
            ["selim.sahin@limangemi.com"] = ("Selim", "Şahin", "Telsiz Zabiti (Radio Officer)", "T.C."),
            ["emre.yildiz@limangemi.com"] = ("Emre", "Yıldız", "Güverte Lostromosu (Boatswain)", "T.C."),
            ["okan.bulut@limangemi.com"] = ("Okan", "Bulut", "Usta Gemici (Able Seaman)", "T.C."),
            ["kerem.kurt@limangemi.com"] = ("Kerem", "Kurt", "Yağcı (Oiler)", "T.C."),
            ["harun.dogan@limangemi.com"] = ("Harun", "Doğan", "Aşçı (Cook)", "T.C."),
            ["tarik.gunes@limangemi.com"] = ("Tarık", "Güneş", "Gemici (Ordinary Seaman)", "T.C."),
            ["ahmet.yilmaz@liman.gov.tr"] = ("Ahmet", "Yılmaz", "Kaptan (Master)", "T.C."),
            ["mehmet.demir@deniz.com"] = ("Mehmet", "Demir", "Çarkçıbaşı (Chief Engineer)", "T.C."),
            ["elena.rostova@oceancrew.org"] = ("Elena", "Rostova", "1. Zabit (Chief Officer)", "Yunanistan"),
            ["ali.kaya@denizcilik.net"] = ("Ali", "Kaya", "Usta Gemici (Able Seaman)", "T.C.")
        };

        foreach (var c in context.CrewMembers.ToList())
        {
            if (crewToFix.TryGetValue(c.Email, out var fix))
            {
                c.FirstName = fix.First;
                c.LastName = fix.Last;
                c.FullName = $"{fix.First} {fix.Last}";
                c.Role = fix.Role;
                c.Nationality = fix.Nat;
            }
        }

        var portsToFix = new Dictionary<string, (string Name, string Country, string City)>
        {
            ["TRIST"] = ("İstanbul Ambarlı Limanı", "Türkiye", "İstanbul"),
            ["TRMER"] = ("Mersin Uluslararası Limanı (MIP)", "Türkiye", "Mersin"),
            ["TRIZM"] = ("İzmir Alsancak Limanı", "Türkiye", "İzmir"),
            ["GRPIR"] = ("Piraeus Port", "Yunanistan", "Atina"),
            ["TRASY"] = ("Tekirdağ Asyaport", "Türkiye", "Tekirdağ"),
            ["TRKOC"] = ("Kocaeli DP World Yarımca", "Türkiye", "Kocaeli"),
            ["ROKOS"] = ("Köstence Limanı", "Romanya", "Köstence"),
            ["BGVAR"] = ("Varna Limanı", "Bulgaristan", "Varna"),
            ["GEBAT"] = ("Batum Limanı", "Gürcistan", "Batum"),
            ["TRTZX"] = ("Trabzon Limanı", "Türkiye", "Trabzon"),
            ["EGALY"] = ("İskenderiye Limanı", "Mısır", "İskenderiye"),
            ["CYLMS"] = ("Limassol Limanı", "Kıbrıs", "Limasol"),
            ["LBBEY"] = ("Beyrut Limanı", "Lübnan", "Beyrut"),
            ["MTMLA"] = ("Valetta Limanı", "Malta", "Valetta"),
            ["ITGOA"] = ("Cenova Limanı", "İtalya", "Cenova")
        };

        foreach (var p in context.Ports.ToList())
        {
            if (portsToFix.TryGetValue(p.Code, out var fix))
            {
                p.Name = fix.Name;
                p.Country = fix.Country;
                p.City = fix.City;
            }
        }

        var additionalPorts = new[]
        {
            new Port { Name = "Rotterdam Limanı", Code = "NLRTM", Country = "Hollanda", City = "Rotterdam", Capacity = 500 },
            new Port { Name = "Hamburg Limanı", Code = "DEHAM", Country = "Almanya", City = "Hamburg", Capacity = 350 },
            new Port { Name = "Gdansk Limanı", Code = "PLGDN", Country = "Polonya", City = "Gdansk", Capacity = 250 },
            new Port { Name = "Marsilya Limanı", Code = "FRMRS", Country = "Fransa", City = "Marsilya", Capacity = 280 },
            new Port { Name = "Tanca Med Limanı", Code = "MAPTM", Country = "Fas", City = "Tanca", Capacity = 320 },
            new Port { Name = "Samsun Port", Code = "TRSSX", Country = "Türkiye", City = "Samsun", Capacity = 40 },
            new Port { Name = "Filyos Limanı", Code = "TRFLY", Country = "Türkiye", City = "Zonguldak", Capacity = 35 },
            new Port { Name = "Sinop Limanı", Code = "TRSIN", Country = "Türkiye", City = "Sinop", Capacity = 20 },
            new Port { Name = "Rize Limanı", Code = "TRRIZ", Country = "Türkiye", City = "Rize", Capacity = 25 },
            new Port { Name = "Hopa Limanı", Code = "TRHOP", Country = "Türkiye", City = "Artvin", Capacity = 25 },
            new Port { Name = "Burgaz Limanı", Code = "BGBOJ", Country = "Bulgaristan", City = "Burgaz", Capacity = 35 },
            new Port { Name = "Odesa Limanı", Code = "UAODS", Country = "Ukrayna", City = "Odesa", Capacity = 45 },
            new Port { Name = "Sivastopol Limanı", Code = "UASVP", Country = "Ukrayna / Kırım", City = "Sivastopol", Capacity = 35 },
            new Port { Name = "Novorossiysk Limanı", Code = "RUNVS", Country = "Rusya", City = "Novorossiysk", Capacity = 55 },
            new Port { Name = "Poti Limanı", Code = "GEPTI", Country = "Gürcistan", City = "Poti", Capacity = 35 },
            new Port { Name = "Haydarpaşa Limanı", Code = "TRHAY", Country = "Türkiye", City = "İstanbul", Capacity = 35 },
            new Port { Name = "Gemlik Borusan Limanı", Code = "TRGEM", Country = "Türkiye", City = "Bursa", Capacity = 35 },
            new Port { Name = "Bandırma Limanı", Code = "TRBND", Country = "Türkiye", City = "Balıkesir", Capacity = 30 },
            new Port { Name = "Çanakkale Kepez Limanı", Code = "TRCKZ", Country = "Türkiye", City = "Çanakkale", Capacity = 25 },
            new Port { Name = "Nemrut / Aliağa Limanı", Code = "TRNMP", Country = "Türkiye", City = "İzmir", Capacity = 45 },
            new Port { Name = "Bodrum Kruvaziyer Limanı", Code = "TRBDM", Country = "Türkiye", City = "Muğla", Capacity = 20 },
            new Port { Name = "Antalya Port Akdeniz", Code = "TRANT", Country = "Türkiye", City = "Antalya", Capacity = 30 },
            new Port { Name = "İskenderun Limanı", Code = "TRISK", Country = "Türkiye", City = "Hatay", Capacity = 40 },
            new Port { Name = "Selanik Limanı", Code = "GRSKG", Country = "Yunanistan", City = "Selanik", Capacity = 40 },
            new Port { Name = "Kandiye Limanı (Girit)", Code = "GRHER", Country = "Yunanistan", City = "Kandiye", Capacity = 30 },
            new Port { Name = "Port Said Limanı", Code = "EGPSD", Country = "Mısır", City = "Port Said", Capacity = 60 },
            new Port { Name = "Hayfa Limanı", Code = "ILHFA", Country = "İsrail", City = "Hayfa", Capacity = 45 },
            new Port { Name = "Trieste Limanı", Code = "ITTRS", Country = "İtalya", City = "Trieste", Capacity = 50 },
            new Port { Name = "Barselona Limanı", Code = "ESBCN", Country = "İspanya", City = "Barselona", Capacity = 65 },
            new Port { Name = "Algeciras Limanı", Code = "ESALG", Country = "İspanya", City = "Algeciras", Capacity = 70 }
        };

        foreach (var ap in additionalPorts)
        {
            if (!context.Ports.Any(existing => existing.Code == ap.Code))
            {
                context.Ports.Add(ap);
            }
        }

        foreach (var v in context.ShipVisits.ToList())
        {
            if (v.DockNumber != null)
            {
                v.DockNumber = v.DockNumber.Replace("RÄ±htÄ±m", "Rıhtım").Replace("Gaz RÄ±htÄ±mÄ±", "Gaz Rıhtımı").Replace("TahÄ±l RÄ±htÄ±mÄ±", "Tahıl Rıhtımı");
            }
            if (v.Purpose != null)
            {
                v.Purpose = v.Purpose
                    .Replace("Konteyner Tahliye ve YÃ¼kleme", "Konteyner Tahliye ve Yükleme")
                    .Replace("Ham Petrol BoÅŸaltÄ±mÄ±", "Ham Petrol Boşaltımı")
                    .Replace("TIR ve AraÃ§ YÃ¼kleme", "TIR ve Araç Yükleme")
                    .Replace("SÄ±vÄ±laÅŸtÄ±rÄ±lmÄ±ÅŸ DoÄŸalgaz Tahliyesi", "Sıvılaştırılmış Doğalgaz Tahliyesi")
                    .Replace("Genel Kargo ElleÃ§leme", "Genel Kargo Elleçleme")
                    .Replace("Kruvaziyer Yolcu Ä°ndirme-Bindirme", "Kruvaziyer Yolcu İndirme-Bindirme")
                    .Replace("Transit Konteyner AktarÄ±mÄ±", "Transit Konteyner Aktarımı")
                    .Replace("Kuru TahÄ±l BoÅŸaltÄ±mÄ±", "Kuru Tahıl Boşaltımı");
            }
        }

        foreach (var cg in context.Cargoes.ToList())
        {
            if (cg.Description != null)
            {
                cg.Description = cg.Description
                    .Replace("Beyaz EÅŸya ve TÃ¼ketici ElektroniÄŸi", "Beyaz Eşya ve Tüketici Elektroniği")
                    .Replace("AÄŸÄ±r Ham Petrol (Brent)", "Ağır Ham Petrol (Brent)")
                    .Replace("LNG SÄ±vÄ±laÅŸtÄ±rÄ±lmÄ±ÅŸ DoÄŸalgaz", "LNG Sıvılaştırılmış Doğalgaz")
                    .Replace("DÃ¶kme MÄ±sÄ±r ve AyÃ§iÃ§eÄŸi Tohumu", "Dökme Mısır ve Ayçiçeği Tohumu");
            }
        }

        context.SaveChanges();
    }

    private static void SeedTwentyShipsAndVisits(ApplicationDbContext context)
    {
        var portDict = context.Ports.ToDictionary(p => p.Code, p => p.Id);
        if (portDict.Count == 0) return;

        int GetPort(string code, string fallbackCode = "TRIST")
        {
            if (portDict.TryGetValue(code, out var id)) return id;
            if (portDict.TryGetValue(fallbackCode, out var fallId)) return fallId;
            return portDict.Values.First();
        }

        var newShipsData = new[]
        {
            new { Name = "Arkas Smyrna", Imo = "9710323", Flag = "Türkiye", Type = "Konteyner", Year = 2021, Dwt = 44500m,
                  From = "TRIST", To = "TRMER", DepOffset = -14, ArrOffset = 18, Status = "Departed", Dock = "Rıhtım 5", Cargo = "Tekstil ve Sanayi Mamulleri", CargoType = "Container", Weight = 22000m, TEU = 1250 },
            new { Name = "Ege Trader", Imo = "9821433", Flag = "Türkiye", Type = "Genel Kargo", Year = 2018, Dwt = 16800m,
                  From = "TRIZM", To = "GRPIR", DepOffset = -10, ArrOffset = 12, Status = "Departed", Dock = "Genel Kargo 2", Cargo = "İnşaat Demiri ve Çelik Rulo", CargoType = "General", Weight = 14500m, TEU = 0 },
            new { Name = "Bosphorus Pride", Imo = "9435210", Flag = "Malta", Type = "Kuru Yük", Year = 2019, Dwt = 52000m,
                  From = "ROKOS", To = "TRTZX", DepOffset = 24, ArrOffset = 72, Status = "Scheduled", Dock = "Tahıl Rıhtımı 1", Cargo = "Dökme Kömür & Klinker", CargoType = "Bulk", Weight = 46000m, TEU = 0 },
            new { Name = "Toros Petrol", Imo = "9546320", Flag = "Türkiye", Type = "Tanker", Year = 2020, Dwt = 82000m,
                  From = "TRMER", To = "ITGOA", DepOffset = -20, ArrOffset = 28, Status = "Departed", Dock = "Sıvı Yük İskelesi", Cargo = "Rafine Dizel Yakıt", CargoType = "Liquid", Weight = 68000m, TEU = 0 },
            new { Name = "Akdeniz Rüzgarı", Imo = "9657430", Flag = "Türkiye", Type = "Ro-Ro", Year = 2019, Dwt = 22000m,
                  From = "GRPIR", To = "CYLMS", DepOffset = -16, ArrOffset = 14, Status = "Departed", Dock = "Ro-Ro Terminali 2", Cargo = "Otomobil & Hafif Ticari Araç", CargoType = "Vehicles", Weight = 9200m, TEU = 0 },
            new { Name = "Anadolu Bulk", Imo = "9768540", Flag = "Liberya", Type = "Kuru Yük", Year = 2017, Dwt = 63000m,
                  From = "BGVAR", To = "TRIST", DepOffset = 36, ArrOffset = 84, Status = "Scheduled", Dock = "Dökme Yük Rıhtımı", Cargo = "Demir Cevheri", CargoType = "Bulk", Weight = 55000m, TEU = 0 },
            new { Name = "Piri Reis Carrier", Imo = "9879650", Flag = "Panama", Type = "Konteyner", Year = 2022, Dwt = 78000m,
                  From = "TRKOC", To = "TRMER", DepOffset = -18, ArrOffset = 22, Status = "Departed", Dock = "Konteyner 3", Cargo = "Makine Ekipmanı ve Yedek Parça", CargoType = "Container", Weight = 38000m, TEU = 1600 },
            new { Name = "İskenderun Star", Imo = "9390769", Flag = "Türkiye", Type = "Genel Kargo", Year = 2016, Dwt = 19500m,
                  From = "TRMER", To = "LBBEY", DepOffset = -8, ArrOffset = 10, Status = "Departed", Dock = "Rıhtım 4A", Cargo = "Paketli Çimento ve Alçı", CargoType = "General", Weight = 16200m, TEU = 0 },
            new { Name = "Marmara Navigator", Imo = "9481879", Flag = "Türkiye", Type = "Tanker", Year = 2021, Dwt = 74000m,
                  From = "TRIST", To = "TRASY", DepOffset = 48, ArrOffset = 96, Status = "Scheduled", Dock = "Şamandıra Terminali", Cargo = "Hafif Ham Petrol", CargoType = "Liquid", Weight = 62000m, TEU = 0 },
            new { Name = "Levant Spirit", Imo = "9592989", Flag = "Yunanistan", Type = "Kuru Yük", Year = 2018, Dwt = 46000m,
                  From = "EGALY", To = "TRMER", DepOffset = -22, ArrOffset = 16, Status = "Departed", Dock = "Tahıl Silosu 2", Cargo = "Mısır & Soya Fasulyesi", CargoType = "Bulk", Weight = 41000m, TEU = 0 },
            new { Name = "Karya Seaways", Imo = "9603099", Flag = "Türkiye", Type = "Ro-Ro", Year = 2020, Dwt = 26500m,
                  From = "TRIZM", To = "MTMLA", DepOffset = 30, ArrOffset = 78, Status = "Scheduled", Dock = "Ro-Ro İskelesi 2", Cargo = "TIR Dorsesi ve Konteyner Şasisi", CargoType = "Vehicles", Weight = 11800m, TEU = 0 },
            new { Name = "Karadeniz Devrimi", Imo = "9714109", Flag = "Türkiye", Type = "Konteyner", Year = 2023, Dwt = 58000m,
                  From = "TRTZX", To = "ROKOS", DepOffset = -14, ArrOffset = 18, Status = "Departed", Dock = "Konteyner Rıhtımı", Cargo = "Soğutmalı Gıda Konteynerleri", CargoType = "Container", Weight = 29000m, TEU = 980 },
            new { Name = "Likya LNG", Imo = "9825219", Flag = "Katar", Type = "LNG / LPG Gaz Tankeri", Year = 2022, Dwt = 92000m,
                  From = "TRASY", To = "EGALY", DepOffset = -24, ArrOffset = 24, Status = "Departed", Dock = "LNG İskelesi", Cargo = "Sıvılaştırılmış Propan Gazı (LPG)", CargoType = "Liquid", Weight = 58000m, TEU = 0 },
            new { Name = "Trabzon Kargo", Imo = "9936329", Flag = "Türkiye", Type = "Genel Kargo", Year = 2017, Dwt = 14200m,
                  From = "GEBAT", To = "TRTZX", DepOffset = 18, ArrOffset = 42, Status = "Scheduled", Dock = "Genel Kargo 1", Cargo = "Kereste ve Orman Ürünleri", CargoType = "General", Weight = 12000m, TEU = 0 },
            new { Name = "Nemrut Titan", Imo = "9447433", Flag = "Marshall Adaları", Type = "Kuru Yük", Year = 2019, Dwt = 76000m,
                  From = "ITGOA", To = "MTMLA", DepOffset = -30, ArrOffset = 26, Status = "Departed", Dock = "Dökme Maden Rıhtımı", Cargo = "Boksit ve Alüminyum Cevheri", CargoType = "Bulk", Weight = 64000m, TEU = 0 },
            new { Name = "Boğaziçi Römorkör-3", Imo = "9558543", Flag = "Türkiye", Type = "Römorkör", Year = 2021, Dwt = 1500m,
                  From = "TRKOC", To = "TRKOC", DepOffset = -12, ArrOffset = 60, Status = "Docked", Dock = "Römorkör Bağlama", Cargo = "Liman Kurtarma ve Çekme Ekipmanı", CargoType = "General", Weight = 380m, TEU = 0 },
            new { Name = "Aegean Princess", Imo = "9669653", Flag = "İtalya", Type = "Yolcu Gemisi", Year = 2022, Dwt = 18000m,
                  From = "MTMLA", To = "GRPIR", DepOffset = -15, ArrOffset = 20, Status = "Departed", Dock = "Kruvaziyer Terminali A", Cargo = "Yolcu Kumanyası ve Bagaj", CargoType = "General", Weight = 1900m, TEU = 0 },
            new { Name = "Gelibolu Express", Imo = "9770763", Flag = "Türkiye", Type = "Konteyner", Year = 2020, Dwt = 49000m,
                  From = "TRIST", To = "ROKOS", DepOffset = 36, ArrOffset = 72, Status = "Scheduled", Dock = "Rıhtım 1B", Cargo = "Kimyasal Hammadde Konteynerleri", CargoType = "Container", Weight = 31000m, TEU = 1040 },
            new { Name = "Kıbrıs Barışı", Imo = "9881873", Flag = "Türkiye", Type = "Ro-Ro", Year = 2018, Dwt = 21000m,
                  From = "CYLMS", To = "TRMER", DepOffset = -10, ArrOffset = 12, Status = "Departed", Dock = "Ro-Ro Rıhtımı", Cargo = "Kamyon ve İş Makineleri", CargoType = "Vehicles", Weight = 13500m, TEU = 0 },
            new { Name = "Barbaros Destek", Imo = "9992983", Flag = "Türkiye", Type = "Buzkıran & Destek", Year = 2023, Dwt = 9200m,
                  From = "TRTZX", To = "TRTZX", DepOffset = -24, ArrOffset = 72, Status = "Docked", Dock = "Destek Filosu İskelesi", Cargo = "Açık Deniz İkmal & Destek Teçhizatı", CargoType = "General", Weight = 1200m, TEU = 0 }
        };

        var now = DateTime.Now;

        foreach (var data in newShipsData)
        {
            var existingShip = context.Ships.FirstOrDefault(s => s.ImoNumber == data.Imo);
            Ship ship;
            if (existingShip == null)
            {
                ship = new Ship
                {
                    Name = data.Name,
                    ImoNumber = data.Imo,
                    Flag = data.Flag,
                    Type = data.Type,
                    BuiltYear = data.Year,
                    DeadweightTonnage = data.Dwt
                };
                context.Ships.Add(ship);
                context.SaveChanges();
            }
            else
            {
                ship = existingShip;
            }

            if (!context.ShipVisits.Any(v => v.ShipId == ship.Id))
            {
                var destPortId = GetPort(data.Status == "Departed" ? data.To : data.From);
                var origPortId = GetPort(data.From);
                var visit = new ShipVisit
                {
                    ShipId = ship.Id,
                    PortId = destPortId,
                    OriginPortId = origPortId,
                    ArrivalDate = data.Status == "Departed" ? now.AddHours(data.ArrOffset) : now.AddHours(data.DepOffset),
                    DepartureDate = data.Status == "Departed" ? now.AddHours(data.ArrOffset + 48) : now.AddHours(data.ArrOffset),
                    Status = data.Status,
                    DockNumber = data.Dock.Length > 20 ? data.Dock.Substring(0, 20) : data.Dock,
                    Purpose = data.Status == "Departed" ? $"{data.Cargo} Boşaltımı ve İkmal" : $"{data.Cargo} Operasyonu"
                };
                context.ShipVisits.Add(visit);
            }

            if (!context.Cargoes.Any(c => c.ShipId == ship.Id))
            {
                var cargo = new Cargo
                {
                    ShipId = ship.Id,
                    Description = data.Cargo,
                    WeightTons = data.Weight,
                    Type = data.CargoType,
                    ContainerCount = data.TEU > 0 ? data.TEU : null
                };
                context.Cargoes.Add(cargo);
            }
        }

        // Seferlerde OriginPortId NULL olanları tespit edip mantıklı bir kayıtlı limana bağla
        var nullOriginVisits = context.ShipVisits.Where(v => v.OriginPortId == null).ToList();
        foreach (var v in nullOriginVisits)
        {
            v.OriginPortId = v.PortId == GetPort("TRIST") ? GetPort("TRMER") : GetPort("TRIST");
        }

        // Seferi olmayan herhangi bir gemi varsa (örn: Bosphorus Chemist, Aegean Princess vb.) sefer oluştur
        var shipsWithoutVisits = context.Ships.Where(s => !context.ShipVisits.Any(v => v.ShipId == s.Id)).ToList();
        foreach (var s in shipsWithoutVisits)
        {
            context.ShipVisits.Add(new ShipVisit
            {
                ShipId = s.Id,
                PortId = GetPort("TRIST"),
                OriginPortId = GetPort("TRKOC"),
                ArrivalDate = now.AddHours(16),
                DepartureDate = now.AddHours(64),
                Status = "Departed",
                DockNumber = "Rıhtım 2",
                Purpose = "Ticari Sefer ve Yük İkmali"
            });
        }
        context.SaveChanges();

        var newCrewData = new[]
        {
            new { First = "Cengiz", Last = "Kılıç", Role = "Kaptan (Master)", Email = "cengiz.kilic@denizcilik.net", Phone = "+90 532 601 1001", Nat = "T.C." },
            new { First = "Nikos", Last = "Papandreou", Role = "Çarkçıbaşı (Chief Engineer)", Email = "nikos.papandreou@hellenicmarine.gr", Phone = "+30 697 102 2002", Nat = "Yunanistan" },
            new { First = "Faruk", Last = "Özdemir", Role = "2. Kaptan (Chief Mate)", Email = "faruk.ozdemir@limangemi.com", Phone = "+90 533 703 3003", Nat = "T.C." },
            new { First = "Andrei", Last = "Ionescu", Role = "2. Mühendis (Second Engineer)", Email = "andrei.ionescu@blacksea-crew.ro", Phone = "+40 721 804 4004", Nat = "Romanya" },
            new { First = "Levent", Last = "Erdem", Role = "Güverte Zabiti (Deck Officer)", Email = "levent.erdem@denizcilik.net", Phone = "+90 535 905 5005", Nat = "T.C." },
            new { First = "Zafer", Last = "Şen", Role = "Makine Zabiti (Engine Officer)", Email = "zafer.sen@limangemi.com", Phone = "+90 536 106 6006", Nat = "T.C." },
            new { First = "Mikheil", Last = "Beridze", Role = "Telsiz Zabiti (Radio Officer)", Email = "mikheil.beridze@batumiport.ge", Phone = "+995 599 207 7007", Nat = "Gürcistan" },
            new { First = "Engin", Last = "Çetin", Role = "Elektrik Zabiti (Electro-Technical Officer)", Email = "engin.cetin@limangemi.com", Phone = "+90 537 308 8008", Nat = "T.C." },
            new { First = "Sinan", Last = "Aslan", Role = "Güverte Lostromosu (Boatswain)", Email = "sinan.aslan@denizcilik.net", Phone = "+90 538 409 9009", Nat = "T.C." },
            new { First = "Mustafa", Last = "Taşkın", Role = "Makine Lostromosu (Fitter)", Email = "mustafa.taskin@limangemi.com", Phone = "+90 539 510 0110", Nat = "T.C." },
            new { First = "Hakan", Last = "Yurt", Role = "Usta Gemici (Able Seaman)", Email = "hakan.yurt@denizcilik.net", Phone = "+90 541 611 1221", Nat = "T.C." },
            new { First = "Serdar", Last = "Aktaş", Role = "Usta Gemici (Able Seaman)", Email = "serdar.aktas@limangemi.com", Phone = "+90 542 712 2332", Nat = "T.C." },
            new { First = "Barış", Last = "Şimşek", Role = "Gemici (Ordinary Seaman)", Email = "baris.simsek@denizcilik.net", Phone = "+90 543 813 3443", Nat = "T.C." },
            new { First = "Volkan", Last = "Coşkun", Role = "Yağcı (Oiler)", Email = "volkan.coskun@limangemi.com", Phone = "+90 544 914 4554", Nat = "T.C." },
            new { First = "Osman", Last = "Varol", Role = "Aşçı (Cook)", Email = "osman.varol@denizcilik.net", Phone = "+90 545 015 5665", Nat = "T.C." },
            new { First = "Recep", Last = "Polat", Role = "Kamarot (Steward)", Email = "recep.polat@limangemi.com", Phone = "+90 546 116 6776", Nat = "T.C." },
            new { First = "Turgut", Last = "Özer", Role = "Kaptan (Master)", Email = "turgut.ozer@limangemi.com", Phone = "+90 532 217 7887", Nat = "T.C." },
            new { First = "Dimitrius", Last = "Katsaros", Role = "Çarkçıbaşı (Chief Engineer)", Email = "dimitrius.katsaros@aegeanfleet.gr", Phone = "+30 698 318 8998", Nat = "Yunanistan" },
            new { First = "Kenan", Last = "Çakır", Role = "2. Kaptan (Chief Mate)", Email = "kenan.cakir@denizcilik.net", Phone = "+90 533 419 9009", Nat = "T.C." },
            new { First = "Gabriel", Last = "Dumitru", Role = "2. Mühendis (Second Engineer)", Email = "gabriel.dumitru@constanta-maritime.ro", Phone = "+40 722 520 0110", Nat = "Romanya" },
            new { First = "İlker", Last = "Bozkurt", Role = "Güverte Zabiti (Deck Officer)", Email = "ilker.bozkurt@limangemi.com", Phone = "+90 535 621 1221", Nat = "T.C." },
            new { First = "Tolga", Last = "Güler", Role = "Makine Zabiti (Engine Officer)", Email = "tolga.guler@denizcilik.net", Phone = "+90 536 722 2332", Nat = "T.C." },
            new { First = "Mario", Last = "Rossi", Role = "Telsiz Zabiti (Radio Officer)", Email = "mario.rossi@genovaship.it", Phone = "+39 340 823 3443", Nat = "İtalya" },
            new { First = "Berk", Last = "Altun", Role = "Güverte Lostromosu (Boatswain)", Email = "berk.altun@limangemi.com", Phone = "+90 537 924 4554", Nat = "T.C." },
            new { First = "Batuhan", Last = "Dede", Role = "Usta Gemici (Able Seaman)", Email = "batuhan.dede@denizcilik.net", Phone = "+90 538 025 5665", Nat = "T.C." },
            new { First = "Semih", Last = "Yaman", Role = "Usta Gemici (Able Seaman)", Email = "semih.yaman@limangemi.com", Phone = "+90 539 126 6776", Nat = "T.C." },
            new { First = "Koray", Last = "Tunç", Role = "Yağcı (Oiler)", Email = "koray.tunc@denizcilik.net", Phone = "+90 541 227 7887", Nat = "T.C." },
            new { First = "Emrah", Last = "Karaca", Role = "Aşçı (Cook)", Email = "emrah.karaca@limangemi.com", Phone = "+90 542 328 8998", Nat = "T.C." },
            new { First = "Sedat", Last = "Parlak", Role = "Kaptan (Master)", Email = "sedat.parlak@denizcilik.net", Phone = "+90 532 429 9009", Nat = "T.C." },
            new { First = "Angelo", Last = "Moretti", Role = "Çarkçıbaşı (Chief Engineer)", Email = "angelo.moretti@medsea.it", Phone = "+39 347 530 0110", Nat = "İtalya" },
            new { First = "Ufuk", Last = "Gündüz", Role = "2. Kaptan (Chief Mate)", Email = "ufuk.gunduz@limangemi.com", Phone = "+90 533 631 1221", Nat = "T.C." },
            new { First = "Georgios", Last = "Pavlidis", Role = "2. Mühendis (Second Engineer)", Email = "g.pavlidis@piraeus-crewing.gr", Phone = "+30 694 732 2332", Nat = "Yunanistan" },
            new { First = "Kaan", Last = "Erez", Role = "Güverte Zabiti (Deck Officer)", Email = "kaan.erez@denizcilik.net", Phone = "+90 535 833 3443", Nat = "T.C." },
            new { First = "Onur", Last = "Bilgin", Role = "Makine Zabiti (Engine Officer)", Email = "onur.bilgin@limangemi.com", Phone = "+90 536 934 4554", Nat = "T.C." },
            new { First = "Yusuf", Last = "Duman", Role = "Elektrik Zabiti (Electro-Technical Officer)", Email = "yusuf.duman@denizcilik.net", Phone = "+90 537 035 5665", Nat = "T.C." },
            new { First = "Erhan", Last = "Sönmez", Role = "Güverte Lostromosu (Boatswain)", Email = "erhan.sonmez@limangemi.com", Phone = "+90 538 136 6776", Nat = "T.C." },
            new { First = "Fatih", Last = "Keskin", Role = "Usta Gemici (Able Seaman)", Email = "fatih.keskin@denizcilik.net", Phone = "+90 539 237 7887", Nat = "T.C." },
            new { First = "Erdem", Last = "Kara", Role = "Yağcı (Oiler)", Email = "erdem.kara@limangemi.com", Phone = "+90 541 338 8998", Nat = "T.C." },
            new { First = "Vedat", Last = "Avcı", Role = "Gemici (Ordinary Seaman)", Email = "vedat.avci@denizcilik.net", Phone = "+90 542 439 9009", Nat = "T.C." },
            new { First = "Rıdvan", Last = "Çetin", Role = "Aşçı (Cook)", Email = "ridvan.cetin@limangemi.com", Phone = "+90 543 540 0110", Nat = "T.C." },
            new { First = "Halil İbrahim", Last = "Toprak", Role = "Kaptan (Master)", Email = "halil.toprak@denizcilik.net", Phone = "+90 532 641 1221", Nat = "T.C." },
            new { First = "Stefan", Last = "Popescu", Role = "Çarkçıbaşı (Chief Engineer)", Email = "stefan.popescu@maritime-ro.ro", Phone = "+40 723 742 2332", Nat = "Romanya" },
            new { First = "Alperen", Last = "Sevim", Role = "2. Kaptan (Chief Mate)", Email = "alperen.sevim@limangemi.com", Phone = "+90 533 843 3443", Nat = "T.C." },
            new { First = "Davit", Last = "Kalandadze", Role = "2. Mühendis (Second Engineer)", Email = "d.kalandadze@adjara-shipping.ge", Phone = "+995 598 944 4554", Nat = "Gürcistan" },
            new { First = "Gökhan", Last = "Aksoy", Role = "Güverte Zabiti (Deck Officer)", Email = "gokhan.aksoy@denizcilik.net", Phone = "+90 535 045 5665", Nat = "T.C." },
            new { First = "Samet", Last = "Çiftçi", Role = "Makine Zabiti (Engine Officer)", Email = "samet.ciftci@limangemi.com", Phone = "+90 536 146 6776", Nat = "T.C." },
            new { First = "Burhanettin", Last = "Dinç", Role = "Güverte Lostromosu (Boatswain)", Email = "burhanettin.dinc@denizcilik.net", Phone = "+90 537 247 7887", Nat = "T.C." },
            new { First = "Cemalettin", Last = "Saka", Role = "Usta Gemici (Able Seaman)", Email = "cemalettin.saka@limangemi.com", Phone = "+90 538 348 8998", Nat = "T.C." },
            new { First = "Şevket", Last = "Uysal", Role = "Yağcı (Oiler)", Email = "sevket.uysal@denizcilik.net", Phone = "+90 539 449 9009", Nat = "T.C." },
            new { First = "Bilal", Last = "Tekin", Role = "Gemici (Ordinary Seaman)", Email = "bilal.tekin@limangemi.com", Phone = "+90 541 550 0110", Nat = "T.C." },
            new { First = "Mesut", Last = "Tanrıverdi", Role = "Kaptan (Master)", Email = "mesut.tanriverdi@limangemi.com", Phone = "+90 532 651 1221", Nat = "T.C." },
            new { First = "Petros", Last = "Georgiou", Role = "Çarkçıbaşı (Chief Engineer)", Email = "petros.georgiou@cypruscrewing.cy", Phone = "+357 99 752 233", Nat = "Kıbrıs" },
            new { First = "İlhan", Last = "Bayraktar", Role = "2. Kaptan (Chief Mate)", Email = "ilhan.bayraktar@denizcilik.net", Phone = "+90 533 853 3443", Nat = "T.C." },
            new { First = "Servet", Last = "Şimşek", Role = "2. Mühendis (Second Engineer)", Email = "servet.simsek@limangemi.com", Phone = "+90 535 954 4554", Nat = "T.C." },
            new { First = "Tayfun", Last = "Yaman", Role = "Güverte Zabiti (Deck Officer)", Email = "tayfun.yaman@denizcilik.net", Phone = "+90 536 055 5665", Nat = "T.C." },
            new { First = "Cihan", Last = "Kaplan", Role = "Makine Zabiti (Engine Officer)", Email = "cihan.kaplan@limangemi.com", Phone = "+90 537 156 6776", Nat = "T.C." },
            new { First = "Alparslan", Last = "Koçak", Role = "Güverte Lostromosu (Boatswain)", Email = "alparslan.kocak@limangemi.com", Phone = "+90 538 257 7887", Nat = "T.C." },
            new { First = "Yasin", Last = "Candan", Role = "Usta Gemici (Able Seaman)", Email = "yasin.candan@denizcilik.net", Phone = "+90 539 358 8998", Nat = "T.C." },
            new { First = "Muhsin", Last = "Eren", Role = "Yağcı (Oiler)", Email = "muhsin.eren@limangemi.com", Phone = "+90 541 459 9009", Nat = "T.C." },
            new { First = "Cahit", Last = "Zorlu", Role = "Aşçı (Cook)", Email = "cahit.zorlu@denizcilik.net", Phone = "+90 542 560 0110", Nat = "T.C." },
            new { First = "Selçuk", Last = "Karahan", Role = "Kaptan (Master)", Email = "selcuk.karahan@denizcilik.net", Phone = "+90 532 901 0101", Nat = "T.C." },
            new { First = "Levent", Last = "Bayrak", Role = "Kaptan (Master)", Email = "levent.bayrak@limangemi.com", Phone = "+90 533 902 0202", Nat = "T.C." },
            new { First = "Tarık", Last = "Yıldırım", Role = "Kaptan (Master)", Email = "tarik.yildirim@denizcilik.net", Phone = "+90 535 903 0303", Nat = "T.C." },
            new { First = "Erdem", Last = "Akça", Role = "Kaptan (Master)", Email = "erdem.akca@limangemi.com", Phone = "+90 536 904 0404", Nat = "T.C." },
            new { First = "Şükrü", Last = "Demirtaş", Role = "Kaptan (Master)", Email = "sukru.demirtas@denizcilik.net", Phone = "+90 537 905 0505", Nat = "T.C." },
            new { First = "Hakan", Last = "Yılmazer", Role = "Kaptan (Master)", Email = "hakan.yilmazer@limangemi.com", Phone = "+90 538 906 0606", Nat = "T.C." },
            new { First = "Volkan", Last = "Güler", Role = "Kaptan (Master)", Email = "volkan.guler@denizcilik.net", Phone = "+90 539 907 0707", Nat = "T.C." },
            new { First = "Taylan", Last = "Çetin", Role = "Kaptan (Master)", Email = "taylan.cetin@limangemi.com", Phone = "+90 541 908 0808", Nat = "T.C." },
            new { First = "Cemalettin", Last = "Ersoy", Role = "Kaptan (Master)", Email = "cemalettin.ersoy@denizcilik.net", Phone = "+90 542 909 0909", Nat = "T.C." },
            new { First = "Serdar", Last = "Keskin", Role = "Kaptan (Master)", Email = "serdar.keskin@limangemi.com", Phone = "+90 543 910 1010", Nat = "T.C." },
            new { First = "Necati", Last = "Kurt", Role = "Kaptan (Master)", Email = "necati.kurt@denizcilik.net", Phone = "+90 544 911 1111", Nat = "T.C." },
            new { First = "Zafer", Last = "Bozkurt", Role = "Kaptan (Master)", Email = "zafer.bozkurt@limangemi.com", Phone = "+90 545 912 1212", Nat = "T.C." },
            new { First = "Altan", Last = "Sönmez", Role = "Kaptan (Master)", Email = "altan.sonmez@denizcilik.net", Phone = "+90 546 913 1313", Nat = "T.C." },
            new { First = "İlhan", Last = "Karadağ", Role = "Kaptan (Master)", Email = "ilhan.karadag@limangemi.com", Phone = "+90 532 914 1414", Nat = "T.C." },
            new { First = "Burak", Last = "Alkan", Role = "Kaptan (Master)", Email = "burak.alkan@denizcilik.net", Phone = "+90 533 915 1515", Nat = "T.C." },
            new { First = "Cihan", Last = "Gürsoy", Role = "Kaptan (Master)", Email = "cihan.gursoy@limangemi.com", Phone = "+90 535 916 1616", Nat = "T.C." },
            new { First = "Melih", Last = "Candan", Role = "Kaptan (Master)", Email = "melih.candan@denizcilik.net", Phone = "+90 536 917 1717", Nat = "T.C." },
            new { First = "Sinan", Last = "Barut", Role = "Kaptan (Master)", Email = "sinan.barut@limangemi.com", Phone = "+90 537 918 1818", Nat = "T.C." },
            new { First = "Kadir", Last = "Tekin", Role = "Kaptan (Master)", Email = "kadir.tekin@denizcilik.net", Phone = "+90 538 919 1919", Nat = "T.C." },
            new { First = "Ufuk", Last = "Aslan", Role = "Kaptan (Master)", Email = "ufuk.aslan@limangemi.com", Phone = "+90 539 920 2020", Nat = "T.C." },
            new { First = "Vedat", Last = "Yücel", Role = "Çarkçıbaşı (Chief Engineer)", Email = "vedat.yucel@denizcilik.net", Phone = "+90 541 921 2121", Nat = "T.C." },
            new { First = "Onur", Last = "Doğan", Role = "Çarkçıbaşı (Chief Engineer)", Email = "onur.dogan@limangemi.com", Phone = "+90 542 922 2222", Nat = "T.C." },
            new { First = "Tuncay", Last = "Vural", Role = "Çarkçıbaşı (Chief Engineer)", Email = "tuncay.vural@denizcilik.net", Phone = "+90 543 923 2323", Nat = "T.C." },
            new { First = "Barış", Last = "Kaya", Role = "Çarkçıbaşı (Chief Engineer)", Email = "baris.kaya@limangemi.com", Phone = "+90 544 924 2424", Nat = "T.C." },
            new { First = "Metin", Last = "Şahin", Role = "Çarkçıbaşı (Chief Engineer)", Email = "metin.sahin@denizcilik.net", Phone = "+90 545 925 2525", Nat = "T.C." },
            new { First = "Emre", Last = "Koçak", Role = "1. Zabit (Chief Officer)", Email = "emre.kocak@limangemi.com", Phone = "+90 546 926 2626", Nat = "T.C." },
            new { First = "Batuhan", Last = "Aksoy", Role = "1. Zabit (Chief Officer)", Email = "batuhan.aksoy@denizcilik.net", Phone = "+90 532 927 2727", Nat = "T.C." },
            new { First = "Serkan", Last = "Çelik", Role = "1. Zabit (Chief Officer)", Email = "serkan.celik@limangemi.com", Phone = "+90 533 928 2828", Nat = "T.C." },
            new { First = "Harun", Last = "Demir", Role = "Usta Gemici (Able Seaman)", Email = "harun.demir@denizcilik.net", Phone = "+90 535 929 2929", Nat = "T.C." },
            new { First = "Kerem", Last = "Yıldız", Role = "Usta Gemici (Able Seaman)", Email = "kerem.yildiz@limangemi.com", Phone = "+90 536 930 3030", Nat = "T.C." }
        };

        foreach (var c in newCrewData)
        {
            if (context.CrewMembers.Any(cm => cm.Email == c.Email)) continue;
            context.CrewMembers.Add(new CrewMember
            {
                FirstName = c.First,
                LastName = c.Last,
                Role = c.Role,
                Email = c.Email,
                Phone = c.Phone,
                Nationality = c.Nat
            });
        }
        context.SaveChanges();

        // Ensure idle ships (like Kurtarma-8, Ziya Kalkavan) have visits if missing
        var kurtarmaShip = context.Ships.FirstOrDefault(s => s.ImoNumber == "9082348");
        if (kurtarmaShip != null && !context.ShipVisits.Any(v => v.ShipId == kurtarmaShip.Id))
        {
            context.ShipVisits.Add(new ShipVisit
            {
                ShipId = kurtarmaShip.Id,
                PortId = GetPort("TRIST"),
                ArrivalDate = now.AddDays(-2),
                DepartureDate = now.AddDays(3),
                Status = "Docked",
                DockNumber = "Kurtarma İskelesi 1",
                Purpose = "Liman Emniyet & Acil Müdahale Nöbeti"
            });
        }

        var ziyaShip = context.Ships.FirstOrDefault(s => s.ImoNumber == "9365219");
        if (ziyaShip != null && !context.ShipVisits.Any(v => v.ShipId == ziyaShip.Id))
        {
            context.ShipVisits.Add(new ShipVisit
            {
                ShipId = ziyaShip.Id,
                PortId = GetPort("TRASY"),
                ArrivalDate = now.AddDays(1),
                DepartureDate = now.AddDays(4),
                Status = "Scheduled",
                DockNumber = "Konteyner Rıhtım 2",
                Purpose = "Konteyner Tahliye ve Yükleme"
            });
        }

        context.SaveChanges();
        EnsureAllShipsHaveCrewAssignments(context);
    }

    private static void EnsureAllShipsHaveCrewAssignments(ApplicationDbContext context)
    {
        var allShips = context.Ships.OrderBy(s => s.Id).ToList();
        var allCrew = context.CrewMembers.OrderBy(c => c.Id).ToList();

        if (allShips.Count == 0 || allCrew.Count == 0) return;

        var captains = allCrew.Where(c => c.Role.Contains("Kaptan") || c.Role.Contains("Master")).ToList();
        var engineers = allCrew.Where(c => c.Role.Contains("Mühendis") || c.Role.Contains("Çarkçı") || c.Role.Contains("Engineer")).ToList();
        var others = allCrew.Where(c => !captains.Contains(c) && !engineers.Contains(c)).ToList();

        if (captains.Count == 0 || engineers.Count == 0 || others.Count == 0) return;

        var startDate = DateTime.UtcNow.Date.AddDays(-60);
        var endDate = DateTime.UtcNow.Date.AddDays(150);

        for (int i = 0; i < allShips.Count; i++)
        {
            var ship = allShips[i];
            var shipAssignments = context.ShipCrewAssignments.Where(a => a.ShipId == ship.Id).ToList();

            // 1. Ensure Captain assignment
            bool hasCaptain = shipAssignments.Any(a =>
                a.RoleOnShip.Contains("Kaptan") ||
                captains.Any(c => c.Id == a.CrewMemberId));

            if (!hasCaptain)
            {
                var capt = captains[i % captains.Count];
                if (!shipAssignments.Any(a => a.CrewMemberId == capt.Id))
                {
                    context.ShipCrewAssignments.Add(new ShipCrewAssignment
                    {
                        ShipId = ship.Id,
                        CrewMemberId = capt.Id,
                        StartDate = startDate,
                        EndDate = endDate,
                        RoleOnShip = "Kaptan"
                    });
                }
            }

            // 2. Ensure Chief Engineer assignment
            bool hasEngineer = shipAssignments.Any(a =>
                a.RoleOnShip.Contains("Çarkçı") || a.RoleOnShip.Contains("Mühendis") ||
                engineers.Any(c => c.Id == a.CrewMemberId));

            if (!hasEngineer)
            {
                var eng = engineers[i % engineers.Count];
                if (!shipAssignments.Any(a => a.CrewMemberId == eng.Id))
                {
                    context.ShipCrewAssignments.Add(new ShipCrewAssignment
                    {
                        ShipId = ship.Id,
                        CrewMemberId = eng.Id,
                        StartDate = startDate,
                        EndDate = endDate,
                        RoleOnShip = eng.Role.Contains("Çarkçıbaşı") ? "Çarkçıbaşı" : "2. Mühendis"
                    });
                }
            }

            // 3. Ensure Deck/Engine Officer or Seaman assignment
            int otherCount = shipAssignments.Count(a =>
                !a.RoleOnShip.Contains("Kaptan") &&
                !a.RoleOnShip.Contains("Çarkçı") &&
                !a.RoleOnShip.Contains("Mühendis"));

            if (otherCount == 0)
            {
                var oth = others[i % others.Count];
                if (!shipAssignments.Any(a => a.CrewMemberId == oth.Id))
                {
                    var roleTitle = oth.Role.Contains("(") ? oth.Role.Substring(0, oth.Role.IndexOf("(")).Trim() : oth.Role;
                    context.ShipCrewAssignments.Add(new ShipCrewAssignment
                    {
                        ShipId = ship.Id,
                        CrewMemberId = oth.Id,
                        StartDate = startDate,
                        EndDate = endDate,
                        RoleOnShip = roleTitle
                    });
                }
            }
        }

        context.SaveChanges();
    }
}
