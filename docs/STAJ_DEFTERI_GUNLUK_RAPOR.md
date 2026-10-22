# T.C. ÜNİVERSİTESİ BİLGİSAYAR / YAZILIM MÜHENDİSLİĞİ BÖLÜMÜ
## ZORUNLU İŞYERİ STAJI GÜNLÜK ÇALIŞMA RAPORU (STAJ DEFTERİ)

---

### STAJ RAPORU VE ÖĞRENCİ BİLGİ FORMU

| STAJ RAPORU | | | |
| :--- | :--- | :--- | :--- |
| **Öğrencinin Adı Soyadı** | : | [Adınız Soyadınız] | Fotoğraf |
| **Numarası / Mobil Telefon No** | : : | [Öğrenci No] / [Mobil Tel] | |
| **Yapılan Staj Türü** | : | Yazılım Stajı (Zorunlu) | |
| **Staj Tarihi** | : | 16/09/2026 - 27/10/2026 (30 İş Günü) | |

> **İşyeri staj sorumlusunun dikkatine!**  
> 30 iş günü olarak yapılacak olan bu stajda öğrenciler, stajları boyunca her gün aktivitelerini staj defterlerine işleyeceklerdir. Staj bitiminde işverenleri tarafından hazırlanan staj değerlendirmelerini staj defterleri ve raporları ile bölüme ileteceklerdir.

---

## 30 GÜNLÜK DETAYLI STAJ GÜNLÜĞÜ

### GÜN 1 : 16 EYLÜL 2026 — ÇARŞAMBA
**Yapılan İş / Konu:** Staj Oryantasyonu, Bilgisayar Kurulumları ve Proje Planlaması

**Günlük Faaliyetler:**
- Bugün stajımın ilk günüydü. Sabah kurumdaki staj sorumlum ve yazılım ekibiyle tanıştım. Şirketin çalışma ortamı, ofis kuralları ve projelerde kullandıkları Git versiyon kontrol sistemi hakkında bilgi aldım.
- Staj süresince geliştireceğim 'Liman Gemi Takip Sistemi' projesinin ihtiyaç listesini staj amirimle birlikte inceledik. Limana yanaşan gemilerin, taşınan yüklerin, seferlerin ve gemi personelinin takip edileceği bir web uygulaması yapmaya karar verdik.
- Geliştirme için kullanacağım bilgisayara gerekli yazılımları kurdum: .NET 8 SDK, Visual Studio Code, Node.js, SQL Server Express ve Azure Data Studio kurulumlarını tamamladım. Ortamın sorunsuz çalıştığını test ettim.

**Günün Çıktısı / Sonuç:** Geliştirme ortamı hazırlandı, projenin kapsamı ve temel modülleri netleştirildi.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 2 : 17 EYLÜL 2026 — PERŞEMBE
**Yapılan İş / Konu:** Veritabanı Tasarımı ve Tablo İlişkilerinin Çıkarılması

**Günlük Faaliyetler:**
- Bugün projenin veritabanı yapısını tasarlamaya başladım. Liman operasyonlarında nelerin takip edilmesi gerektiğini düşündüm ve 6 temel tablo belirledim: Ships (Gemiler), Ports (Limanlar), ShipVisits (Ziyaretler/Seferler), Cargoes (Yükler), CrewMembers (Mürettebat) ve ShipCrewAssignments (Görevlendirmeler).
- Tablolar arasındaki bağlantıları kurdum. Bir geminin birden fazla seferi ve yükü olabileceği için 1-N ilişkiler tanımladım. Bir denizcinin farklı zamanlarda farklı gemilerde görev alabilmesi için Mürettebat ve Gemi tabloları arasına ara bir atama tablosu ekledim.
- Veri bütünlüğünü sağlamak için kurallar koydum; gemiler için IMO numarasının benzersiz olması, limanlar için 5 haneli UN/LOCODE kodunun girilmesi ve yük ağırlıklarının sıfırdan büyük olması gerektiğini belirledim. Tasarladığım yapıyı ER diyagramı olarak çizdim.

**Günün Çıktısı / Sonuç:** İlişkisel veritabanı şeması ve veri bütünlüğü kuralları belirlendi.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 3 : 18 EYLÜL 2026 — CUMA
**Yapılan İş / Konu:** ASP.NET Core Web API Projesinin Açılması ve Entity Modellerinin Yazılması

**Günlük Faaliyetler:**
- Bugün projenin backend tarafını geliştirmeye başladım. Visual Studio terminalinden 'dotnet new webapi' komutuyla LimanGemiTakip.Api projesini oluşturdum.
- Kodların düzenli ve katmanlı olması için klasör yapısını planladım. Models, Data, Repositories, Services ve Controllers klasörlerini açtım.
- Dün tasarladığım veritabanı tablolarını C# sınıfları (Entity) olarak Models klasörü altında yazdım: Ship.cs, Port.cs, ShipVisit.cs, Cargo.cs, CrewMember.cs ve ShipCrewAssignment.cs.
- Entity Framework Core paketlerini projeye ekledim ve ApplicationDbContext sınıfını yazarak tüm modelleri DbSet olarak veritabanı bağlamına tanımladım.

