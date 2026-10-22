# Staj Çalışması 3. Adım: Güvenli Yazılım Geliştirme ve OWASP Top 10 Eylem Planı

Bu plan, **Liman Gemi Takip Sistemi** üzerinde modern web güvenliği açıklarının (OWASP Top 10) bilinçli olarak modellenmesi, analiz edilmesi, giderilmesi ve canlı laboratuvar ortamında sunulması için hazırlanmıştır.

---

## 🎯 Proje Hedefleri ve Mimari Yaklaşım

Projenin amacı yalnızca güvenli kod yazmak değil; **açığın nasıl oluştuğunu**, **saldırganın bunu nasıl sömürdüğünü (exploit)**, **kurum için riskini** ve **mühendislik çözümünü** hem kodla hem canlı arayüzle ispatlamaktır.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     GÜVENLİK LABORATUVARI (SECURITY LAB)                 │
│        (Frontend UI: Açık Simülasyonu, Canlı Test, Önce/Sonra Kıyas)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 HTTP / REST API (ASP.NET Core Web API)
                                     │
 ┌───────────────────────────────────┴───────────────────────────────────┐
 │                       GÜVENLİK VE YETKİ KATMANI                       │
 │  • GlobalExceptionMiddleware (Stack trace gizleme, güvenli hata)       │
 │  • Rate Limiting (DoS koruması, IP başına kota)                       │
 │  • JWT Access (15 dk) + Refresh Token Rotasyonu + Revocation (Logout) │
 │  • Role & Claim Based Access Control (Admin, PortManager, Operator)   │
 │  • Content Security Policy & Security Headers                          │
 │  • Input Sanitization (Anti-XSS & Anti-Path Traversal)                │
 └───────────────────────────────────┬───────────────────────────────────┘
                                     │
 ┌───────────────────────────────────┴───────────────────────────────────┐
 │                     SERVİS & DTO PROJEKSİYON KATMANI                  │
 │  • IDOR Koruması (Port & Ownership bazlı erişim denetimi)             │
 │  • Mass Assignment Önleme (CreateShipRequest, UserDto)                │
 │  • Hassas Veri Koruması (CrewListDto maskeleme vs CrewAdminDto)       │
 │  • Güvenli Evrak / Dosya Yükleme (MIME Sniffing, GUID, Boyut kontrol) │
 │  • Audit Logging Servisi (Login, Logout, C-U-D log kaydı)             │
 └───────────────────────────────────┬───────────────────────────────────┘
                                     │
 ┌───────────────────────────────────┴───────────────────────────────────┐
 │                   VERİ ERİŞİM (EF CORE 8.0 & SQL SERVER)              │
 │  • Parametreli LINQ Sorguları (SQL Injection Koruması)                │
 │  • AuditLogs Tablosu (IP, Kullanıcı, Tarih, Eylem, Detay)             │
 │  • Soft Delete & Concurrency Koruması (Adım 2 ile tam entegre)        │
 └───────────────────────────────────────────────────────────────────────┘
