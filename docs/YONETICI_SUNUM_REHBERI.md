# Liman Gemi Takip Sistemi — Yönetici Sunum ve Savunma Rehberi

Bu rehber; **Liman Gemi Takip Sistemi** projenizi yöneticinize, teknik lidere veya değerlendirme komitesine sunarken kusursuz bir intiba bırakmanız, canlı demoyu hatasız yönetmeniz ve gelebilecek her türlü teknik/yönetsel soruya kendinizden emin cevaplar vermeniz için hazırlanmıştır.

---

## 1. Projeyi Sıfırdan Başlatma (Hızlı & Kolay)

Sunumdan 5 dakika önce sistemi ayağa kaldırmak için iki pratik yönteminiz vardır:

### Yöntem A: Tek Tıkla Başlatma (Tavsiye Edilen)
Projenin kök dizininde veya masaüstünüzdeki kopyada yer alan **`baslat.bat`** dosyasına çift tıklayın:
1. Otomatik olarak **Backend API** (`http://localhost:5000`) başlar.
2. 3 saniye sonra **Frontend Vite** (`http://localhost:5173`) başlar.
3. Tarayıcınızda [http://localhost:5173](http://localhost:5173) adresine gidin.

### Yöntem B: Terminalden Adım Adım Başlatma (Yönetici komutları görmek isterse)
İki ayrı terminal penceresi açın:

* **Terminal 1 (Backend API):**
  ```powershell
  cd "backend\LimanGemiTakip.Api"
  dotnet run --launch-profile http
  ```
  *(Backend `http://localhost:5000` üzerinde dinlemeye başlar. Swagger dokümantasyonu: `http://localhost:5000/swagger`)*

* **Terminal 2 (Frontend Arayüz):**
  ```powershell
  cd "frontend"
  npm run dev
  ```
  *(Arayüz `http://localhost:5173` üzerinde açılır)*

* **Terminal 3 (Birim Testleri — Yöneticinize gururla göstermek için):**
  ```powershell
  dotnet test
  ```
  *(75/75 testin yeşil yandığını anında ekranda gösterin!)*

---

## 2. Sunum & Canlı Demo Akışı (5 - 7 Dakika)

Sunumunuzu kronolojik olarak şu akışla yaparsanız yöneticiniz projeye hayran kalacaktır:

### Adım 1: Giriş & Amaç (30 Saniye)
> *"Merhaba Sayın Yöneticim. Bugün size staj sürecinde geliştirdiğim 'Liman Gemi Takip Sistemi'ni sunacağım. Bu proje; limana gelen ve ayrılan gemileri, yük manifestolarını, liman rıhtım kapasitelerini ve mürettebat atamalarını uluslararası denizcilik kurallarına uygun olarak takip eden, rol tabanlı yetkilendirmeye ve 75 birim testine sahip kurumsal bir web platformudur."*

### Adım 2: Mimari & Teknoloji Yığını (1 Dakika)
> *"Projeyi N-Katmanlı Mimari (N-Tier) standartlarında kurguladım:*
> - **Backend:** ASP.NET Core 8 Web API, Entity Framework Core, SQL Server, Repository Pattern ve Dependency Injection.
> - **Frontend:** React 18, TypeScript, TailwindCSS, Vite ve Axios.
> - **Güvenlik:** HMAC-SHA256 JWT Bearer Authentication & Rol Bazlı Yetkilendirme (RBAC).
> - **Sağlamlık:** Global Exception Middleware, Server-Side Pagination ve xUnit ile 75 birim testi."*

### Adım 3: Rol Ayrılığı Demosu (2 Dakika)
1. **Liman Operatörü Olarak Giriş Yapın:**
   - Kullanıcı adı: `operator` | Şifre: `Operator123!`
   - Üst bara dikkat çekin: Sarı kalkanlı **`OPERATOR`** rozeti.
   - **Gemi Ziyaretleri** ve **Yük Yönetimi** sayfalarına gidin: Operatörün gemi yanaştırabildiğini ve yük ekleyebildiğini gösterin.
   - **Gemi Sicili** veya **Mürettebat Yönetimi** sayfasına gidin: Operatörün yeni gemi/personel ekleyemediğini, butonların gizlendiğini ve sayfanın *"Salt Okunur Mod (Operator)"* olduğunu gösterin. *"Liman operatörü saha operasyonunu yürütür; ulusal gemi sicilini veya denizci özlük kaydını değiştiremez."*
2. **Çıkış Yapıp Admin Olarak Giriş Yapın:**
   - Kullanıcı adı: `admin` | Şifre: `Admin123!`
   - Sağ üstte kırmızı kalkanlı **`ADMIN`** rozetini ve tüm ekranlarda düzenleme/silme yetkilerini gösterin.

### Adım 4: Canlı İş Kuralları Demosu (En Çok Etki Bırakacak Kısım!) (3 Dakika)

1. **Uluslararası IMO Kontrol Basamağı Doğrulaması:**
   - *Gemi Yönetimi* $\rightarrow$ *Yeni Gemi Ekle* modalını açın.
   - IMO alanına rastgele `9176188` yazın. Sistemin anında:  
     `"Geçersiz IMO kontrol basamağı! İlk 6 basamağın formülüne göre son rakam 7 olmalıdır, fakat 8 girildi."`  
     dediğini gösterin.
   - Yanındaki **"✨ Geçerli IMO Üret"** butonuna basın ve formülün otomatik doğrulandığını yeşil rozetle gösterin.
2. **Mürettebat Çift Gemi / Çakışan Görev Engeli:**
   - *Gemi-Mürettebat Atamaları* sayfasına gidin.
   - `Personel #1` (Ahmet Yılmaz) zaten *TCG Barbaros* gemisinde görevdedir.
   - Yeni atama modalında Ahmet Yılmaz'ı seçin; modal içinde çıkan kırmızı uyarıyı gösterin:  
     `"Aktif Görev Uyarısı: Bu personel şu anda TCG Barbaros gemisinde aktif görevdedir. Bir çalışan aynı anda birden fazla gemiye atanamaz!"`
   - Tabloda devam eden görevin yanındaki yeşil **"Görevi Bitir"** butonuna basarak görevi bugünün tarihiyle sonlandırın ve personelin boşa çıkarak yeni gemiye atanabilir hale geldiğini gösterin.
3. **Gemi DWT Taşıma Kapasitesi Aşımı:**
   - Bir gemiye kapasitesinden (DWT) daha fazla yük girildiğinde sistemin yükü reddettiğini gösterin.

### Adım 5: Test Sonuçları & Kapanış (1 Dakika)
- Terminali açıp `dotnet test` yazın.
- **75 adet testin sıfır hatayla geçtiğini** göstererek sunumu noktalayın:
  > *"Gördüğünüz üzere sistem sadece arayüzden ibaret değil; iş kuralları, güvenlik sınırları ve veri tutarlılığı 75 otomatik test ile garanti altına alınmıştır. Teşekkür ederim, sorularınızı yanıtlamaktan memnuniyet duyarım."*

---

## 3. Yöneticinin Sorabileceği 10 Kritik Soru ve En İyi Cevaplar

### S1: "Projende hangi mimari deseni kullandın, neden N-Tier ve Repository seçtin?"
> **Cevabınız:**  
> *"Projeyi N-Katmanlı Mimari (N-Tier) ile Katmanlı Ayrım (Separation of Concerns) ilkesine göre tasarladım. Controller katmanı sadece HTTP isteklerini karşılar, Repository katmanı veritabanı işlemlerini soyutlar, Service katmanı ise tüm iş kurallarını (validasyonlar, çakışma kontrolleri) yürütür.*  
> *Repository desenini kullanmamın iki ana sebebi var: Birincisi, veritabanı teknolojisini soyutlamak (yarın SQL Server yerine PostgreSQL gelse servis koduna dokunmayız); ikincisi ise testlerde Mocklama ve InMemory veritabanı kullanarak 75 testi harici bir veritabanı bağımlılığı olmadan milisaniyeler içinde koşturabilmektir."*

---

### S2: "IMO numarası doğrulaması nedir? Neden sadece 7 haneli olmasını kontrol etmedin?"
> **Cevabınız:**  
> *"IMO (International Maritime Organization) numarası denizcilikte gemilerin şasi numarası gibidir ve rastgele 7 rakamdan oluşmaz. Uluslararası standarda göre ağırlıklı kontrol basamağı algoritması kullanılır:*  
> *İlk 6 rakam sırasıyla `[7, 6, 5, 4, 3, 2]` katsayılarıyla çarpılıp toplanır. Bu toplamın 10'a göre modu (`sum % 10`) tam olarak 7. rakamı vermelidir. Sistemimiz sahte ve hatalı gemi sicil kayıtlarını önlemek amacıyla bu algoritmayı hem backend'de hem frontend'de gerçek zamanlı hesaplamaktadır."*

---

### S3: "Bir çalışan aynı anda iki gemiye atanabilir mi? Tarih çakışmasını nasıl çözdün?"
> **Cevabınız:**  
> *"Gerçek hayatta bir gemi adamı aynı anda iki farklı gemide bulunamaz. Bu mantık hatasını engellemek için **Universal Interval Overlap** algoritmasını uyguladım:*  
> $$Start_1 \le (End_2 \lor \infty) \quad \land \quad Start_2 \le (End_1 \lor \infty)$$  
> *Eğer personelin devam eden (`EndDate == null`) bir görevi varsa veya yeni girilen tarih aralığı mevcut bir seferle çakışıyorsa sistem bunu tespit eder. Farklı gemi ise 'Çift Gemi Ataması Engeli', aynı gemi ise 'Mükerrer Görev Engeli' fırlatır. Görevi biten personel için 'Görevi Bitir' aksiyonu ile bitiş tarihi verilerek personelin serbest kalması sağlanır."*

---

### S4: "Liman kapasitesi ve gemi DWT kapasite aşımı kontrollerini nasıl kurguladın?"
> **Cevabınız:**  
> *"İki seviyeli fiziksel güvenlik kurduk:*  
> *1) **Liman Eşzamanlı Kapasite Aşımı:** Bir limanın örneğin 2 gemilik rıhtım kapasitesi varsa, aynı tarih aralığında 3. bir gemi yanaşamaz. Sistem 'Liman Rıhtım Kapasitesi Dolu' uyarısı verir.*  
> *2) **Gemi DWT Aşımı:** Bir geminin taşıma kapasitesi (Deadweight Tonnage) sabittir. Gemiye eklenen kargoların toplam ağırlığı geminin DWT sınırını aştığında kargo girişi engellenir.*  
> *3) **Gemi Işınlanma Engeli:** Bir gemi aynı günlerde hem İstanbul hem İzmir limanında olamaz; çakışan ziyaret kayıtları engellenir."*

