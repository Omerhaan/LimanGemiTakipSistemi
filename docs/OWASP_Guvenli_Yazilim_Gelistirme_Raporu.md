# Staj Çalışması 3. Adım: Güvenli Yazılım Geliştirme ve OWASP Top 10 Uygulama Raporu

**Proje Adı:** Liman Gemi Takip Sistemi  
**Aşama:** 3. Adım — Güvenli Yazılım Geliştirme ve Web Uygulama Güvenliği (OWASP Top 10)  
**Teknoloji Yığını:** ASP.NET Core 8.0 Web API, Entity Framework Core 8.0, SQL Server, React + Vite + TypeScript  
**Tarih:** Ekim 2026  

---

## 📑 İçindekiler
1. [Yönetici Özeti](#1-yönetici-özeti)
2. [10 Temel Güvenlik Senaryosunun Analizi ve Çözümleri](#2-10-temel-güvenlik-senaryosunun-analizi-ve-çözümleri)
   - [Senaryo 1: Broken Access Control (Rol Tabanlı Yetki Denetimi)](#senaryo-1-broken-access-control)
   - [Senaryo 2: IDOR (Insecure Direct Object Reference)](#senaryo-2-idor-insecure-direct-object-reference)
   - [Senaryo 3: SQL Injection (SQLi)](#senaryo-3-sql-injection-sqli)
   - [Senaryo 4: Hassas Bilgi Sızıntısı (Sensitive Data Exposure)](#senaryo-4-hassas-bilgi-sızıntısı-sensitive-data-exposure)
   - [Senaryo 5: Mass Assignment (Aşırı Atama / Over-Posting)](#senaryo-5-mass-assignment-over-posting)
   - [Senaryo 6: Broken Authentication (Zayıf Kimlik Doğrulama)](#senaryo-6-broken-authentication)
   - [Senaryo 7: Güvensiz Hata Yönetimi (Improper Error Handling)](#senaryo-7-güvensiz-hata-yönetimi-improper-error-handling)
   - [Senaryo 8: Güvensiz Dosya Yükleme (Unrestricted File Upload)](#senaryo-8-güvensiz-dosya-yükleme-unrestricted-file-upload)
   - [Senaryo 9: Cross-Site Scripting (XSS)](#senaryo-9-cross-site-scripting-xss)
   - [Senaryo 10: Denial of Service (DoS) & Rate Limiting](#senaryo-10-denial-of-service-dos--rate-limiting)
3. [Bonus Çalışmalar](#3-bonus-çalışmalar)
   - [Bonus 1: OWASP Top 10 Kapsamlı Araştırma Rehberi](#bonus-1-owasp-top-10-kapsamlı-araştırma-rehberi)
   - [Bonus 2: Güvenlik Testleri (OWASP ZAP & Postman Security)](#bonus-2-güvenlik-testleri-owasp-zap--postman-security)
   - [Bonus 3: Merkezi Güvenlik ve Denetim Günlüğü (Audit Logging)](#bonus-3-merkezi-güvenlik-ve-denetim-günlüğü-audit-logging)
   - [Bonus 4: Kurumsal Güvenlik Sıkılaştırması ve İzolasyon (Enterprise Hardening)](#bonus-4-kurumsal-güvenlik-sıkılaştırması-ve-izolasyon-enterprise-hardening)
4. [Birim Testler ve Doğrulama Metrikleri](#4-birim-testler-ve-doğrulama-metrikleri)
5. [Canlı Güvenlik Laboratuvarı (Security Lab UI)](#5-canlı-güvenlik-laboratuvarı-security-lab-ui)
6. [Sonuç ve Mühendislik Değerlendirmesi](#6-sonuç-ve-mühendislik-değerlendirmesi)

---

## 1. Yönetici Özeti

Modern denizcilik ve liman lojistiği yazılımları, stratejik ulusal ve uluslararası ticaret verilerini (yük manifestoları, gemi konumları, tehlikeli madde bildirimleri, liman doluluk oranları ve mürettebat kimlikleri) barındırmaktadır. Bu sistemlerde meydana gelebilecek bir güvenlik zafiyeti, hem ticari sırların ifşasına hem de liman operasyonlarının durmasına (DoS) sebep olabilir.

Bu çalışma kapsamında; **Liman Gemi Takip Sistemi** üzerinde OWASP Top 10 standartlarına göre en kritik 10 güvenlik zafiyeti kasıtlı olarak modellenmiş, açıkların nasıl istismar edildiği gösterilmiş, kurumsal riskleri analiz edilmiş ve modern ASP.NET Core güvenlik en iyi uygulamaları (Defense in Depth) ile tamamen giderilmiştir. Ayrıca operasyonel ve kişisel veri okuma uç noktaları yetkilendirme altına alınmış, denetim günlüğü ve veri tohumlama servisleri katı rol denetimleriyle izole edilmiş, JWT anahtarları ve demo hesapları kurumsal güvenli yapılandırma standartlarına taşınmıştır. Sistem, 144 başarılı birim testi ve interaktif bir canlı **Güvenlik Laboratuvarı (Security Lab)** ile doğrulanmıştır.

---

## 2. 10 Temel Güvenlik Senaryosunun Analizi ve Çözümleri

### Senaryo 1: Broken Access Control
* **OWASP Kategorisi:** A01:2021 - Broken Access Control
* **Problem:** Endpoint seviyesinde rol ve kimlik doğrulama yapılmaması; anonim istemcilerin gizli liman operasyon verilerine erişebilmesi.
* **Açığın Modellenmesi:**
  ```csharp
  [HttpGet("access-control/vulnerable")]
  [AllowAnonymous]
  public IActionResult AccessControlVulnerable() {
      return Ok(new { portBudget = 25000000.00, securityLevel = "MARSEC 2" });
  }
  ```
* **Risk Analizi:** Kurumsal liman bütçesi, güvenlik derecelendirmesi ve teftiş raporları internete sızar.
* **Çözüm Yaklaşımı:** `[Authorize(Roles = "Admin,PortManager")]` politikası ve JWT claim doğrulaması. Yetkisiz istekler doğrudan `401 Unauthorized` veya `403 Forbidden` ile kesilir.
* **Önce/Sonra:** Kimliksiz istek önce HTTP 200 ile veriyi alırken, sonra HTTP 401/403 ile engellendi.

---

### Senaryo 2: IDOR (Insecure Direct Object Reference)
* **OWASP Kategorisi:** A01:2021 - Broken Access Control
* **Problem:** URL'deki `portId` parametresi doğrudan veritabanında sorgulanmakta, kullanıcının o limana yetkisi olup olmadığı denetlenmemektedir.
* **Açığın Modellenmesi:**
  ```csharp
  [HttpGet("idor/vulnerable/{portId}")]
  public async Task<IActionResult> IdorVulnerable(int portId) {
      var visits = await _context.ShipVisits.Where(v => v.PortId == portId).ToListAsync();
      return Ok(visits);
  }
  ```
* **Risk Analizi:** Mersin Limanı müdürü, URL'yi `portId=1` yaparak Ambarlı Limanı'nın ticari seferlerini ve yük manifestolarını görüntüler.
* **Çözüm Yaklaşımı:** Servis katmanında `User.FindFirst("PortId")` kontrolü yapılır. Kullanıcı `Admin` değilse ve kendi limanı dışındaki bir kaynağı isterse işlem durdurulur ve `CRITICAL` önem derecesinde Audit Log kaydedilir.
* **Önce/Sonra:** Yetkisiz liman verisi önce açıkça listelenirken, sonra HTTP 403 Forbidden ile engellendi ve saldırı günlüğe işlendi.

---

### Senaryo 3: SQL Injection (SQLi)
* **OWASP Kategorisi:** A03:2021 - Injection
* **Problem:** Kullanıcıdan alınan arama kelimesinin dinamik string birleştirme ile SQL cümlesine gömülmesi.
* **Açığın Modellenmesi:**
  ```csharp
  var sql = $"SELECT * FROM Ships WHERE Name LIKE '%{searchTerm}%'";
  var ships = await _context.Ships.FromSqlRaw(sql).ToListAsync();
  ```
* **Risk Analizi:** Saldırgan `' OR '1'='1` göndererek veritabanındaki tüm gemi, yük ve kullanıcı verilerini filtreyi baypas ederek çekebilir veya `DROP TABLE` komutları çalıştırabilir.
* **Çözüm Yaklaşımı:** Entity Framework Core parametreli LINQ sorgusu (`_context.Ships.Where(s => s.Name.Contains(searchTerm))`). SQL Server motorunda sorgu `WHERE [s].[Name] LIKE @p0` şeklinde parametreli yürütülür.
* **Önce/Sonra:** Saldırgan `' OR '1'='1` ile önce 35 geminin tamamını sızdırırken, sonra yalnızca bu karakterleri içeren 0 kayıt döndü.

---

### Senaryo 4: Hassas Bilgi Sızıntısı (Sensitive Data Exposure)
* **OWASP Kategorisi:** A02:2021 - Cryptographic Failures
* **Problem:** Mürettebat listesinde doğrudan veritabanı Entity'sinin serileştirilmesi; TCKN, açık telefon ve e-postaların ifşa olması.
* **Risk Analizi:** KVKK/GDPR ihlalleri, denizcilerin kişisel verilerinin çalınması ve dolandırıcılık riski.
* **Çözüm Yaklaşımı:** Katmanlı DTO mimarisi:
  - Anonim/Viewer: `CrewPublicDto` (Yalnızca Ad Soyad, Unvan, Milliyet).
  - Operatör: `CrewMaskedDto` (`+90 532 *** ** 33`, `a***@liman.gov.tr`).
  - Sistem Yöneticisi: `CrewConfidentialDto` (Tam yetkili).
* **Önce/Sonra:** Açık telefon ve e-posta yerine maskelenmiş güvenli görünüm sağlandı.

---

### Senaryo 5: Mass Assignment (Over-Posting)
* **OWASP Kategorisi:** A08:2021 - Software and Data Integrity Failures
* **Problem:** API'nin doğrudan `User` modelini model binder ile bağlaması; JSON gövdesindeki `Role: Admin` alanının kabul edilmesi.
* **Risk Analizi:** Kayıt olan herhangi bir sıradan ziyaretçinin yönetim yetkisi kazanarak sistemi ele geçirmesi.
* **Çözüm Yaklaşımı:** Katı `CreateUserRequest` DTO'su tanımlandı. Kritik `Role` alanı DTO'ya dahil edilmedi; sunucu tarafında zorunlu olarak `"Viewer"` atandı.
* **Önce/Sonra:** Saldırganın gönderdiği `Role: Admin` alanı sunucuda tamamen yok sayıldı.

---

### Senaryo 6: Broken Authentication
* **OWASP Kategorisi:** A07:2021 - Identification and Authentication Failures
* **Problem:** 10 yıllık statik token ömrü, zayıf secret key ve çıkış yapıldığında token iptal (revocation) desteğinin olmaması.
* **Risk Analizi:** Çalınan bir token ile saldırganın yıllarca sisteme sızması, şifre değiştirilse veya çıkış yapılsa dahi engellenememesi.
* **Çözüm Yaklaşımı:**
  - 15 dakikalık kısa ömürlü Access Token.
  - 7 günlük, kriptografik rastgele 64-byte Refresh Token.
  - Tek kullanımlık rotasyon: Her yenilemede eski refresh token geçersiz kılınır ve yenisi üretilir.
  - `/api/auth/logout` çağrıldığında sunucuda refresh token silinir (Revocation).
* **Önce/Sonra:** Statik güvensiz oturum yerine dinamik, rotasyonlu ve iptal edilebilir kurumsal kimlik altyapısı kuruldu.

---

### Senaryo 7: Güvensiz Hata Yönetimi (Improper Error Handling)
* **OWASP Kategorisi:** A05:2021 - Security Misconfiguration
* **Problem:** Sunucu istisnalarında SQL bağlantı cümleleri, veritabanı şifresi ve iç dosya yollarının kullanıcıya basılması.
* **Risk Analizi:** Saldırgana veritabanı IP adresi, port, kullanıcı adı ve tablo şeması hakkında açık istihbarat verilmesi.
* **Çözüm Yaklaşımı:** `GlobalExceptionMiddleware` geliştirildi. Hata anında istemciye yalnızca standart `{ "message": "Beklenmeyen bir hata oluştu.", "traceId": "..." }` döner; teknik detaylar sunucu içi loglara yazılır.
* **Önce/Sonra:** 50 satırlık stack trace ve veritabanı bağlantı cümlesi yerine güvenli ve standart JSON hatası sağlandı.

---

### Senaryo 8: Güvensiz Dosya Yükleme (Unrestricted File Upload)
* **OWASP Kategorisi:** A04:2021 - Insecure Design
* **Problem:** Gemi evrak yüklemesinde uzantı, boyut ve MIME kontrolü yapılmadan `.exe`, `.php` yüklenebilmesi.
* **Risk Analizi:** Sunucu üzerinde Web Shell çalıştırılarak sunucunun tamamen ele geçirilmesi (RCE).
* **Çözüm Yaklaşımı:**
  - Uzantı beyaz listesi: Yalnızca `.pdf`, `.png`, `.jpg`, `.jpeg`.
  - Boyut sınırı: Maksimum 5 MB.
  - Güvenli dizin ve GUID isimlendirme (`{guid}.pdf`) ile Path Traversal engeli.
* **Önce/Sonra:** `.exe` ve `.php` dosyaları reddedildi, onaylı belgeler güvenli GUID adı ile saklandı.

---

### Senaryo 9: Cross-Site Scripting (XSS)
* **OWASP Kategorisi:** A03:2021 - Injection
* **Problem:** Gemi açıklamasına girilen `<script>alert('XSS')</script>` kodunun arayüzde doğrudan çalışması.
* **Risk Analizi:** Kullanıcı oturum çerezlerinin çalınması (Session Hijacking), sahte formlar ile şifre hırsızlığı.
* **Çözüm Yaklaşımı:**
  - Backend: `WebUtility.HtmlEncode` ile özel karakterlerin `&lt;script&gt;` biçimine dönüştürülmesi ve regex script tag temizliği.
  - HTTP Security Headers: Content Security Policy (CSP), `X-XSS-Protection: 1; mode=block`.
* **Önce/Sonra:** Zararlı JavaScript kodları pasif düz metne dönüştürülerek tarayıcıda çalışması kesin olarak engellendi.

---

### Senaryo 10: Denial of Service (DoS) & Rate Limiting
* **OWASP Kategorisi:** A04:2021 - Insecure Design
* **Problem:** `GET /api/ships?pageSize=1000000` gibi aşırı büyük istekler ve sınırsız API çağrıları ile sunucunun kilitlenmesi.
* **Risk Analizi:** Sunucu RAM ve CPU tükenmesi sonucu meşru kullanıcıların sisteme erişememesi.
* **Çözüm Yaklaşımı:**
  - `Math.Min(pageSize, 100)` ile katı sayfalama tavanı.
  - ASP.NET Core `RateLimiter` middleware: IP başına dakikada maksimum 120 istek, hassas güvenlik uç noktalarında 10 saniyede maksimum 5 istek kotası. Aşılırsa HTTP `429 Too Many Requests`.
* **Önce/Sonra:** 1 milyonluk talep 100 ile sınırlandı; hızlı 6. istekte HTTP 429 yanıtı dönüldü.

---

## 3. Bonus Çalışmalar

### Bonus 1: OWASP Top 10 Kapsamlı Araştırma Rehberi
1. **A01: Broken Access Control:** Rol ve yetki sınırlarının ihlali. Çözüm: RBAC, Principle of Least Privilege, IDOR önleme.
2. **A02: Cryptographic Failures:** Şifrelenmemiş hassas veri transferi. Çözüm: HTTPS, TLS 1.3, PBKDF2/Argon2 şifreleme, DTO maskeleme.
3. **A03: Injection:** SQL, NoSQL veya OS komut enjeksiyonu. Çözüm: Parametreli ORM sorguları, HTML Encoding.
4. **A04: Insecure Design:** Mimari tasarım aşamasında güvenlik önlemlerinin düşünülmemesi. Çözüm: Tehdit modelleme, Rate limiting, dosya doğrulama.
5. **A05: Security Misconfiguration:** Varsayılan şifreler, açık hata sayfaları, eksik header'lar. Çözüm: Global exception middleware, CSP, HSTS.
6. **A06: Vulnerable and Outdated Components:** Güncellenmemiş bağımlılıklar. Çözüm: `dotnet list package --vulnerable`, Dependabot.
7. **A07: Identification and Authentication Failures:** Zayıf parola ve oturum yönetimi. Çözüm: PBKDF2 (600.000 iterasyon), kısa ömürlü JWT, Refresh Token rotasyonu.
8. **A08: Software and Data Integrity Failures:** Güvenilmeyen eklenti veya deserialization. Çözüm: Mass assignment engelleme, kod imzalama.
9. **A09: Security Logging and Monitoring Failures:** Güvenlik olaylarının loglanmaması. Çözüm: Merkezi `AuditLogs` tablosu, başarısız oturum ve IDOR alarmları.
10. **A10: Server-Side Request Forgery (SSRF):** Sunucunun saldırgan tarafından iç ağa istek yapmaya zorlanması. Çözüm: URL beyaz listesi, iç IP erişim blokajı.

### Bonus 2: Güvenlik Testleri (OWASP ZAP & Postman Security)
* **OWASP ZAP (Zed Attack Proxy):** API adresine Automated Scan çalıştırılarak eksik HTTP güvenlik başlıkları (CSP, X-Frame-Options), SQLi ve XSS taranmıştır.
* **Postman Security Tests:** Postman koleksiyonuna eklenen test scriptleri ile yetkisiz çağrılarda 401/403, aşırı isteklerde 429 yanıtlarının doğrulanması otomatikleştirilmiştir.

### Bonus 3: Merkezi Güvenlik ve Denetim Günlüğü (Audit Logging)
* `AuditLog` entity ve `AuditLogService` ile aşağıdaki kritik olaylar kaydedilmektedir:
  - `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`
  - `IDOR_ATTEMPT_BLOCKED` (Severity: CRITICAL)
  - `SQLI_DETECTED_BLOCKED` (Severity: WARNING)
  - `RATE_LIMIT_EXCEEDED` (Severity: WARNING)
  - `SECURE_RESOURCE_ACCESSED` (Severity: INFO)
* Kaydedilen alanlar: IP Adresi, Kullanıcı Adı, Rol, Eylem, Varlık, Zaman Damgası ve Teknik Detay.

### Bonus 4: Kurumsal Güvenlik Sıkılaştırması ve İzolasyon (Enterprise Hardening)

Sistem genelinde kapsamlı bir güvenlik incelemesi gerçekleştirilmiş ve kurumsal standartlara tam uyum sağlamak üzere aşağıdaki ek sıkılaştırmalar hayata geçirilmiştir:

1. **Operasyonel ve Kişisel Veri Uç Noktalarının Yetkilendirilmesi:**
   - Önceden anonim erişime açık olabilecek tüm veri okuma uç noktaları (`Ships`, `Ports`, `ShipVisits`, `Cargoes`, `CrewMembers`, `ShipCrewAssignments` genelinde `GetAll`, `GetPaged`, `GetById`) temel CRUD taban sınıfı (`CrudControllerBase<T>`) ve ilgili denetleyiciler seviyesinde `[Authorize]` ile korumaya alınmıştır.
   - `ShipVisitsController` altındaki sefer planlama sorguları (`available-ships`, `available-crew`, `validate-manning`) ve `ReportsController` raporlama uç noktaları kimlik doğrulaması zorunlu hale getirilmiş; sefer sevk işlemi (`dispatch`) yalnızca `Admin,Operator` rollerine bağlanmıştır.

2. **Denetim Günlüğü ve Veri Tohumlama / Sıfırlama Rol Kısıtlamaları:**
   - `AuditLogsController` üzerindeki anonim simülasyon kaldırılmış; uç noktaların tamamı yalnızca `Admin,PortManager` rollerine tahsis edilmiştir.
   - `DataSeedController` (`GenerateMassData`, `ResetToInitial`) operasyonları yalnızca `Admin` rolüne açılmış ve canlı ortamlarda veri manipülasyonunu engellemek amacıyla `Development` ortamı dışında HTTP `403 Forbidden` döndürecek katı bir ortam bariyeri ile kilitlenmiştir.

3. **Güvenli JWT Yapılandırması ve Fail-Safe Yükleme:**
   - Statik JWT anahtarı ana `appsettings.json` dosyasından kaldırılmıştır.
   - Güvenli konfigürasyon veya ortam değişkenleri (`Jwt__Key`) üzerinden yüklenmektedir.
   - `Program.cs` ve `AuthService.cs` içerisindeki zayıf/hardcoded fallback anahtarları silinmiş; imzalama anahtarının eksik olması durumunda sistemin güvensiz ayağa kalkması engellenerek açıklayıcı bir `InvalidOperationException` ile **Fail-Safe** prensibine uygun olarak durdurulması sağlanmıştır.
   - Geliştirme ortamı için güvenli anahtar `appsettings.Development.json` dosyasına izole edilmiştir.

4. **Demo Hesaplarının Ortam İzolasyonu ve Güvenli Başlangıç Kurulumu:**
   - `DbInitializer.cs` içerisinde önceden tanımlı demo hesapları (`admin`, `operator`, `portmanager`, `viewer`) yalnızca `Development` ortamında oluşturulacak şekilde kısıtlanmıştır.
   - Canlı/Prodüksiyon ortamında sistemin varsayılan şifrelerle açılması engellenmiş; güvenli yönetici hesabı oluşturma işlemi `AdminSetup` yapılandırması veya güvenli ortam değişkenleri (`INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_PASSWORD`) aracılığıyla zorunlu kılınmıştır.

5. **Kasıtlı Savunmasız Güvenlik Demosu Uç Noktalarının Ortam İzolasyonu:**
   - `SecurityDemoController` bünyesinde eğitim amaçlı barındırılan 10 savunmasız uç nokta (`*Vulnerable`), `Development` ortamı dışında HTTP `403 Forbidden` (`Mode: DISABLED`) yanıtı verecek şekilde izole edilmiştir. Canlı sistemlerde hiçbir şekilde istismar edilemez.

---

## 4. Birim Testler ve Doğrulama Metrikleri

`backend/LimanGemiTakip.Tests` projesi altında toplam **144 birim testi** yazılmış ve %100 başarıyla çalıştırılmıştır.

| Test Grubu | Test Sayısı | Başarı Durumu | Kapsam |
| :--- | :---: | :---: | :--- |
| **RoleAuthorizationTests.cs** | **20** | **%100 Geçti** | CRUD okuma uç noktaları, sefer planlama, raporlar, denetim günlüğü ve veri tohumlama rol/yetki doğrulamaları |
| **SecurityScenariosTests.cs** | **13** | **%100 Geçti** | 10 OWASP senaryosu, Refresh Token rotasyonu ve Production ortamında açık uç noktaların devre dışı bırakılması doğrulaması |
| **AuthServiceTests.cs** | **5** | **%100 Geçti** | Kimlik doğrulama, PBKDF2 hash doğrulaması ve eksik JWT anahtarında güvenli istisna (Fail-Safe) fırlatılması |
| **ConcurrencyTests.cs** | 2 | %100 Geçti | RowVersion ve eş zamanlılık çakışması |
| **SoftDeleteTests.cs** | 4 | %100 Geçti | Mantıksal silme ve Global Query Filter |
| **TransactionTests.cs** | 2 | %100 Geçti | Atomik operasyon ve Rollback doğrulaması |
| **Mevcut Servis & Doğrulama Testleri** | 98 | %100 Geçti | IMO Checksum, Çakışma, Liman Kapasite ve Sefer Planlama Doğrulamaları |
| **GENEL TOPLAM** | **144 Test** | **144 Başarılı (0 Hata)** | **%100 Kapsama** |

---

## 5. Canlı Güvenlik Laboratuvarı (Security Lab UI)

Frontend menüsüne eklenen **"Güvenlik Lab (OWASP)"** ekranı üzerinden:
1. 10 senaryonun her biri seçilebilir ve özel saldırı parametreleri girilebilir.
2. 🔴 **"Açık Hali Test Et"** butonu ile güvenlik açığı tetiklenip canlı HTTP yanıtı incelenebilir.
3. 🟢 **"Güvenli Hali Test Et"** butonu ile savunma mekanizmasının (RBAC, Parametreli SQL, Sanitization, Rate Limit) nasıl koruma sağladığı izlenebilir.
4. **Denetim Günlüğü (Audit Log)** sekmesinden sistemdeki tüm güvenlik olayları ve engellenen saldırı girişimleri anlık olarak görüntülenebilir.

---

## 6. Sonuç ve Mühendislik Değerlendirmesi

1. **Defense in Depth (Derinlemesine Savunma):** Güvenlik tek bir noktada değil; Network (CSP/Headers), Middleware (Global Exception, Rate Limiting), Servis (RBAC, IDOR, DTO) ve Veritabanı (Parametreli LINQ) seviyesinde uçtan uca uygulanmıştır.
2. **Principle of Least Privilege (En Az Yetki Prensibi):** Her kullanıcı rolü yalnızca kendi işi için asgari düzeyde veriye ve yetkiye sahiptir.
3. **Fail-Safe Defaults (Güvenli Varsayılanlar):** Bir hata oluştuğunda sistem ayrıntı sızdırmaz, yeni kullanıcılar en kısıtlı rolle açılır, geçersiz dosyalar doğrudan reddedilir.
4. Bu çalışma ile proje, kurumsal bir liman işletmesinin siber güvenlik gereksinimlerini karşılayacak olgunluğa ulaştırılmıştır.
