using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;
using Microsoft.EntityFrameworkCore;
using MomentoShary.Backend.Data;
using MomentoShary.Backend.DTOs;
using MomentoShary.Backend.Services;

namespace MomentoShary.Backend.Controllers
{
    [EnableCors("AllowAngular")]
    [ApiController]
    [Route("api/[controller]")]
    public class PhotosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPhotoStorageService _photoStorage;
        private readonly IConfiguration _configuration;

        public PhotosController(AppDbContext context, IPhotoStorageService photoStorage, IConfiguration configuration)
        {
            _context = context;
            _photoStorage = photoStorage;
            _configuration = configuration;
        }

        // POST /api/photos/upload
        [HttpPost("upload")]
        [RequestSizeLimit(25_000_000)]
        public async Task<ActionResult<PhotoUploadResponseDto>> Upload(
            [FromForm] IFormFile file, 
            [FromForm] int userId,
            [FromForm] string? spot = null,
            [FromForm] string? job = null,
            [FromForm] string? comments = null)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(new { message = "User nicht gefunden" });
            }

            // Erstelle MMW-Ordner aus FirstName + LastName + City
            // z.B. Max Mustermann Wien → MMW
            var folderKey = $"{char.ToUpper(user.FirstName[0])}{char.ToUpper(user.LastName[0])}{char.ToUpper(user.City[0])}";

            try
            {
                var path = await _photoStorage.SavePhotoAsync(file, folderKey, spot, job);
                return Ok(new PhotoUploadResponseDto
                {
                    FilePath = path,
                    Message = "Upload erfolgreich"
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private static string GetInitials(string username)
        {
            if (string.IsNullOrWhiteSpace(username)) return "U";

            // If username looks like "Max Mustermann" -> MM
            var parts = username.Split(new[] { ' ', '.', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2)
            {
                return string.Concat(parts.Take(2).Select(p => char.ToUpperInvariant(p[0])));
            }

            return char.ToUpperInvariant(username[0]).ToString();
        }

        // GET /api/photos/{userId}
        [HttpGet("{userId}")]
        public async Task<ActionResult<List<PhotoInfoDto>>> GetUserPhotos(int userId)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(new { message = "User nicht gefunden" });
            }

            var folderKey = $"{char.ToUpper(user.FirstName[0])}{char.ToUpper(user.LastName[0])}{char.ToUpper(user.City[0])}";
            var photos = await _photoStorage.GetUserPhotosAsync(folderKey);

            return Ok(photos);
        }
    }
}