**Günün Çıktısı / Sonuç:** Backend katmanlı mimarisi kuruldu ve entity sınıfları yazıldı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 4 : 21 EYLÜL 2026 — PAZARTESI
**Yapılan İş / Konu:** Entity Framework Core Migration ve Generic Repository Yapısı

**Günlük Faaliyetler:**
- Bugün ilk olarak appsettings.json dosyasına SQL Server bağlantı dizesini (Connection String) yazdım ve veritabanı bağlantısını sağladım.
- Entity Framework Core Code-First yaklaşımını kullanarak 'Add-Migration InitialCreate' komutu ile migration oluşturdum ve 'Update-Database' diyerek tabloları SQL Server'da fiziksel olarak ürettim.
- Veritabanı sorgularını servis katmanında tekrar tekrar yazmamak için Generic Repository desenini uyguladım. IRepository arayüzünü ve bu arayüzü uygulayan Repository sınıfını kodladım. Ekleme, silme, güncelleme, id'ye göre getirme ve listeleme metodlarını yazdım.
- Yazdığım bu generic repository yapısını Program.cs içerisinde AddScoped ile Dependency Injection servisi olarak sisteme tanıttım.

**Günün Çıktısı / Sonuç:** Veritabanı tabloları SQL Server'da oluşturuldu ve veri erişim katmanı hazırlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 5 : 22 EYLÜL 2026 — SALI
**Yapılan İş / Konu:** Gemi ve Liman Servisleri ile IMO Algoritmasının Kodlanması

**Günlük Faaliyetler:**
- Bugün iş mantığı katmanını geliştirmeye başladım. Gemi işlemleri için ShipService, liman işlemleri için PortService sınıflarını yazdım.
- Gemi kaydederken en kritik kural olan 7 haneli IMO numarasının doğruluğunu sağlayan algoritmayı araştırdım ve C# ile kodladım. Uluslararası kurala göre ilk 6 rakamın sırasıyla 7, 6, 5, 4, 3, 2 katsayılarıyla çarpılıp toplanması ve sonucun son basamağının 7. rakama eşit olması gerekiyordu. Bu kontrolü ekledim, kurala uymayan gemi numaralarında sistemin hata vermesini sağladım.
- Liman servisinde ise liman adının boş geçilememesi ve UN/LOCODE kodunun sistemde mükerrer olmaması kontrollerini yazdım.

**Günün Çıktısı / Sonuç:** Gemi ve liman servisleri uluslararası doğrulama algoritmalarıyla kodlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 6 : 23 EYLÜL 2026 — ÇARŞAMBA
**Yapılan İş / Konu:** Sefer Ziyaretleri ve Yük Servislerindeki Mantık Kontrolleri

**Günlük Faaliyetler:**
- Bugün gemi ziyaretleri ve kargo işlemlerinin servis katmanını yazdım: ShipVisitService ve CargoService.
- Gemi ziyaretlerinde sahada yaşanabilecek operasyonel hataları önlemek için kurallar koydum. Öncelikle geliş tarihinin ayrılış tarihinden önce olması gerektiğini kontrol ettim. İkinci olarak, aynı geminin aynı tarihlerde iki farklı limanda bulunmasını (çakışan sefer) engelleyen kontrolü yazdım. Ayrıca limanın kapasitesinden fazla gemi kabul etmesini engelledim.
- Kargo servisinde ise yük ağırlığının sıfırdan büyük olması gerektiğini ve gemiye yüklenen toplam yükün geminin taşıma kapasitesini (DWT) aşamayacağı kuralını doğruladım.

**Günün Çıktısı / Sonuç:** Çakışan sefer engelleme ve kapasite kontrol iş kuralları tamamlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 7 : 24 EYLÜL 2026 — PERŞEMBE
**Yapılan İş / Konu:** Mürettebat Servisi, Controller Katmanı ve Swagger API Testleri

**Günlük Faaliyetler:**
- Bugün mürettebat ve görev atamaları için CrewMemberService ve ShipCrewAssignmentService sınıflarını yazdım. Bir personelin aynı tarihte iki farklı gemiye atanamamasını sağladım.
- Tüm bu servisleri dış dünyaya açmak için Controllers klasöründe API uç noktalarını yazdım: ShipsController, PortsController, ShipVisitsController, CargoesController ve CrewMembersController.
- Tekrar eden CRUD kodlarını azaltmak için CrudControllerBase adında ortak bir taban controller geliştirdim.
- Swagger UI arayüzünü açarak yazdığım tüm GET, POST, PUT, DELETE metodlarına tarayıcı üzerinden test istekleri attım ve JSON yanıtlarını kontrol ettim.

