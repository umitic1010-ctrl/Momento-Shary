using System;
using System.Collections.Generic;

namespace MomentoShary.Backend.Models;

public partial class User
{
    public int Id { get; set; }

    public string Username { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? Email { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string City { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<PdfDocument> PdfDocuments { get; set; } = new List<PdfDocument>();
}
