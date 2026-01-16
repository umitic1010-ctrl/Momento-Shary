using BCrypt.Net;

namespace MomentoShary.Backend.Services
{
    /// <summary>
    /// Service für Passwort-Hashing und -Verifizierung
    /// BCrypt ist ein sicherer Hashing-Algorithmus
    /// </summary>
    public interface IPasswordHasher
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string passwordHash);
    }

    public class PasswordHasher : IPasswordHasher
    {
        /// <summary>
        /// Hasht ein Passwort mit BCrypt
        /// </summary>
        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        /// <summary>
        /// Verifiziert ein Passwort gegen den gespeicherten Hash
        /// </summary>
        public bool VerifyPassword(string password, string passwordHash)
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
    }
}