```

---

## 📋 10 Güvenlik Senaryosunun Uygulama Detayları

### Senaryo 1: Broken Access Control (Rol & Yetki İhlali)
* **Açık Hali:** `/api/security-demo/access-control/vulnerable` → Yetkisiz herhangi biri tüm hassas gemi/liman operasyonlarını görüntüleyebilir ve değiştirebilir.
* **Güvenli Çözüm:** 
  - `Admin`, `PortManager`, `Operator`, `Viewer` rolleri.
  - `[Authorize(Roles = "...")]` ve Claim tabanlı yetkilendirme.
  - Yetkisiz erişim denemelerinde HTTP `401 Unauthorized` veya `403 Forbidden` yanıtı.

### Senaryo 2: IDOR (Insecure Direct Object Reference)
* **Açık Hali:** `/api/security-demo/idor/vulnerable/crew/{id}` → Kullanıcı URL'deki ID'yi değiştirerek başka limanın veya başka geminin personeline sınırsızca erişebilir.
* **Güvenli Çözüm:**
  - Servis katmanında `ClaimsPrincipal` üzerinden kullanıcının yetkili olduğu liman veya kayıt sahipliği doğrulaması.
  - Eğer `PortManager` ise sadece kendi limanındaki gemi/ziyaret/personel kayıtlarını görebilir. Farklı liman ID'si istendiğinde HTTP `403 Forbidden` döner.

### Senaryo 3: SQL Injection (SQLi)
* **Açık Hali:** `/api/security-demo/sqli/vulnerable?searchTerm=' OR '1'='1` → Ham string birleştirme ile dinamik SQL (`FromSqlRaw($"SELECT * FROM Ships WHERE Name = '{name}'")`) çalıştırılarak filtrenin bypass edilmesi.
* **Güvenli Çözüm:**
  - Entity Framework Core parametreli LINQ sorgusu (`_context.Ships.Where(s => s.Name.Contains(name))`) veya parametreli SQL (`FromSqlInterpolated`).
  - Girdi doğrulama ve SQL Injection patern denetimi.

### Senaryo 4: Hassas Bilgi Sızıntısı (Sensitive Data Exposure)
* **Açık Hali:** Genel listede tüm denizcilerin T.C. Kimlik numarası, açık telefonları ve e-postaları herkese dönülür.
* **Güvenli Çözüm:**
  - Katmanlı DTO mimarisi:
    - `CrewPublicListDto`: Yalnızca Ad, Soyad, Unvan, Milliyet.
    - `CrewOperatorDto`: Maskelenmiş telefon (`+90 532 *** ** 01`) ve e-posta.
    - `CrewAdminDto`: Yalnızca Sistem Yöneticisi için tam iletişim ve sertifika bilgisi.

### Senaryo 5: Mass Assignment (Aşırı Atama / Over-Posting)
* **Açık Hali:** API doğrudan Entity nesnesini kabul eder (`CreateShip(Ship ship)` veya `Register(User user)`). Saldırgan JSON gövdesine `IsAdmin: true`, `IsDeleted: false`, `RowVersion` gibi alanlar ekleyerek yetki yükseltebilir.
* **Güvenli Çözüm:**
  - Katı Request modelleri (`CreateShipRequest`, `UpdateShipRequest`, `RegisterUserRequest`).
  - Yalnızca değiştirilebilir alanlar DTO'da yer alır, kritik alanlar sunucu tarafında iş mantığı ile atanır.

### Senaryo 6: Broken Authentication (Zayıf Kimlik Doğrulama)
* **Açık Hali:** Sonsuz/çok uzun ömürlü token (30 gün), güvensiz fallback secret key, logout olunduğunda token'ın sunucuda iptal edilememesi.
* **Güvenli Çözüm:**
  - Kısa ömürlü Access Token (15 dakika).
  - Veritabanında saklanan, süresi dolabilen ve rotasyonlu **Refresh Token** mekanizması (`/api/auth/refresh-token`).
  - `/api/auth/logout` endpoint'i ile Refresh Token'ın veritabanından kalıcı iptali (Revocation).

### Senaryo 7: Güvensiz Hata Yönetimi (Improper Error Handling)
* **Açık Hali:** Hata oluştuğunda istemciye SQL sorgusu, Stack Trace, dosya yolu ve Connection String fırlatılır.
* **Güvenli Çözüm:**
  - Özel `GlobalExceptionMiddleware` geliştirilmesi.
  - İstemciye yalnızca standart ve güvenli JSON: `{ "message": "İşlem sırasında beklenmeyen bir hata oluştu.", "traceId": "...", "statusCode": 500 }`.
  - Hatanın tam detaylarının (Stack Trace, iç hatalar) yalnızca sunucu içi loglara (ILogger/Serilog) yazılması.

### Senaryo 8: Güvensiz Dosya Yükleme (Unrestricted File Upload)
* **Açık Hali:** Gemi evrak yükleme ekranına uzantı, boyut ve içerik kontrolü yapılmadan `.exe`, `.php`, `.sh` yüklenebilmesi, orijinal adla kaydedilmesi (Path Traversal riski).
* **Güvenli Çözüm:**
  - Dosya türü beyaz listesi (yalnızca `.pdf`, `.png`, `.jpg`, `.jpeg`).
  - Dosya boyutu sınırı (maksimum 5 MB).
  - Güvenlik kontrolü (Magic Bytes / Header MIME sniffing).
  - Rastgele GUID ile güvenli dizinde saklama (`uploads/documents/{guid}.pdf`), orijinal dosya adının doğrudan dosya sistemine yazılmaması.

### Senaryo 9: Cross-Site Scripting (XSS)
* **Açık Hali:** Gemi açıklaması veya ziyaret notuna `<script>alert('XSS Saldırısı!')</script>` girilmesi ve arayüzde filtrelenmeden çalışması.
* **Güvenli Çözüm:**
  - Backend: HTML Sanitization (tehlikeli taglerin temizlenmesi).
  - Frontend: React otomatik XSS koruması + Güvensiz `dangerouslySetInnerHTML` vs Güvenli render demonstrasyonu.
  - HTTP Security Headers: Content Security Policy (CSP), `X-XSS-Protection`, `X-Content-Type-Options: nosniff`.

### Senaryo 10: Denial of Service (DoS) & Rate Limiting
* **Açık Hali:** `GET /api/ships?pageSize=1000000` ile sunucu belleğinin taşırılması ve API'ye sınırsız istek gönderilerek sunucunun kilitlenmesi.
* **Güvenli Çözüm:**
  - `Math.Min(pageSize, 100)` ile katı maksimum sayfa boyutu sınırı.
  - ASP.NET Core Rate Limiting Middleware: IP başına dakikada maksimum istek sınırı (aşarsa HTTP `429 Too Many Requests`).

---

## 🌟 Bonus Görevler

1. **Bonus 1 — OWASP Top 10 Araştırma Raporu:**
   - A01'den A10'a kadar tüm maddelerin tanımı, oluşumu, gerçek hayattaki riskleri ve korunma yolları.
2. **Bonus 2 — Güvenlik Testleri Rehberi:**
   - OWASP ZAP & Postman Security Tests ile API güvenlik tarama adımları ve test koleksiyonu.
3. **Bonus 3 — Kapsamlı Güvenlik Denetim Günlüğü (Audit Logging):**
   - `AuditLogs` tablosu oluşturulması: Giriş, Çıkış, Veri Ekleme, Güncelleme, Silme ve Yetkisiz Erişim denemelerinin IP adresi, Kullanıcı ID, Zaman ve Eylem türüyle kaydedilmesi.

---

## 🖥️ Arayüz (Frontend) Yeniliği: "Güvenlik ve OWASP Laboratuvarı"

Öğretim görevlisine ve staj komisyonuna **canlı demo** yapabilmek için:
- Menüye **"Güvenlik Lab (OWASP)"** sayfası eklenecek.
- Bu sayfada 10 senaryonun her biri için interaktif test kartları bulunacak:
  - **SQLi Test Kartı:** Kasıtlı SQL Injection payload'u gönderip açık ve güvenli yanıtı canlı görme.
  - **IDOR Test Kartı:** Farklı kullanıcı token'ı ile başka limanın verisine erişim denemesi.
  - **XSS Test Kartı:** Zararlı script girildiğinde nasıl engellendiğini görme.
  - **Dosya Yükleme Test Kartı:** Sahte zararlı dosya yükleme denemesi ve validasyon hatası.
  - **Rate Limit Test Kartı:** Hızlı 15 istek gönderip HTTP 429 Too Many Requests uyarısını ekranda gösterme.
  - **Canlı Audit Log Akışı:** Yapılan tüm işlemlerin güvenlik loglarında listelenmesi.

---

## 📦 İnşa ve Uygulama Adımları

1. **Aşama 1 (Backend Çekirdek Güvenlik Modülü):**
   - `AuditLog` entity ve DbContext tanımı.
   - `GlobalExceptionMiddleware` entegrasyonu.
   - Rate Limiting ve Security Headers middleware eklenmesi.
   - Refresh Token ve Logout mekanizması.
2. **Aşama 2 (Güvenlik Senaryoları Controller ve Servisleri):**
   - `SecurityDemoController`: 10 senaryonun açık (vulnerable) ve güvenli (secure) endpoint'leri.
   - Evrak yükleme (`DocumentUploadService`) servisi.
   - IDOR yetki kontrolleri ve katmanlı DTO'lar.
3. **Aşama 3 (Birim Testler - xUnit & Moq):**
   - Broken Access Control, IDOR, SQLi, Mass Assignment, XSS Sanitization ve Rate Limit testleri.
4. **Aşama 4 (Frontend Güvenlik Laboratuvarı):**
   - `SecurityLabPage.tsx` sayfası: Canlı açık testi, risk analizi ve çözüm gösterim kartları.
5. **Aşama 5 (Dokümantasyon & Sunum):**
   - `docs/OWASP_Guvenli_Yazilim_Gelistirme_Raporu.md` ve 15 dakikalık sunum rehberi.

---

## ⚖️ Değerlendirme Kriterlerine Tam Uyum

| Kriter | Puan | Bu Plandaki Karşılığı |
| :--- | :---: | :--- |
| **Açığın Doğru Modellenmesi** | 20 | 10 senaryonun tamamı kasıtlı açık endpoint'lerle canlı modellenecektir. |
| **Risk Analizinin Doğruluğu** | 15 | Her açık için teknik ve kurumsal etki analizi dokümante edilecektir. |
| **Çözüm Kalitesi** | 25 | Kurumsal ASP.NET Core güvenlik en iyi uygulamaları (Best Practices) uygulanacaktır. |
| **Kod Kalitesi** | 15 | Clean architecture, DTO projeksiyonları, middleware ve SOLID prensipleri. |
| **Güvenli Yazılım Prensipleri** | 10 | Defense in Depth, Principle of Least Privilege, Fail-Safe Defaults. |
| **Dokümantasyon** | 10 | Önce-sonra tablolu, kod örnekli eksiksiz teknik rapor. |
| **Sunum** | 5 | 15 dakikalık interaktif Security Lab demosu ve sunum rehberi. |
| **TOPLAM** | **100 Puan** | **Eksiksiz 100/100 Hedefi** |
