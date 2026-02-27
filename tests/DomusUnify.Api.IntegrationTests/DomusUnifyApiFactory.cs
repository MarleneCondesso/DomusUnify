using DomusUnify.Api.IntegrationTests.Fakes;
using DomusUnify.Api.Services.Auth;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DomusUnify.Api.IntegrationTests;

public sealed class DomusUnifyApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    public DomusUnifyApiFactory()
    {
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        TestEnv.Load();

        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Replace DB provider (avoid depending on a local SQL Server instance).
            foreach (var descriptor in services
                         .Where(d => d.ServiceType == typeof(DbContextOptions<DomusUnifyDbContext>) || d.ServiceType == typeof(DomusUnifyDbContext))
                         .ToArray())
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<DomusUnifyDbContext>(options => options.UseSqlite(_connection));

            // Create schema once for this test server.
            var sp = services.BuildServiceProvider();
            using (var scope = sp.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<DomusUnifyDbContext>();
                db.Database.EnsureCreated();
            }

            // Replace external auth token validation (avoid network + real Google tokens).
            foreach (var descriptor in services
                         .Where(d => d.ServiceType == typeof(IExternalIdTokenValidator))
                         .ToArray())
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<IExternalIdTokenValidator, FakeExternalIdTokenValidator>();
        });
    }

    public HttpClient CreateHttpsClient() =>
        CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}
