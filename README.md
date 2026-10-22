# Liman Gemi Takip Sistemi

Staj projesi icin gelistirilen liman gemi takip web uygulamasi.

## Teknolojiler

- Backend: ASP.NET Core Web API (.NET 8)
- Veritabani: SQL Server / SQL Server LocalDB
- ORM: Entity Framework Core
- Frontend: React + Vite

## Proje Yapisi

```text
backend/
  LimanGemiTakip.Api/
frontend/
docs/
```

## Backend Calistirma

```powershell
dotnet restore
dotnet run --project backend\LimanGemiTakip.Api\LimanGemiTakip.Api.csproj
```

Backend calistiktan sonra Swagger ekrani tarayicida acilabilir.