---

### S5: "Kimlik doğrulama ve yetkilendirmeyi (Auth) nasıl yaptın? Roller neler yapabilir?"
> **Cevabınız:**  
> *"Stateless JWT Bearer Token ve Rol Bazlı Yetkilendirme (RBAC) kullandık:*  
> - **Admin:** Tam yetkilidir. Gemi, liman ve mürettebat sicil kayıtlarını yönetir ve kritik silme işlemlerini sadece Admin yapabilir.  
> - **Operator:** Günlük liman operasyonlarından sorumludur. Gemi yanaşma/kalkış kayıtlarını, yükleme/boşaltmayı ve personele görev atamayı yönetir. Ancak sistem tanımlarını (gemi, liman, mürettebat sicili) değiştiremez ve kayıt silemez.  
> - **Viewer:** Denetim ve raporlama amaçlı salt okunur misafir modudur.  
> *API seviyesinde tüm endpoint'ler `[Authorize(Roles = "...")]` nitelikleriyle korunmakta; yetkisiz erişimler HTTP 403 Forbidden ile reddedilmektedir."*

---

### S6: "Veritabanında 100.000 gemi ve ziyaret kaydı olsaydı sistem yavaşlar mıydı? Nasıl ölçekledin?"
> **Cevabınız:**  
> *"Tüm verileri belleğe çekip tarayıcıya yığmak (GetAll) yerine **Server-Side Pagination (Sunucu Taraflı Sayfalama)** mimarisi kurduk.*  
> *Backend'de `GetPagedAsync(pageNumber, pageSize, searchTerm)` metodu yazdık. Entity Framework Core üzerinden SQL seviyesinde `OFFSET ... FETCH NEXT` (`Skip` & `Take`) çalışır. Veritabanında 1 milyon gemi de olsa sunucu sadece ekranda gösterilecek 10 kaydı çeker. Arama ve filtreleme işlemleri de SQL üzerinde indeksli kolonlar üzerinden yürütülür."*

