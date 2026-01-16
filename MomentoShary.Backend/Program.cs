using Microsoft.EntityFrameworkCore;
using MomentoShary.Backend.Data;
using MomentoShary.Backend.Services;
using MomentoShary.Backend.Models;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Registriere PasswordHasher Service
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IPhotoStorageService, PhotoStorageService>();

// Add CORS for Angular frontend (allow everything for development)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allow any origin in development
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Seed PDFs: Synchronisiere alle Dateien im uploads/pdfs Ordner mit der Datenbank
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var pdfDirectory = Path.Combine("uploads", "pdfs");
    
    if (Directory.Exists(pdfDirectory))
    {
        var pdfFiles = Directory.GetFiles(pdfDirectory, "*.pdf");
        var existingFilePaths = context.PdfDocuments.Select(p => p.FilePath).ToHashSet();
        
        int addedCount = 0;
        foreach (var filePath in pdfFiles)
        {
            var fileName = Path.GetFileName(filePath);
            
            // Nur hinzufügen, wenn noch nicht in DB
            if (!existingFilePaths.Contains(fileName))
            {
                var titleWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
                
                context.PdfDocuments.Add(new PdfDocument
                {
                    Title = titleWithoutExtension,
                    Description = $"Automatisch hinzugefügt am {DateTime.Now:dd.MM.yyyy}",
                    FilePath = fileName,
                    UploadedAt = DateTime.UtcNow,
                    UserId = 1
                });
                addedCount++;
            }
        }
        
        if (addedCount > 0)
        {
            await context.SaveChangesAsync();
            Console.WriteLine($"✅ {addedCount} neue PDF(s) zur Datenbank hinzugefügt!");
        }
        else
        {
            Console.WriteLine("ℹ️ Alle PDFs bereits in der Datenbank.");
        }
    }
    else
    {
        Console.WriteLine("⚠️ PDF-Ordner existiert nicht: " + pdfDirectory);
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // Scalar UI: /scalar/v1
}

// HTTPS immer aktivieren (auch f�r PWA-Zugriff �ber Handy)
app.UseHttpsRedirection();

// CORRECT ORDER: Routing -> CORS -> Endpoints
app.UseRouting();
app.UseCors("AllowAngular");

// Serve photos from C:\MomentoShary
var photoBasePath = builder.Configuration["PhotoStorage:BasePath"] ?? "C:\\MomentoShary";
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(photoBasePath),
    RequestPath = "/photos"
});

app.MapControllers();

app.Run();

