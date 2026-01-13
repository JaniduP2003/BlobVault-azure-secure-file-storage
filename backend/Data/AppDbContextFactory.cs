using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace backend.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        
        // Use the same connection string as in appsettings.json
        optionsBuilder.UseSqlite("Data Source=backend-data/securedocuments.db");

        return new AppDbContext(optionsBuilder.Options);
    }
}