**Günün Çıktısı / Sonuç:** RESTful API uç noktaları tamamlandı ve Swagger üzerinden test edildi.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 8 : 25 EYLÜL 2026 — CUMA
**Yapılan İş / Konu:** React + Vite Frontend Projesinin Kurulumu ve Arayüz Tasarımı

**Günlük Faaliyetler:**
- Bugün backend API'si hazır olan projenin arayüz tarafına başladım. Terminalden 'npm create vite@latest frontend -- --template react-ts' komutuyla React ve TypeScript projesi oluşturdum.
- Hızlı ve modern bir tasarım yapabilmek için TailwindCSS kütüphanesini kurdum. Denizcilik temasına uygun lacivert ve gri tonlarında bir renk paleti seçtim.
- Backend ile haberleşmek için Axios kütüphanesini kurdum ve src/services/api.ts dosyası altında API çağrılarını yönetecek merkezi yapıyı kurdum.
- Sayfaların ortak iskeleti için Layout bileşenini (üst menü ve sol navigasyon çubuğu), butonları, tabloları ve modal pencerelerini kodladım.

**Günün Çıktısı / Sonuç:** React 18 frontend projesi kuruldu ve temel UI bileşenleri hazırlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 9 : 28 EYLÜL 2026 — PAZARTESI
**Yapılan İş / Konu:** Frontend Sayfalarının Birleştirilmesi ve 1. Aşama Yönetici Demosu

**Günlük Faaliyetler:**
- Bugün gemi, liman, sefer, yük ve mürettebat listeleme ve ekleme sayfalarını tamamladım: ShipsPage.tsx, PortsPage.tsx, ShipVisitsPage.tsx, CargoPage.tsx ve CrewPage.tsx.
- Sayfalara arama kutusu ve silme/güncelleme işlemleri için açılır modal pencereleri bağladım. Formlardaki boş alan kontrollerini tamamladım.
- Backend tarafında yazdığım 75 birim testinin sorunsuz geçtiğini terminalden doğruladım.
- Öğleden sonra staj sorumluma projenin 1. aşama sunumunu yaptım. Tarayıcıdan gemi ekleme, liman atama ve sefer oluşturma adımlarını canlı olarak gösterdim. Ekip genel işleyişi beğendi ve 2. aşamaya geçmem için onay verdi.

**Günün Çıktısı / Sonuç:** 1. Aşama başarıyla tamamlandı ve canlı demo ile staj amirine sunuldu.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 10 : 29 EYLÜL 2026 — SALI
**Yapılan İş / Konu:** 2. Aşama: Büyük Veri Hacmi İçin Test Verisi Üretici (Data Seeder) Yazılması

**Günlük Faaliyetler:**
- Bugün stajın 2. aşamasına başladık. Konumuz: Entity Framework Core performans sorunları ve veri tutarlılığıydı. Staj amirim, sistemde binlerce gemi ve kayıt varken performansın nasıl etkilendiğini test etmemizi istedi.
- Gerçekçi test verisi üretebilmek için C# ile DataSeederService adında bir servis yazdım.
- Bu servis ile veritabanına algoritmik olarak 1.050 geçerli IMO'lu gemi, 120 liman, 5.100 sefer, 10.200 kargo ve 15.200 mürettebat ataması olmak üzere toplam yaklaşık 36 bin adet kayıt ürettim ve toplu olarak veritabanına bastım.

**Günün Çıktısı / Sonuç:** Sisteme 36.000'den fazla ilişkisel test verisi yüklendi.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 11 : 30 EYLÜL 2026 — ÇARŞAMBA
**Yapılan İş / Konu:** Entity Framework Core N+1 Sorgu Probleminin Çözümü

**Günlük Faaliyetler:**
- Bugün yüklediğimiz 36 bin veri ile listeleme ekranlarını çalıştırdığımızda ciddi bir yavaşlık fark ettim. SQL Server Profiler ve konsol loglarını açarak arka planda dönen SQL sorgularını inceledim.
- Gemi listesinde her bir geminin seferlerini döngü içerisinde çekerken 1 gemi sorgusu ardından 50 adet ek sorgu atıldığını gördüm. Bunun literatürde 'N+1 Query Problemi' olarak geçtiğini öğrendim.
- Bu sorunu çözmek için sorguları Eager Loading (.Include() ve .ThenInclude()) ile tek bir SQL JOIN sorgusuna dönüştürdüm. Ayrıca sadece listeleme yapılan yerlere AsNoTracking() ekledim.
- Yapılan iyileştirme sonucunda SQL sorgu sayısı 51'den 1'e düştü ve sayfa açılışı 15 kat hızlandı.

