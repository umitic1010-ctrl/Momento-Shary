using Microsoft.EntityFrameworkCore;
using MomentoShary.Backend.Models;

namespace MomentoShary.Backend.Data
{
    /// <summary>
    /// AppDbContext verwaltet die Datenbankverbindung und Models
    /// Entity Framework Core nutzt diesen Context f�r alle DB-Operationen
    /// </summary>
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // DbSet = Tabelle in der Datenbank
        public DbSet<User> Users { get; set; }
        public DbSet<PdfDocument> PdfDocuments { get; set; }

        /// <summary>
        /// Konfiguriert die Constraints f�r die User-Tabelle
        /// </summary>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Configuration: Username muss unique sein
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Username).IsUnique();
            });
        }
    }
}

