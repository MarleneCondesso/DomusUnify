using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DomusUnify.Infrastructure;

/// <summary>
/// Registo de dependências da camada de infraestrutura.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Adiciona serviços de infraestrutura ao contentor de injeção de dependências.
    /// </summary>
    /// <remarks>
    /// Configura o <see cref="DomusUnifyDbContext"/> usando a string de ligação <c>DefaultConnection</c>.
    /// </remarks>
    /// <param name="services">Coleção de serviços.</param>
    /// <param name="configuration">Configuração da aplicação.</param>
    /// <returns>A mesma coleção de serviços, para encadeamento.</returns>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<DomusUnifyDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<DomusUnifyDbContext>());

        return services;
    }
}