---

### S7: "Beklenmeyen bir hata olursa sistem nasıl davranır? Exception handling yapın nasıldır?"
> **Cevabınız:**  
> *"Controller'ların içine tek tek try-catch yazıp kod kirliliği yaratmak yerine **GlobalExceptionMiddleware** geliştirdik.*  
> *Tüm HTTP istekleri bu middleware boru hattından (pipeline) geçer. Eğer bir iş kuralı ihlali (`ArgumentException` veya `InvalidOperationException`) fırlatılırsa, kullanıcıya temiz bir `400 Bad Request` ve açıklayıcı Türkçe mesaj döner. Beklenmeyen bir veritabanı veya sunucu çökmesi olursa, hassas SQL ve sunucu detayları kullanıcıdan gizlenir ve güvenli standart bir `500 Internal Server Error` JSON nesnesi dönülür."*

---

### S8: "Test stratejin nedir? Neleri test ettin?"
> **Cevabınız:**  
> *"xUnit ve Moq kullanarak toplam **75 adet birim testi** yazdık. Testlerimiz şunları kapsar:*  
> *- IMO kontrol basamağı matematiksel doğrulaması (geçerli, geçersiz, eksik basamak).*  
> *- Mürettebat çift gemi atama engeli ve ucu açık görev çakışmaları.*  
> *- Gemi DWT aşımı ve negatif tonaj sınır kontrolleri.*  
> *- Controller seviyesinde rol yetki matrisinin (Admin, Operator, Delete) doğrulanması.*  
> *- Gerçekçi tüm gemi türlerinin (Konteyner, Tanker, Ro-Ro, Römorkör, LNG Gaz Tankeri) sınır değer testleri.*  
> *`dotnet test` çalıştırıldığında 75 testin tamamı 500 ms içinde sıfır hatayla geçmektedir."*

