using MomentoShary.Backend.DTOs;

namespace MomentoShary.Backend.Services
{
    public interface IPhotoStorageService
    {
        Task<string> SavePhotoAsync(IFormFile file, string userFolderKey, string? spot = null, string? job = null);
        Task<List<PhotoInfoDto>> GetUserPhotosAsync(string userFolderKey);
    }

    public class PhotoStorageService : IPhotoStorageService
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp"
        };

        private readonly string _basePath;
        private readonly ILogger<PhotoStorageService> _logger;

        public PhotoStorageService(IConfiguration configuration, ILogger<PhotoStorageService> logger)
        {
            _basePath = configuration["PhotoStorage:BasePath"] ?? "C:\\MomentoShary";
            _logger = logger;
        }

        public async Task<string> SavePhotoAsync(IFormFile file, string userFolderKey, string? spot = null, string? job = null)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("Keine Datei hochgeladen.");
            }

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
            {
                throw new ArgumentException("Nur .jpg/.jpeg/.png/.webp sind erlaubt.");
            }

            var safeUserKey = SanitizeFolderPart(userFolderKey);
            
            // Build folder path: Base/MomentoShary/UserKey/[Date/Spot/Job]
            var targetDir = Path.Combine(_basePath, "MomentoShary", safeUserKey);
            
            // Add context-based subfolders if provided
            if (!string.IsNullOrWhiteSpace(spot) && !string.IsNullOrWhiteSpace(job))
            {
                var date = DateTime.UtcNow.ToString("yyyy-MM-dd");
                var safeSpot = SanitizeFolderPart(spot);
                var safeJob = SanitizeFolderPart(job);
                
                targetDir = Path.Combine(targetDir, date, safeSpot, safeJob);
                _logger.LogInformation("Using context-based folder: {Path}", targetDir);
            }
            
            Directory.CreateDirectory(targetDir);

            var fileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
            var fullPath = Path.Combine(targetDir, fileName);

            await using var stream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
            await file.CopyToAsync(stream);

            _logger.LogInformation("Photo saved: {Path}", fullPath);
            return fullPath;
        }

        private static string SanitizeFolderPart(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return "Unknown";
            }

            var invalid = Path.GetInvalidFileNameChars();
            var cleaned = new string(input.Select(ch => invalid.Contains(ch) ? '_' : ch).ToArray());
            cleaned = cleaned.Trim();
            return string.IsNullOrWhiteSpace(cleaned) ? "Unknown" : cleaned;
        }

        public async Task<List<PhotoInfoDto>> GetUserPhotosAsync(string userFolderKey)
        {
            var safeUserKey = SanitizeFolderPart(userFolderKey);
            var targetDir = Path.Combine(_basePath, "MomentoShary", safeUserKey);

            if (!Directory.Exists(targetDir))
            {
                return new List<PhotoInfoDto>();
            }

            return await Task.Run(() =>
            {
                var files = Directory.GetFiles(targetDir, "*.*", SearchOption.AllDirectories)
                    .Where(f => AllowedExtensions.Contains(Path.GetExtension(f)))
                    .Select(filePath =>
                    {
                        var fileInfo = new FileInfo(filePath);
                        var relativePath = Path.GetRelativePath(_basePath, filePath).Replace('\\', '/');
                        
                        return new PhotoInfoDto
                        {
                            FileName = fileInfo.Name,
                            RelativePath = relativePath,
                            CreatedAt = fileInfo.CreationTimeUtc,
                            SizeInBytes = fileInfo.Length
                        };
                    })
                    .OrderByDescending(p => p.CreatedAt)
                    .ToList();

                return files;
            });
        }
    }
}
