using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;
using Microsoft.EntityFrameworkCore;
using MomentoShary.Backend.Data;
using MomentoShary.Backend.DTOs;
using MomentoShary.Backend.Models;
using MomentoShary.Backend.Services;

namespace MomentoShary.Backend.Controllers
{
    /// <summary>
    /// Controller für Authentifizierung (Login/Register)
    /// API-Endpunkte: /api/auth/login und /api/auth/register
    /// </summary>
    [EnableCors("AllowAngular")]
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<AuthController> _logger;

        public AuthController(AppDbContext context, IPasswordHasher passwordHasher, ILogger<AuthController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _logger = logger;
        }

        /// <summary>
        /// POST /api/auth/register
        /// Registriert einen neuen Benutzer
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                // Username automatisch aus FirstName + LastName + City generieren
                // z.B. Max Mustermann Wien → MMW
                var firstInitial = char.ToUpper(request.FirstName[0]);
                var lastInitial = char.ToUpper(request.LastName[0]);
                var cityInitial = char.ToUpper(request.City[0]);
                var generatedUsername = $"{firstInitial}{lastInitial}{cityInitial}";

                // Prüfen ob Username bereits existiert (falls Kollision)
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == generatedUsername);
                if (existingUser != null)
                {
                    // Bei Kollision: MMW → MMW2, MMW3, etc.
                    var counter = 2;
                    var uniqueUsername = generatedUsername;
                    while (await _context.Users.AnyAsync(u => u.Username == uniqueUsername))
                    {
                        uniqueUsername = $"{generatedUsername}{counter}";
                        counter++;
                    }
                    generatedUsername = uniqueUsername;
                }

                // Neuen User erstellen
                var user = new User
                {
                    Username = generatedUsername,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    City = request.City,
                    Email = request.Email,
                    PasswordHash = _passwordHasher.HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Neuer User registriert: {user.Username} ({user.FirstName} {user.LastName}, {user.City})");

                return Ok(new AuthResponseDto
                {
                    UserId = user.Id,
                    Username = user.Username,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    City = user.City,
                    Email = user.Email,
                    Message = "Registrierung erfolgreich"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fehler bei der Registrierung");
                return StatusCode(500, new { message = "Interner Serverfehler" });
            }
        }

        /// <summary>
        /// POST /api/auth/login
        /// Meldet einen Benutzer an
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                // User suchen
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

                if (user == null)
                {
                    return Unauthorized(new { message = "Ung�ltige Anmeldedaten" });
                }

                // Passwort verifizieren
                if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
                {
                    return Unauthorized(new { message = "Ung�ltige Anmeldedaten" });
                }

                _logger.LogInformation($"User erfolgreich eingeloggt: {user.Username}");

                return Ok(new AuthResponseDto
                {
                    UserId = user.Id,
                    Username = user.Username,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    City = user.City,
                    Email = user.Email,
                    Message = "Login erfolgreich"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fehler beim Login");
                return StatusCode(500, new { message = "Interner Serverfehler" });
            }
        }

        /// <summary>
        /// GET /api/auth/check/{username}
        /// Pr�ft ob ein Username bereits existiert
        /// </summary>
        [HttpGet("check/{username}")]
        public async Task<ActionResult<bool>> CheckUsernameExists(string username)
        {
            var exists = await _context.Users.AnyAsync(u => u.Username == username);
            return Ok(new { exists });
        }
    }
}
