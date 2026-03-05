using DomusUnify.Api.Hubs;
using DomusUnify.Api.Realtime;
using DomusUnify.Api.Services.Covers;
using DomusUnify.Api.Services.Auth;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Activity;
using DomusUnify.Application.Budgets;
using DomusUnify.Application.Calendar;
using DomusUnify.Application.Categories;
using DomusUnify.Application.Common.Covers;
using DomusUnify.Application.Common.Realtime;
using DomusUnify.Application.Family;
using DomusUnify.Application.FinanceAccounts;
using DomusUnify.Application.FinanceCategories;
using DomusUnify.Application.FinanceTransactions;
using DomusUnify.Application.Lists;
using DomusUnify.Application.Notifications;
using DomusUnify.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DomusUnify API",
        Version = "v1"
    });

    // Bearer JWT
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Insere o token JWT assim: **Bearer {token}**"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
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

    c.MapType<DateOnly>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "date",
        Example = new Microsoft.OpenApi.Any.OpenApiString("2026-02-04")
    });

    c.MapType<DateOnly?>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "date",
        Nullable = true,
        Example = new Microsoft.OpenApi.Any.OpenApiString("2026-02-04")
    });

    var xmlDocFiles = new[]
    {
        $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml",
        "DomusUnify.Application.xml",
        "DomusUnify.Domain.xml",
        "DomusUnify.Infrastructure.xml"
    };

    foreach (var xmlFile in xmlDocFiles)
    {
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
            c.IncludeXmlComments(xmlPath);
    }
});

// JWT Auth
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwt = builder.Configuration.GetSection("Jwt");
        var key = Encoding.UTF8.GetBytes(jwt["Key"]!);

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/family"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// CORS (needed for Vercel/mobile apps calling the API from another origin)
var corsAllowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
var corsAllowedOriginSuffixes = builder.Configuration.GetSection("Cors:AllowedOriginSuffixes").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("domus", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod();

        // Allow explicitly configured origins and/or suffixes (ex.: ".vercel.app").
        // Note: we avoid AllowAnyOrigin because the app uses Authorization headers and SignalR.
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;

            if (corsAllowedOrigins.Any(o => string.Equals(o, origin, StringComparison.OrdinalIgnoreCase)))
                return true;

            if (corsAllowedOriginSuffixes.Any(s => origin.EndsWith(s, StringComparison.OrdinalIgnoreCase)))
                return true;

            return false;
        });
    });
});

// DB + Infra
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.Configure<ExternalAuthOptions>(
    builder.Configuration.GetSection(ExternalAuthOptions.SectionName));
builder.Services.AddSingleton<IExternalIdTokenValidator, ExternalIdTokenValidator>();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserContext, CurrentUserContext>();

// Application
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

builder.Services.AddScoped<IListService, ListService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICalendarService, CalendarService>();
builder.Services.AddScoped<ICalendarSettingsService, CalendarSettingsService>();
builder.Services.AddScoped<IRecurrenceService, RecurrenceService>();
builder.Services.AddScoped<IBudgetService, BudgetService>();
builder.Services.AddScoped<IBudgetAccountsService, BudgetAccountsService>();
builder.Services.AddScoped<IFinanceCategoryService, FinanceCategoryService>();
builder.Services.AddScoped<IFinanceAccountService, FinanceAccountService>();
builder.Services.AddScoped<IFinanceTransactionService, FinanceTransactionService>();

builder.Services.Configure<FamilyInviteOptions>(
    builder.Configuration.GetSection(FamilyInviteOptions.SectionName));

builder.Services.AddScoped<IFamilyInviteService, FamilyInviteService>();

// Stock images (covers)
builder.Services.AddHttpClient<IStockPhotoProvider, PexelsStockPhotoProvider>(client =>
{
    client.BaseAddress = new Uri("https://api.pexels.com/v1/");
    client.Timeout = TimeSpan.FromSeconds(10);
});

// Realtime
builder.Services.AddSignalR();
builder.Services.AddScoped<IRealtimeNotifier, SignalRRealtimeNotifier>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DomusUnify.Infrastructure.Persistence.DomusUnifyDbContext>();
    await DomusUnify.Infrastructure.Persistence.DbSeeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("domus");

// Alguns endpoints usam `User.GetUserId()` que pode lançar `UnauthorizedAccessException` quando o token não contém o
// claim esperado. Sem handler isto vira 500; mapeamos para 401 para o frontend conseguir reagir.
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (UnauthorizedAccessException ex)
    {
        if (context.Response.HasStarted) throw;

        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = ex.Message });
    }
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<FamilyHub>("/hubs/family").RequireCors("domus");

app.Run();

// Exposto para `WebApplicationFactory<Program>` nos testes de integração.
public partial class Program { }
