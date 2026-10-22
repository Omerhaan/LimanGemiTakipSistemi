# Staj Çalışması 3. Adım: Güvenlik ve OWASP Top 10 Sunum Rehberi

**Sunum Süresi:** 10 - 15 Dakika  
**Hedef Kitle:** Staj Değerlendirme Komisyonu / Jüri / Proje Yöneticisi  
**Amaç:** Liman Gemi Takip Sistemi üzerinde modellenen 10 OWASP güvenlik açığını ve uygulanan mühendislik çözümlerini canlı olarak sunmak.

---

## ⏱️ Zaman Yönetimi ve Sunum Akışı

| Süre | Bölüm | Ne Anlatılacak? | Hangi Ekran Gösterilecek? |
| :---: | :--- | :--- | :--- |
| **00:00 - 02:00** | **Giriş & Tehdit Analizi** | Denizcilikte siber güvenliğin önemi, stratejik liman verileri | Slayt / Genel Bakış Ekranı |
| **02:00 - 05:00** | **En Kritik Zafiyetler (SQLi & XSS)** | Dinamik SQL tehlikesi vs Parametreli LINQ, HTML Sanitization | Güvenlik Lab → Senaryo 3 & 9 |
| **05:00 - 08:00** | **Erişim & Kimlik (Access Control & IDOR)** | RBAC, IDOR liman yetki ayrımı, Refresh Token rotasyonu | Güvenlik Lab → Senaryo 1, 2 & 6 |
| **08:00 - 10:00** | **Veri Koruma & Dayanıklılık** | Hassas veri maskeleme, Mass assignment engeli, DoS/Rate limiting | Güvenlik Lab → Senaryo 4, 5 & 10 |
| **10:00 - 12:00** | **Güvenlik Denetim Günlüğü (Audit Log)** | Başarısız oturum, IDOR ve SQLi denemelerinin canlı log akışı | Güvenlik Lab → Denetim Günlüğü Sekmesi |
| **12:00 - 14:00** | **Birim Testler & Kod Kalitesi** | 119 birim testin terminalde %100 başarıyla çalıştırılması | Terminal (`dotnet test`) |
| **14:00 - 15:00** | **Kapanış & Soru - Cevap** | OWASP Top 10 kazanımları ve sonuç özeti | Jüri Soruları |

---

## 🎬 Adım Adım Canlı Demo Rehberi

### Adım 1: Güvenlik Laboratuvarını Açma
1. Menüden **"Güvenlik Lab (OWASP)"** seçeneğine tıkla.
2. Jüriye söyle:
   > *"Hocam, şartnamede istenen 'Açığı oluşturun, nasıl çalıştığını gösterin ve ardından giderin' prensibini canlı ispatlamak amacıyla sistemimize interaktif bir Güvenlik Laboratuvarı entegre ettik. Her senaryo için hem açık (Vulnerable) hem de güvenli (Secure) uç noktalarımız hazır."*

### Adım 2: SQL Injection Canlı Demosu (Senaryo 3)
1. Sol menüden **"3. SQL Injection"** senaryosunu seç.
2. Payload kutusunda `' OR '1'='1` yazdığını göster.
3. Kırmızı **"Açık Hali Test Et"** butonuna bas.
   > *"Gördüğünüz gibi, ham string birleştirmeli SQL sorgusunda filtre bypass oldu ve tüm filodaki gemiler yetkisiz şekilde döküldü."*
4. Yeşil **"Güvenli Hali Test Et"** butonuna bas.
   > *"Güvenli sürümde ise Entity Framework Core parametreli LINQ sorgusu çalıştı. Girdi bir komut değil metin parametresi (@p0) olarak arandı ve enjeksiyon kesin olarak engellendi."*

### Adım 3: IDOR Canlı Demosu (Senaryo 2)
1. Sol menüden **"2. IDOR"** senaryosunu seç.
2. Kırmızı butona bas: Başka limanın verilerinin kontrolsüzce çekildiğini göster.
3. Yeşil butona bas: Sistem `HTTP 403 FORBIDDEN` döndürecek ve Audit Log'a `CRITICAL` seviyeli alarm kaydedecek.
   > *"Kullanıcının JWT claim'indeki PortId ile talep edilen kaynak eşleşmediği için erişim engellendi ve saldırı güvenlik günlüğüne işlendi."*

### Adım 4: XSS ve Güvensiz Dosya Yükleme (Senaryo 8 & 9)
1. **"8. Güvensiz Dosya Yükleme"** seç: `.exe` / `.php` Web Shell yükleme denemesinin beyaz liste (.pdf, .png), 5MB sınır ve rastgele GUID isimlendirme ile nasıl engellendiğini göster.
2. **"9. Cross-Site Scripting"** seç: `<script>alert('XSS')</script>` kodunun `WebUtility.HtmlEncode` ile zararsız metne dönüştürüldüğünü göster.

### Adım 5: Denetim Günlüğü (Audit Log - Bonus 3)
1. Üstteki **"Denetim Günlüğü (Audit Log)"** sekmesine geç.
2. **"Güvenlik Olayı Simüle Et"** butonuna tıkla.
3. Listeye anında yeni bir `UNAUTHORIZED_ACCESS_ATTEMPT` logunun IP adresi ve zaman damgasıyla düştüğünü göster.

### Adım 6: Birim Testlerin Gösterimi
1. Terminale geç ve komutu çalıştır:
   ```bash
   cd backend/LimanGemiTakip.Tests
   dotnet test
   ```
2. **119 testin tamamının yeşil yandığını** ve `SecurityScenariosTests` sınıfının tüm açıkları otomatik doğruladığını göster.

---

## ❓ Jüri / Hoca Sorularına Hazırlık

**Soru 1: "JWT Token çalınırsa ne yapıyorsunuz?"**
* **Cevap:** *"Hocam, Access Token ömrünü 15 dakika gibi kısa bir süreye çektik. Oturumun devamı için veritabanında saklanan tek kullanımlık Refresh Token kullanıyoruz. Kullanıcı Logout yaptığında veya şüpheli hareket görüldüğünde Refresh Token sunucu tarafında kalıcı olarak iptal ediliyor (Revocation)."*

**Soru 2: "IDOR açığını nasıl engellediniz?"**
* **Cevap:** *"Yalnızca URL'deki ID'ye güvenmedik. Giriş yapan kullanıcının JWT Claim'lerinde saklanan liman yetkisini (`PortId`) ve rolünü servis katmanında çapraz kontrol ettik. Eşleşmeyen istekleri 403 Forbidden ile kesip CRITICAL Audit Log düşüyoruz."*

**Soru 3: "DoS saldırılarına karşı ne önlem aldınız?"**
* **Cevap:** *"İki aşamalı koruma kurduk: Birincisi, `pageSize` parametresine kod tarafında `Math.Min(size, 100)` tavan sınırı koyduk. İkincisi, ASP.NET Core `RateLimiter` middleware ile IP başına istek sınırlaması uyguladık; aşırı isteklerde HTTP 429 Too Many Requests dönüyor."*