**Günün Çıktısı / Sonuç:** N+1 sorgu problemi çözüldü, veritabanı yanıt süresi ciddi oranda optimize edildi.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 12 : 01 EKIM 2026 — PERŞEMBE
**Yapılan İş / Konu:** Çok Adımlı Operasyonlarda Atomik Transaction Yönetimi (Rollback)

**Günlük Faaliyetler:**
- Bugün veritabanında veri tutarlılığı için Transaction yönetimini çalıştım. Bir gemi limana yanaştığında aynı anda sefer durumu güncelleniyor, yük manifestosu kaydediliyor ve personelin limana iniş izni işleniyor.
- Eğer bu 3 adımdan sonuncusunda bir hata oluşursa, ilk iki adımın veritabanında kalıp veri kirliliği yaratmaması gerekiyordu.
- IDbContextTransaction arayüzünü kullanarak BeginTransactionAsync, CommitAsync ve RollbackAsync bloklarını kodladım. İkinci adımda kasıtlı bir hata simüle ederek sistemin ilk adımı da güvenle geri aldığını (Rollback) birim test yazarak doğruladım.

**Günün Çıktısı / Sonuç:** Atomik transaction yapısı kuruldu ve kısmi veri kirliliği riski engellendi.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 13 : 02 EKIM 2026 — CUMA
**Yapılan İş / Konu:** Eş Zamanlı Güncelleme Çakışmaları (RowVersion) ve Soft Delete Mimarisi

**Günlük Faaliyetler:**
- Bugün iki kullanıcının aynı gemi veya sefer kaydını aynı anda güncellemesi durumunda birbirlerinin verisini ezmesi (Lost Update) sorununu engellemek için çalıştım.
- Ship modeline '[Timestamp] byte[] RowVersion' alanı ekledim. Böylece kayıt güncellenirken satır versiyonu uyuşmazsa EF Core'un DbUpdateConcurrencyException fırlatmasını ve API'nin kullanıcıya HTTP 409 Conflict dönmesini sağladım.
- Ayrıca sistemde yanlışlıkla silinen kayıtların fiziksel olarak kaybolmasını engellemek için BaseEntity sınıfına IsDeleted alanı ekledim. EF Core Global Query Filter tanımlayarak silinmiş kayıtların otomatik olarak filtrelenmesini sağladım.
- Yaptığımız tüm performans ve veri tutarlılığı çalışmalarını raporlayarak 2. aşamayı tamamladım.

**Günün Çıktısı / Sonuç:** Optimistic Locking ve Soft Delete altyapısı kurularak raporlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 14 : 05 EKIM 2026 — PAZARTESI
**Yapılan İş / Konu:** 3. Aşama: Web Güvenliği, OWASP Top 10 Analizi ve Yetki Denetimi (RBAC & IDOR)

**Günlük Faaliyetler:**
- Bugün stajın 3. aşaması olan siber güvenlik ve güvenli yazılım geliştirme çalışmalarına başladık. Staj amirimle OWASP Top 10 web güvenlik standartlarını inceledik.
- İlk olarak Broken Access Control zafiyetini inceledim. Normalde anonim erişilmemesi gereken liman bütçesi ve teftiş verilerine [Authorize(Roles = 'Admin,PortManager')] rol kısıtlaması getirdim.
- İkinci olarak IDOR açığını çalıştım. Bir liman müdürünün URL'deki portId parametresini değiştirerek başka bir limanın ticari seferlerini görmesini engelledim. Giriş yapan kullanıcının token'ındaki PortId claim'i ile talep edilen limanı karşılaştıran kontrolü yazdım.

**Günün Çıktısı / Sonuç:** Rol tabanlı yetkilendirme (RBAC) ve IDOR koruma mekanizmaları uygulandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 15 : 06 EKIM 2026 — SALI
**Yapılan İş / Konu:** SQL Injection ve XSS Açıklarının İncelenmesi ve Çözülmesi

**Günlük Faaliyetler:**
- Bugün arama kutularındaki SQL Injection riskini inceledim. Gemi adına göre arama yaparken string birleştirme ile yazılan sorguların "' OR '1'='1" gibi girdilerle manipüle edilebildiğini gördüm.
- Bu açığı gidermek için dinamik SQL yerine EF Core'un parametreli LINQ sorgularını (s.Name.Contains(term)) kullandım. SQL Server'ın bu sorguyu parametre olarak çalıştırdığını doğruladım.
- Daha sonra XSS (Cross-Site Scripting) açığını çalıştım. Gemi açıklama alanına girilen zararlı '<script>' etiketlerinin sayfada çalışmasını engellemek için WebUtility.HtmlEncode ve regex tabanlı temizleme (sanitization) kodlarını backend'e ekledim.

**Günün Çıktısı / Sonuç:** Parametreli SQL sorgusu ve XSS temizleme kontrolleri kodlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 16 : 07 EKIM 2026 — ÇARŞAMBA
**Yapılan İş / Konu:** Hassas Bilgi Sızıntısı ve Mass Assignment (Fazla Veri Atama) Önleme

