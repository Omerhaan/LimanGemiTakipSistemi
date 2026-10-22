# Liman Gemi Takip Sistemi - Staj Proje Plani

Bu dosya, staj projesinin ana gereksinimlerini ve adim adim ilerleme planini tutmak icin olusturuldu.

## Proje Ozeti

Liman Gemi Takip Sistemi; limana gelen ve limandan ayrilan gemileri, gemilerin yuklerini, liman ziyaretlerini ve murettebat atamalarini takip eden basit bir web uygulamasidir.

## Kullanilacak Teknolojiler

- Backend: ASP.NET Core Web API (.NET 6 veya uzeri)
- ORM: Entity Framework Core
- Veritabani: SQL Server Express
- Frontend: React + Vite
- API istemcisi: Axios
- API dokumantasyonu: Swagger
- Test: xUnit veya NUnit, tercihen Moq
- Versiyon kontrol: Azure DevOps Git

## Veritabani Tablolari

1. Ships
2. Ports
3. ShipVisits
4. Cargoes
5. CrewMembers
6. ShipCrewAssignments

## Ana Ekranlar

- Gemi Yonetimi: listeleme, ekleme, duzenleme, silme
- Liman Yonetimi: CRUD islemleri
- Ziyaret Kayitlari: gemi ve liman secimi, tarih kontrolleri
- Yuk Yonetimi: gemiye ait yukler, agirlik kontrolu
- Murettebat Yonetimi: e-posta, telefon ve gorev validasyonu
- Gemi-Murettebat Atamalari: ayni gemi, murettebat ve tarih tekrarini engelleme

## Is Kurallari

- Zorunlu alan kontrolleri yapilacak.
- IMO numarasi benzersiz olacak.
- E-posta formati kontrol edilecek.
- Telefon numarasi formati kontrol edilecek.
- Gemi ziyaretinde gelis tarihi ayrilis tarihinden once olacak.
- Yuk agirligi 0'dan buyuk olacak.
- Ayni gemi ve murettebat ayni tarihte birden fazla kez atanamayacak.

## Unit Test Hedefi

En az 2 servis metodu test edilecek.

- ShipService.AddShip
- CrewService.GetCrewById

Mocklama icin Moq kullanilmasi hedeflenir.

## Onerilen Branch Yapisi

- main: yayinlanabilir kod
- dev: gelistirme ortami
- feature/<ozellik-adi>: yeni ozellikler

## Adim Adim Yol Haritasi

1. Gelistirme ortamini hazirla.
2. Backend projesini olustur.
3. Entity modellerini ve DbContext'i yaz.
4. SQL Server baglantisini ve migration yapisini kur.
5. Repository katmanini ekle.
6. Service katmanini ve is kurallarini ekle.
7. Controller ve REST endpointlerini yaz.
8. Swagger ile API'yi test et.
9. Unit test projesini olustur ve temel testleri yaz.
10. React + Vite frontend projesini olustur.
11. Axios API katmanini yaz.
12. CRUD ekranlarini sirasiyla gelistir.
13. Frontend form validasyonlarini tamamla.
14. Projeyi Azure DevOps reposuna duzenli commitlerle yukle.

## Ilk Uygulama Sirasi

1. Backend iskeleti
2. Ships CRUD
3. Ports CRUD
4. ShipVisits CRUD
5. Cargoes CRUD
6. CrewMembers CRUD
7. ShipCrewAssignments CRUD
8. Unit testler
9. Frontend ekranlari
10. Son kontrol ve teslim hazirligi
