using System;
using System.Collections.Generic;

namespace MomentoShary.Backend.Models;

public partial class PdfDocument
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string FilePath { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime UploadedAt { get; set; }

    public int UserId { get; set; }

    public virtual User User { get; set; } = null!;
}
