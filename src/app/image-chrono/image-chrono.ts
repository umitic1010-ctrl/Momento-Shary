import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoService, PhotoInfo } from '../photo-service';

interface PhotosByDate {
  date: string;
  displayDate: string;
  photos: PhotoInfo[];
}

@Component({
  selector: 'app-image-chrono',
  imports: [CommonModule],
  templateUrl: './image-chrono.html',
  styleUrl: './image-chrono.css',
})
export class ImageChrono implements OnInit {
  private readonly photoService = inject(PhotoService);
  
  readonly photos = signal<PhotoInfo[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly selectedPhoto = signal<PhotoInfo | null>(null);
  
  readonly photosByDate = computed(() => {
    const allPhotos = this.photos();
    const grouped = new Map<string, PhotoInfo[]>();
    
    allPhotos.forEach(photo => {
      const date = new Date(photo.createdAt).toISOString().split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(photo);
    });
    
    return Array.from(grouped.entries())
      .map(([date, photos]) => ({
        date,
        displayDate: this.formatDate(date),
        photos: photos.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  });
  
  async ngOnInit() {
    await this.loadPhotos();
  }
  
  async loadPhotos() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const photos = await this.photoService.loadUserPhotos();
      this.photos.set(photos);
    } catch (err) {
      console.error('Failed to load photos:', err);
      this.error.set('Fehler beim Laden der Fotos');
    } finally {
      this.loading.set(false);
    }
  }
  
  getPhotoUrl(photo: PhotoInfo): string {
    return this.photoService.getPhotoUrl(photo.relativePath);
  }
  
  openPhoto(photo: PhotoInfo) {
    this.selectedPhoto.set(photo);
  }
  
  closePhoto() {
    this.selectedPhoto.set(null);
  }
  
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Heute';
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Gestern';
    }
    
    return date.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
