-- ============================================================================
-- Liman Gemi Takip Sistemi - Görev 1: Toplu Test Verisi Üretim Scripti
-- Hedef:
--   - En az 1.000 Ship
--   - En az 100 Port
--   - En az 5.000 ShipVisit
--   - En az 10.000 Cargo
--   - En az 5.000 CrewMember
--   - En az 15.000 ShipCrewAssignment
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

PRINT '=== Toplu Test Verisi Üretimi Başlatılıyor ===';

-- 1. LIMANLAR (PORTS) - En az 100 adet
PRINT '1. Limanlar üretiliyor (100+ adet)...';
DECLARE @ExistingPorts INT = (SELECT COUNT(*) FROM Ports);
IF @ExistingPorts < 100
BEGIN
    DECLARE @p INT = @ExistingPorts + 1;
    WHILE @p <= 120
    BEGIN
        DECLARE @pCode VARCHAR(10) = 'TR' + RIGHT('000' + CAST(@p AS VARCHAR(10)), 3);
        IF NOT EXISTS (SELECT 1 FROM Ports WHERE Code = @pCode)
        BEGIN
            INSERT INTO Ports (Name, Code, Country, City, Capacity, CreatedAt, CreatedBy, IsDeleted)
            VALUES (
                'Liman Test ' + CAST(@p AS NVARCHAR(10)),
                @pCode,
                CASE @p % 5 
                    WHEN 0 THEN 'Türkiye'
                    WHEN 1 THEN 'Yunanistan'
                    WHEN 2 THEN 'İtalya'
                    WHEN 3 THEN 'İspanya'
                    ELSE 'Mısır'
                END,
                'Liman Şehri ' + CAST(@p AS NVARCHAR(10)),
                50 + (@p % 50),
                GETUTCDATE(),
                'MassDataSeeder',
                0
            );
        END
        SET @p = @p + 1;
    END
END

-- 2. GEMILER (SHIPS) - En az 1.000 adet (Geçerli 7 basamaklı IMO)
PRINT '2. Gemiler üretiliyor (1.000+ adet)...';
DECLARE @ExistingShips INT = (SELECT COUNT(*) FROM Ships);
IF @ExistingShips < 1000
BEGIN
    DECLARE @s INT = @ExistingShips + 1;
    WHILE @s <= 1050
    BEGIN
        -- IMO Checksum hesaplama: İlk 6 basamak (d1..d6), kontrol basamağı = (d1*7 + d2*6 + d3*5 + d4*4 + d5*3 + d6*2) % 10
        DECLARE @baseNum INT = 900000 + @s;
        DECLARE @d1 INT = (@baseNum / 100000) % 10;
        DECLARE @d2 INT = (@baseNum / 10000) % 10;
        DECLARE @d3 INT = (@baseNum / 1000) % 10;
        DECLARE @d4 INT = (@baseNum / 100) % 10;
        DECLARE @d5 INT = (@baseNum / 10) % 10;
        DECLARE @d6 INT = @baseNum % 10;
        DECLARE @chk INT = (@d1*7 + @d2*6 + @d3*5 + @d4*4 + @d5*3 + @d6*2) % 10;
        DECLARE @imo VARCHAR(10) = CAST(@baseNum AS VARCHAR(6)) + CAST(@chk AS VARCHAR(1));

        IF NOT EXISTS (SELECT 1 FROM Ships WHERE IMO = @imo)
        BEGIN
            INSERT INTO Ships (Name, IMO, Type, Flag, YearBuilt, DeadweightTonnage, CreatedAt, CreatedBy, IsDeleted)
            VALUES (
                'Ticari Gemi ' + CAST(@s AS NVARCHAR(10)),
                @imo,
                CASE @s % 6
                    WHEN 0 THEN 'Konteyner'
                    WHEN 1 THEN 'Tanker'
                    WHEN 2 THEN 'Kuru Yük'
                    WHEN 3 THEN 'Ro-Ro'
                    WHEN 4 THEN 'Genel Kargo'
                    ELSE 'Dökme Yük'
                END,
                CASE @s % 4
                    WHEN 0 THEN 'Türkiye'
                    WHEN 1 THEN 'Panama'
                    WHEN 2 THEN 'Malta'
                    ELSE 'Liberya'
                END,
                2000 + (@s % 24),
                20000.00 + ((@s * 137) % 60000),
                GETUTCDATE(),
                'MassDataSeeder',
                0
            );
        END
        SET @s = @s + 1;
    END
END

