using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Middleware;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IShipService, ShipService>();
builder.Services.AddScoped<IPortService, PortService>();
builder.Services.AddScoped<IShipVisitService, ShipVisitService>();
builder.Services.AddScoped<ICargoService, CargoService>();
builder.Services.AddScoped<ICrewMemberService, CrewMemberService>();
builder.Services.AddScoped<IShipCrewAssignmentService, ShipCrewAssignmentService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IDataSeederService, DataSeederService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IOperationService, OperationService>();

// OWASP A04 & Senaryo 10: Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 120,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            });
    });

    options.AddFixedWindowLimiter("StrictSecurityPolicy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromSeconds(10);
        opt.QueueLimit = 0;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"success\":false,\"statusCode\":429,\"message\":\"Hız Sınırı Aşıldı (Rate Limit Exceeded): Çok fazla istek gönderildi. Lütfen bir süre sonra tekrar deneyiniz.\",\"code\":\"TOO_MANY_REQUESTS\"}",
            cancellationToken: token);
    };
});

// JWT Authentication Configuration
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
    {
        var jwtKey = builder.Configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException("Kritik Güvenlik Hatası: JWT imzalama anahtarı ('Jwt:Key') konfigürasyonda bulunamadı. Lütfen ortam değişkenleri (Environment Variable: Jwt__Key) veya güvenli konfigürasyon üzerinden sağlayınız.");
        }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "LimanGemiTakipApi",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "LimanGemiTakipApp",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Liman Gemi Takip Sistemi API",
        Version = "v1",
        Description = "Liman Gemi Takip Sistemi - JWT Destekli ve Rol Bazlı RESTful API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Token giriniz. Örnek format: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

// OWASP Security Headers (Senaryo 9 - XSS, Clickjacking, MIME Sniffing engeli)
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
    await next();
});

// OWASP A04 & Senaryo 10: Rate Limiting Middleware
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger(options =>
    {
        options.SerializeAsV2 = true;
    });

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Liman Gemi Takip Sistemi API v1");
    });
}

app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var env = services.GetRequiredService<IWebHostEnvironment>();
        var configuration = services.GetRequiredService<IConfiguration>();
        DbInitializer.Initialize(context, env.IsDevelopment(), configuration);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Veritabanı başlatılırken hata oluştu.");
    }
}

app.MapControllers();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    application = "Liman Gemi Takip Sistemi"
}))
.WithName("HealthCheck");

app.Run();