**Günlük Faaliyetler:**
- Bugün mürettebat listesi çekilirken personelin TC kimlik numarası, açık telefon ve e-posta adreslerinin gereksiz yere dışarı sızdığını fark ettik.
- Bunu çözmek için katmanlı DTO mimarisi kurdum: Normal operatörlere telefon ve mailleri maskeli gösteren CrewMaskedDto (+90 532 *** ** 33), sadece Admin rolüne açık CrewConfidentialDto yazdım.
- Kullanıcı kayıt ekranında ise Mass Assignment açığını kapattım. Kullanıcı kaydolurken JSON gövdesine 'Role: Admin' yazsa bile sistemin bunu kabul etmemesi için katı CreateUserRequest DTO'su hazırladım ve rol atamasını sunucu tarafında Viewer olarak sabitledim.

**Günün Çıktısı / Sonuç:** Hassas veri maskeleme DTO'ları ve güvenli model bağlama yapısı kuruldu.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 17 : 08 EKIM 2026 — PERŞEMBE
**Yapılan İş / Konu:** Güvenli Kimlik Doğrulama (JWT & Refresh Token Rotasyonu) ve Hız Sınırı (Rate Limit)

**Günlük Faaliyetler:**
- Bugün oturum yönetimini kurumsal güvenlik standartlarına taşıdım. Önceden kullanılan uzun ömürlü token'lar yerine 15 dakikalık kısa ömürlü Access Token yapısına geçtim.
- Kullanıcının sürekli şifre girmemesi için 64-byte kriptografik rastgele Refresh Token üreten yapıyı kodladım. Her yenilemede eski refresh token'ı geçersiz kılan rotasyon mekanizmasını yazdım.
- Ayrıca kullanıcı şifrelerini güvenli saklamak için PBKDF2 hash algoritmasının iterasyon sayısını OWASP önerisi doğrultusunda 600.000'e yükselttim.
- Sistemi kitlemeye yönelik DoS saldırılarını engellemek için ASP.NET Core RateLimiter middleware'ini entegre ettim; IP başına dakikada maksimum 120 istek kotası koydum.

**Günün Çıktısı / Sonuç:** Refresh token rotasyonlu kimlik doğrulama ve API hız sınırlama sistemi kuruldu.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 18 : 09 EKIM 2026 — CUMA
**Yapılan İş / Konu:** Güvenli Dosya Yükleme, Audit Logging ve Canlı Güvenlik Laboratuvarı

**Günlük Faaliyetler:**
- Bugün gemi evrak yükleme ekranındaki açıkları kapattım. Sisteme çalıştırılabilir zararlı dosyaların (.exe, .bat, .php) yüklenmesini engellemek için uzantı beyaz listesi (.pdf, .png, .jpg) ve 5 MB boyut sınırı koydum. Dosya adlarını GUID ile rastgele değiştirerek sunucu içi dosya yollarının kurcalanmasını (Path Traversal) engelledim.
- Veritabanında merkezi bir AuditLog tablosu oluşturup tüm şüpheli güvenlik olaylarını (engellenen IDOR, SQLi denemesi, hız aşımı) kayıt altına aldım.
- Frontend tarafında 10 farklı OWASP senaryosunun açık ve güvenli hallerini canlı butonlarla test edebildiğimiz bir Güvenlik Laboratuvarı sayfası (SecurityLabPage.tsx) kodladım.

**Günün Çıktısı / Sonuç:** Güvenli dosya yükleme, denetim günlüğü ve interaktif Güvenlik Laboratuvarı tamamlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 19 : 12 EKIM 2026 — PAZARTESI
**Yapılan İş / Konu:** Akıllı Sefer Planlama Sihirbazı ve Safe Manning (Güvenli Donatım) Kuralları

**Günlük Faaliyetler:**
- Bugün sisteme sektörel açıdan çok önemli bir özellik olan Akıllı Sefer Planlama Sihirbazını eklemeye başladım.
- Denizcilik kurallarına (IMO Safe Manning) göre bir geminin denize açılabilmesi için gemi tipine uygun zorunlu personelin (Kaptan, Başmühendis, Güverte Zabiti) atanmış olması gerekiyordu. Bu kuralları doğrulayan kural motorunu yazdım.
- Kullanıcı sefer başlatmak istediğinde, seçilen tarihlerde limanda boşta olan gemileri ve dinlenme süresi uygun olan personeli listeleyen GetAvailableShips ve GetAvailableCrew servis metodlarını kodladım.

**Günün Çıktısı / Sonuç:** Uluslararası asgari güvenli personel donatım motoru geliştirildi.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 20 : 13 EKIM 2026 — SALI
**Yapılan İş / Konu:** Canlı Deniz Haritası (Live Map) ve Gerçek Rota Koordinatlarının Eklenmesi