-- 3. MÜRETTEBAT (CREWMEMBERS) - En az 5.000 adet
PRINT '3. Mürettebat üretiliyor (5.000+ adet)...';
DECLARE @ExistingCrew INT = (SELECT COUNT(*) FROM CrewMembers);
IF @ExistingCrew < 5000
BEGIN
    DECLARE @c INT = @ExistingCrew + 1;
    WHILE @c <= 5100
    BEGIN
        INSERT INTO CrewMembers (FirstName, LastName, FullName, Role, Email, PhoneNumber, Nationality, CreatedAt, CreatedBy, IsDeleted)
        VALUES (
            'Denizci' + CAST(@c AS NVARCHAR(10)),
            'Soyad' + CAST(@c AS NVARCHAR(10)),
            'Denizci' + CAST(@c AS NVARCHAR(10)) + ' Soyad' + CAST(@c AS NVARCHAR(10)),
            CASE @c % 5
                WHEN 0 THEN 'Kaptan (Master)'
                WHEN 1 THEN 'Çarkçıbaşı (Chief Engineer)'
                WHEN 2 THEN '1. Zabit (Chief Officer)'
                WHEN 3 THEN 'Usta Gemici (Able Seaman)'
                ELSE 'Yağcı (Oiler)'
            END,
            'denizci' + CAST(@c AS NVARCHAR(10)) + '@denizcilik.com',
            '+90 532 ' + RIGHT('000' + CAST(@c % 1000 AS VARCHAR(3)), 3) + ' ' + RIGHT('0000' + CAST((@c * 17) % 10000 AS VARCHAR(4)), 4),
            'T.C.',
            GETUTCDATE(),
            'MassDataSeeder',
            0
        );
        SET @c = @c + 1;
    END
END