---

### S9: "Arayüzde neden 'Canlı API' ve 'Mock Veri Modu' diye iki mod var?"
> **Cevabınız:**  
> *"Bu özellik çevrimdışı sunumlar ve hızlı prototipleme için tasarlandı. Eğer sunum yapılan ortamda veritabanı bağlantısı veya backend erişimi kesilirse, sistem tek tıkla Mock Veri Moduna geçerek LocalStorage üzerinden tüm iş kurallarını simüle etmeye devam eder. Canlı API moduna alındığında ise doğrudan SQL Server ve ASP.NET Core API ile haberleşir."*

---

### S10: "Projeyi bir sonraki aşamaya taşımak istesen neler eklersin? (Roadmap)"
> **Cevabınız:**  
> *"Üç güçlü vizyon hedefi belirledim:*  
> *1) **SignalR ile Gerçek Zamanlı Canlı Radar:** Bir gemi yanaştığında veya rıhtım dolduğunda sayfayı yenilemeden tüm operatör ekranlarına canlı bildirim düşmesi.*  
> *2) **Excel & PDF Raporlama:** Liman ziyaretleri ve yük manifestolarının tek tıkla resmi gümrük raporu formatında dışa aktarılması.*  
> *3) **Audit Trail (İşlem Denetim İzi):** Hangi kullanıcının hangi saatte hangi gemi kaydını değiştirdiğini tutan loglama altyapısı."*

---

## 4. Sunum Öncesi Hızlı Kontrol Listesi (Checklist)

- [ ] Masaüstündeki projenin güncel olduğundan emin olun (`baslat.bat` hazır).
- [ ] Tarayıcınızda [http://localhost:5173](http://localhost:5173) sayfasını yer imlerine ekleyin.
- [ ] Demo hesaplarını not edin:
  - **Admin:** `admin` / `Admin123!`
  - **Operator:** `operator` / `Operator123!`
  - **Viewer:** `viewer` / `Viewer123!`
- [ ] Terminalde `dotnet test` komutunun 75 testle çalıştığını bir kez önceden gözünüzle görün.
- [ ] Sakin, özgüvenli ve terimlere hakim bir ses tonuyla sunuma başlayın! Başarılar!
