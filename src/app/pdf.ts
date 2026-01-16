import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PdfDocument {
  id: number;
  title: string;
  description?: string;
  uploadedAt: Date;
}

export interface PdfDetails extends PdfDocument {
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class Pdf {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'https://10.0.0.89:7296/api/Pdfs';
  
  // Signal für PDF-Öffnung von außen
  readonly pdfToOpen = signal<number | null>(null);

  // Hole alle PDFs
  getPdfs(): Observable<PdfDocument[]> {
    return this.http.get<PdfDocument[]>(this.API_URL);
  }

  // Hole ein spezifisches PDF
  getPdf(id: number): Observable<PdfDetails> {
    return this.http.get<PdfDetails>(`${this.API_URL}/${id}`);
  }

  // Hole PDF-File-URL
  getPdfFileUrl(id: number): string {
    return `${this.API_URL}/${id}/file`;
  }

  // Hole PDF als Blob (für mobile Anzeige)
  getPdfBlob(id: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${id}/file`, {
      responseType: 'blob',
      // Timeout auf 30 Sekunden (wichtig für große PDFs auf Mobile)
      // observe: 'response' vermeiden wir hier, da wir nur den Blob brauchen
    });
  }

  // Upload PDF
  uploadPdf(title: string, file: File, description?: string): Observable<PdfDetails> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    return this.http.post<PdfDetails>(this.API_URL, formData);
  }

  // Lösche PDF
  deletePdf(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
  
  // Trigger PDF-Öffnung (für QR-Scanner)
  openPdfById(id: number): void {
    this.pdfToOpen.set(id);
  }
}