**Günlük Faaliyetler:**
- Bugün harita entegrasyonu üzerine çalıştım. Açık kaynaklı Leaflet.js harita kütüphanesini React projesine dahil ettim.
- Türkiye'nin ana limanlarının (Ambarlı, Mersin, İzmir, Haydarpaşa, İskenderun vb.) gerçek enlem ve boylam koordinatlarını sisteme tanımladım.
- Gemilerin karadan geçmesini önlemek için Türk Boğazları (İstanbul ve Çanakkale Boğazı) geçiş koridorlarını ve Ege/Akdeniz gerçek deniz rotalarını içeren waypoint koordinat dizilerini kodladım.
- Gemilerin anlık durumlarına göre (limanda bağlı, seyir halinde, planlandı) harita üzerinde hareketli ikonlarla gösterilmesini sağladım.

**Günün Çıktısı / Sonuç:** Leaflet.js tabanlı canlı gemi takip haritası ve gerçek deniz rotaları entegre edildi.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 21 : 14 EKIM 2026 — ÇARŞAMBA
**Yapılan İş / Konu:** Frontend Performans İyileştirmeleri, Kod Bölme ve Hook Optimizasyonları

**Günlük Faaliyetler:**
- Bugün canlı harita sayfasının performansını optimize ettim. Harita rota koordinatları çok fazla satır tuttuğu için LiveMapPage.tsx dosyasını modüler hale getirdim; verileri maritimeRoutes.ts ve portCoords.ts dosyalarına ayırdım.
- Sayfa içindeki gemi filtreleme ve harita konumu hesaplama işlemlerinin her tıklamada gereksiz yere baştan çalışmasını önlemek için React'ın useMemo ve useCallback kancalarını kullandım.
- Ayrıca harita sayfası ağır bir kütüphane içerdiği için React.lazy() ve Suspense kullanarak sayfanın sadece tıklandığında yüklenmesini sağladım (Code Splitting). İlk sayfa yüklenme hızı hissedilir derecede arttı.

**Günün Çıktısı / Sonuç:** Arayüz render optimizasyonu ve kod bölme (code splitting) tamamlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 22 : 15 EKIM 2026 — PERŞEMBE
**Yapılan İş / Konu:** Kargo Yönetimi Mantık Düzenlemeleri ve Liman Kontrolleri

**Günlük Faaliyetler:**
- Bugün kargo/yük sayfasında kullanıcılardan gelen geri bildirimleri inceledim. Seferde (denizde) olan bir gemiye yeni yük yüklenemeyeceği için önemli bir mantık düzeltmesi yaptım.
- Yük ekleme formunda gemi seçimi yaparken yalnızca o anda limanda bağlı ('Docked') olan gemilerin listelenmesini sağladım. Seyir halindeki gemileri seçimden çıkardım.
- Kargo tablosuna arama kutusu ekledim ve kargo detaylarına konşimento numarası, konteyner mühür numarası (Seal Number) ve alıcı firma alanlarını ekleyerek ekranı tamamladım.

**Günün Çıktısı / Sonuç:** Kargo modülündeki iş mantığı hataları giderildi ve operasyonel alanlar eklendi.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 23 : 16 EKIM 2026 — CUMA
**Yapılan İş / Konu:** Raporlama Modülü, İstatistik Göstergeleri ve CSV Dışa Aktarımı

**Günlük Faaliyetler:**
- Bugün yönetimsel raporlama ekranı üzerine çalıştım. Backend tarafında ReportsController oluşturarak limanların doluluk oranlarını, aylık taşınan yük tonajlarını ve gemi tipi dağılımlarını hesaplayan sorgular yazdım.
- Frontend tarafında ReportsPage.tsx sayfasını tasarladım; en yoğun limanları ve filo durumunu özetleyen KPI kartları ekledim.
- Kullanıcıların bu verileri bilgisayarlarına indirebilmesi için tablolardaki verileri CSV formatına dönüştürüp indiren yardımcı fonksiyonu kodladım.

**Günün Çıktısı / Sonuç:** Yönetim raporlama paneli ve CSV veri dışa aktarım özelliği tamamlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 24 : 19 EKIM 2026 — PAZARTESI
**Yapılan İş / Konu:** Kurumsal Güvenlik Sıkılaştırması: API Okuma Uç Noktalarının Kilitlenmesi

**Günlük Faaliyetler:**
- Bugün staj sorumlumla projenin genel bir güvenlik denetimini yaptık. Önceden sadece yazma (POST/PUT/DELETE) işlemlerini korumaya aldığımızı, bazı veri listeleme uç noktalarının (GET) ise token istemediğini tespit ettik.
- Bu durumu düzeltmek için CrudControllerBase taban sınıfındaki GetAll, GetPaged ve GetById metodlarına [Authorize] ekleyerek gemi, liman, sefer, kargo ve mürettebat verilerini anonim okumaya tamamen kapattım.
- Ayrıca AuditLogsController'ı sadece Admin ve PortManager rollerine kısıtladım. DataSeedController içerisindeki test verisi oluşturma ve sıfırlama işlemlerini ise sadece Admin rolüne bağlayıp canlı ortamda çalışmasını engelledim.