-- 4. KARGO / YÜKLER (CARGOES) - En az 10.000 adet
PRINT '4. Yükler / Kargolar üretiliyor (10.000+ adet)...';
DECLARE @ExistingCargo INT = (SELECT COUNT(*) FROM Cargoes);
IF @ExistingCargo < 10000
BEGIN
    -- Gemilerin Id listesini al
    SELECT TOP 1000 ShipId INTO #ShipIds FROM Ships ORDER BY ShipId;

    DECLARE @cg INT = @ExistingCargo + 1;
    WHILE @cg <= 10200
    BEGIN
        DECLARE @targetShipId INT = (SELECT ShipId FROM (SELECT ShipId, ROW_NUMBER() OVER(ORDER BY ShipId) AS RowNum FROM #ShipIds) AS T WHERE RowNum = ((@cg % 1000) + 1));
        
        INSERT INTO Cargoes (ShipId, Description, WeightTon, CargoType, ContainerCount, CreatedAt, CreatedBy, IsDeleted)
        VALUES (
            @targetShipId,
            'Ticari Sevkiyat Lot #' + CAST(@cg AS NVARCHAR(10)),
            50.00 + ((@cg * 43) % 2500),
            CASE @cg % 4
                WHEN 0 THEN 'Konteyner'
                WHEN 1 THEN 'Sıvı Yakıt'
                WHEN 2 THEN 'Dökme Tahıl'
                ELSE 'Kuru Yük'
            END,
            CASE WHEN @cg % 4 = 0 THEN 20 + (@cg % 150) ELSE NULL END,
            GETUTCDATE(),
            'MassDataSeeder',
            0
        );
        SET @cg = @cg + 1;
    END
    DROP TABLE #ShipIds;
END

-- 5. GEMİ ZİYARETLERİ (SHIPVISITS) - En az 5.000 adet
PRINT '5. Gemi Ziyaretleri üretiliyor (5.000+ adet)...';
DECLARE @ExistingVisits INT = (SELECT COUNT(*) FROM ShipVisits);
IF @ExistingVisits < 5000
BEGIN
    SELECT TOP 1000 ShipId INTO #ShipIdsV FROM Ships ORDER BY ShipId;
    SELECT TOP 100 PortId INTO #PortIdsV FROM Ports ORDER BY PortId;

    DECLARE @v INT = @ExistingVisits + 1;
    WHILE @v <= 5100
    BEGIN
        DECLARE @vShipId INT = (SELECT ShipId FROM (SELECT ShipId, ROW_NUMBER() OVER(ORDER BY ShipId) AS RowNum FROM #ShipIdsV) AS T WHERE RowNum = ((@v % 1000) + 1));
        DECLARE @vPortId INT = (SELECT PortId FROM (SELECT PortId, ROW_NUMBER() OVER(ORDER BY PortId) AS RowNum FROM #PortIdsV) AS T WHERE RowNum = ((@v % 100) + 1));

        DECLARE @arrDate DATETIME2 = DATEADD(DAY, -300 + (@v % 600), GETUTCDATE());
        DECLARE @depDate DATETIME2 = DATEADD(DAY, 2 + (@v % 5), @arrDate);

        INSERT INTO ShipVisits (ShipId, PortId, ArrivalDate, DepartureDate, Purpose, Status, DockNumber, CreatedAt, CreatedBy, IsDeleted)
        VALUES (
            @vShipId,
            @vPortId,
            @arrDate,
            @depDate,
            CASE @v % 3
                WHEN 0 THEN 'Yük Boşaltma ve İkmal'
                WHEN 1 THEN 'Yükleme Operasyonu'
                ELSE 'Periyodik Bakım ve Onarım'
            END,
            CASE 
                WHEN GETUTCDATE() > @depDate THEN 'Departed'
                WHEN GETUTCDATE() >= @arrDate THEN 'Docked'
                ELSE 'Scheduled'
            END,
            'Rıhtım-' + CAST((@v % 15) + 1 AS NVARCHAR(5)),
            GETUTCDATE(),
            'MassDataSeeder',
            0
        );
        SET @v = @v + 1;
    END
    DROP TABLE #ShipIdsV;
    DROP TABLE #PortIdsV;
END

-- 6. GEMİ-MÜRETTEBAT ATAMALARI (SHIPCREWASSIGNMENTS) - En az 15.000 adet
PRINT '6. Mürettebat atamaları üretiliyor (15.000+ adet)...';
DECLARE @ExistingAssignments INT = (SELECT COUNT(*) FROM ShipCrewAssignments);
IF @ExistingAssignments < 15000
BEGIN
    SELECT TOP 1000 ShipId INTO #ShipIdsA FROM Ships ORDER BY ShipId;
    SELECT TOP 5000 CrewId INTO #CrewIdsA FROM CrewMembers ORDER BY CrewId;

    DECLARE @a INT = @ExistingAssignments + 1;
    WHILE @a <= 15200
    BEGIN
        DECLARE @aShipId INT = (SELECT ShipId FROM (SELECT ShipId, ROW_NUMBER() OVER(ORDER BY ShipId) AS RowNum FROM #ShipIdsA) AS T WHERE RowNum = ((@a % 1000) + 1));
        DECLARE @aCrewId INT = (SELECT CrewId FROM (SELECT CrewId, ROW_NUMBER() OVER(ORDER BY CrewId) AS RowNum FROM #CrewIdsA) AS T WHERE RowNum = ((@a % 5000) + 1));

        DECLARE @stDate DATETIME2 = DATEADD(MONTH, -12 + (@a % 24), GETUTCDATE());
        DECLARE @enDate DATETIME2 = DATEADD(MONTH, 3 + (@a % 6), @stDate);

        -- Çakışma kontrolü
        IF NOT EXISTS (SELECT 1 FROM ShipCrewAssignments WHERE ShipId = @aShipId AND CrewId = @aCrewId AND AssignmentDate = @stDate)
        BEGIN
            INSERT INTO ShipCrewAssignments (ShipId, CrewId, AssignmentDate, EndDate, RoleOnShip, CreatedAt, CreatedBy, IsDeleted)
            VALUES (
                @aShipId,
                @aCrewId,
                @stDate,
                @enDate,
                CASE @a % 4
                    WHEN 0 THEN 'Kaptan'
                    WHEN 1 THEN 'Başmühendis'
                    WHEN 2 THEN '2. Kaptan'
                    ELSE 'Usta Gemici'
                END,
                GETUTCDATE(),
                'MassDataSeeder',
                0
            );
        END
        SET @a = @a + 1;
    END
    DROP TABLE #ShipIdsA;
    DROP TABLE #CrewIdsA;
END

COMMIT TRANSACTION;

PRINT '=== Toplu Test Verisi Üretimi Başarıyla Tamamlandı ===';
PRINT 'Toplam Ships: ' + CAST((SELECT COUNT(*) FROM Ships) AS VARCHAR(10));
PRINT 'Toplam Ports: ' + CAST((SELECT COUNT(*) FROM Ports) AS VARCHAR(10));
PRINT 'Toplam ShipVisits: ' + CAST((SELECT COUNT(*) FROM ShipVisits) AS VARCHAR(10));
PRINT 'Toplam Cargoes: ' + CAST((SELECT COUNT(*) FROM Cargoes) AS VARCHAR(10));
PRINT 'Toplam CrewMembers: ' + CAST((SELECT COUNT(*) FROM CrewMembers) AS VARCHAR(10));
PRINT 'Toplam ShipCrewAssignments: ' + CAST((SELECT COUNT(*) FROM ShipCrewAssignments) AS VARCHAR(10));
