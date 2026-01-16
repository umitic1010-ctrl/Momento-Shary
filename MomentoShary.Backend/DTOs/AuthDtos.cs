using System.ComponentModel.DataAnnotations;

namespace MomentoShary.Backend.DTOs
{
    /// <summary>
    /// DTO f�r Login-Anfrage vom Frontend
    /// </summary>
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Username ist erforderlich")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password ist erforderlich")]
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO für Registration-Anfrage vom Frontend
    /// Username wird automatisch aus FirstName + LastName + City generiert (z.B. MMW)
    /// </summary>
    public class RegisterRequestDto
    {
        [Required(ErrorMessage = "Vorname ist erforderlich")]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nachname ist erforderlich")]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Stadt/Wohnort ist erforderlich")]
        [MaxLength(50)]
        public string City { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password ist erforderlich")]
        [MinLength(6, ErrorMessage = "Password muss mindestens 6 Zeichen haben")]
        public string Password { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Ungültige E-Mail-Adresse")]
        public string? Email { get; set; }
    }

    /// <summary>
    /// DTO für Login/Register-Antwort an das Frontend
    /// </summary>
    public class AuthResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