**Günün Çıktısı / Sonuç:** Tüm operasyonel veri okuma uç noktaları yetkilendirme altına alındı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 25 : 20 EKIM 2026 — SALI
**Yapılan İş / Konu:** JWT Anahtarının Güvenli Yapılandırılması ve Ortam İzolasyonu

**Günlük Faaliyetler:**
- Bugün konfigürasyon dosyalarındaki güvenlik açıklarını kapattım. appsettings.json içerisinde açıkta duran JWT gizli imzalama anahtarını sildim; anahtarın ortam değişkenlerinden (Environment Variable) okunmasını zorunlu kıldım.
- Program.cs ve AuthService içerisindeki yedek fallback anahtarları kaldırdım; eğer JWT anahtarı girilmemişse sistemin sessizce güvensiz açılmasını önleyip açıklayıcı bir hata fırlatmasını (Fail-Safe) sağladım.
- DbInitializer sınıfını güncelleyerek varsayılan test kullanıcılarının (admin, operator vb.) sadece Development ortamında oluşturulmasını sağladım. Canlı ortamda ise güvenli ilk kurulum parametresi getirdim. Kasıtlı açık barındıran güvenlik demosu uç noktalarını Production ortamında 403 Forbidden ile kapattım.

**Günün Çıktısı / Sonuç:** Güvenli anahtar yönetimi ve canlı ortam izolasyonu tamamlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 26 : 21 EKIM 2026 — ÇARŞAMBA
**Yapılan İş / Konu:** Yetkilendirme ve Güvenlik Birim Testlerinin Yazılması (144 Test)

**Günlük Faaliyetler:**
- Bugün eklediğimiz güvenlik ve yetkilendirme kurallarının doğruluğunu kanıtlamak için test projesini genişlettim.
- RoleAuthorizationTests.cs sınıfını yazarak tüm controller'lardaki GET ve yönetim uç noktalarının gerçekten [Authorize] isteyip istemediğini reflection ile test eden 20 yeni birim testi yazdım.
- SecurityScenariosTests içerisine canlı ortamda açık uç noktaların 403 Forbidden verdiğini doğrulayan testi, AuthServiceTests içerisine ise eksik JWT anahtarı durumunda sistemin güvenle durduğunu teyit eden testi ekledim.
- Terminalden 'dotnet test' çalıştırarak projedeki toplam 144 birim testinin tamamının (%100 başarıyla) yeşil yandığını gördüm.

**Günün Çıktısı / Sonuç:** Birim test sayısı 144'e çıkarıldı ve tüm senaryolar başarıyla doğrulandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 27 : 22 EKIM 2026 — PERŞEMBE
**Yapılan İş / Konu:** Kullanıcı Deneyimi İyileştirmeleri, Form Hataları ve Yükleme Efektleri

**Günlük Faaliyetler:**
- Bugün frontend arayüzündeki kullanıcı deneyimi detaylarını elden geçirdim. Formlarda eksik veya hatalı bilgi girildiğinde kullanıcıya gösterilen kırmızı uyarı mesajlarını sade ve anlaşılır hale getirdim.
- Sayfalara girildiğinde API'den veri gelene kadar boş beyaz ekran görünmemesi için tablo ve kartların yerine iskelet yükleyiciler (Skeleton Loaders) ekledim.
- Masaüstü ve dizüstü ekranların yanı sıra tablet çözünürlükleri için de Tailwind responsive sınıflarını kontrol ettim.
- Frontend klasöründe 'npm run build' çalıştırarak TypeScript derleme hatası olmadığını doğruladım.

**Günün Çıktısı / Sonuç:** Arayüz kullanıcı deneyimi, yükleme efektleri ve form kontrolleri tamamlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 28 : 23 EKIM 2026 — CUMA
**Yapılan İş / Konu:** Tarayıcı Testleri, Kod Temizliği ve Çalışma Alanı Senkronizasyonu

**Günlük Faaliyetler:**
- Bugün uygulamayı farklı web tarayıcılarında (Google Chrome, Microsoft Edge, Mozilla Firefox) test ettim. Canlı harita, modal pencereler ve formların tüm tarayıcılarda sorunsuz çalıştığını kontrol ettim.
- C# ve TypeScript kodlarındaki gereksiz using/import satırlarını ve kullanılmayan değişkenleri temizledim (Code Cleanup).
- Masaüstündeki çalışma kopyası ile ana proje dizini arasındaki dosyaları eşitleyen PowerShell betiğini çalıştırdım ve iki tarafın da güncel olduğunu teyit ettim.

**Günün Çıktısı / Sonuç:** Çapraz tarayıcı uyumluluğu sağlandı, kodlar temizlendi ve eşitlendi.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 29 : 26 EKIM 2026 — PAZARTESI
**Yapılan İş / Konu:** Proje Dokümantasyonu, Güvenlik Raporu ve Demo Hazırlığı

**Günlük Faaliyetler:**
- Bugün stajın son günlerine yaklaşırken teknik dokümantasyonları tamamladım.
- Projenin ana README.md dosyasını güncelledim; sistem mimarisini, veritabanı kurulum adımlarını, test çalıştırma komutlarını ve varsayılan kullanıcı rollerini adım adım yazdım.
- Staj boyunca uyguladığımız 10 güvenlik senaryosunu, kurumsal sıkılaştırmaları ve 144 birim testinin sonuçlarını içeren OWASP_Guvenli_Yazilim_Gelistirme_Raporu.md dosyasını güncelledim.
- Sistemi tek tıkla ayağa kaldıran baslat.bat betiğini deneyerek yarınki nihai sunum için hazırlıklarımı tamamladım.

**Günün Çıktısı / Sonuç:** Proje dokümantasyonu tamamlandı ve nihai sunum provası yapıldı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

### GÜN 30 : 27 EKIM 2026 — SALI
**Yapılan İş / Konu:** Staj Sonu Proje Savunması, Canlı Demo ve Stajın Tamamlanması

**Günlük Faaliyetler:**
- Bugün stajımın son günüydü. Sabah kurumdaki staj sorumluma ve yazılım ekibine 'Liman Gemi Takip Sistemi' projesinin baştan sona canlı demosuyla sunumunu yaptım.
- Gemi, liman, sefer ve yük CRUD ekranlarını gösterdim. Akıllı sefer planlama sihirbazını çalıştırarak güvenli personel donatım kuralının nasıl çalıştığını sergiledim. Canlı deniz haritası üzerinde gemilerin rotalarını ve hızlarını gösterdim.
- Güvenlik laboratuvarında açıkları ve savunma mekanizmalarını canlı olarak test ettim. Terminalden 144 birim testini çalıştırarak tüm testlerin başarılı olduğunu gösterdim.
- Ekip yaptığım çalışmayı çok başarılı buldu. Staj sorumlumla staj değerlendirme görüşmesini yaptık, staj defterimi ve staj evraklarımı teslim ederek stajımı başarıyla tamamladım.

**Günün Çıktısı / Sonuç:** Proje canlı demosu başarıyla sunuldu, staj defteri onaylandı ve staj tamamlandı.
**Öğrenci İmzası:** ___________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **İşyeri Staj Sorumlusu İmzası:** ___________________

---

## STAJ ÇALIŞMASININ GENEL DEĞERLENDİRMESİ VE SONUÇ

16 Eylül 2026 – 27 Ekim 2026 tarihleri arasında 30 iş günü boyunca gerçekleştirdiğim bu staj çalışmasında, liman operasyonlarını dijitalleştiren ve yöneten 'Liman Gemi Takip Sistemi' web uygulamasını geliştirdim.

Staj süresince okulda teorik olarak öğrendiğim nesne yönelimli programlama, ilişkisel veritabanı tasarımı, katmanlı mimari ve web teknolojilerini gerçek bir projede uygulama fırsatı buldum. Backend tarafında .NET 8 Web API, Entity Framework Core ve SQL Server kullanarak iş kurallarını ve veri yönetimini kodladım. Frontend tarafında ise React, TypeScript ve TailwindCSS kullanarak kullanıcı dostu arayüzler ve canlı takip haritası geliştirdim.

Ayrıca büyük veri hacimlerinde ortaya çıkan N+1 sorgu problemlerini optimize etmeyi, veritabanı transaction yönetimini, eş zamanlı veri çakışmalarını önlemeyi ve OWASP Top 10 standartlarına göre web uygulamalarının nasıl korunacağını bizzat kodlayarak deneyimledim. Projeyi 144 birim testi ile doğrulayarak kaliteli ve sürdürülebilir bir yazılım haline getirdim.

Bu staj süreci, bir yazılım geliştiricinin ekip içerisindeki işleyişini, kurumsal kodlama standartlarını ve problem çözme disiplinini kazanmam açısından son derece verimli ve öğretici geçmiştir.

---

### ONAY BÖLÜMÜ

| Öğrenci Adı Soyadı | Tarih | İmza |
| :--- | :--- | :--- |
| [Adınız Soyadınız] | 27/10/2026 | ___________________ |

| İşyeri Staj Amiri / Yetkili Adı | Ünvanı | Tarih | Kaşe & İmza |
| :--- | :--- | :--- | :--- |
| [Staj Amiri Adı] | Yazılım Takım Lideri / Mühendislik Yöneticisi | 27/10/2026 | ___________________ |
