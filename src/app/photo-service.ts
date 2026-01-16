import { Injectable } from '@angular/core';
import { PhotoItem } from './photo-item';
import { signal, inject } from '@angular/core';
import { Auth } from './auth';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, retry, timer } from 'rxjs';

interface PhotoUploadResponse {
  filePath: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private readonly auth = inject(Auth);
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'https://10.0.0.89:7296/api/photos';

  getUserPhotoPath(spot?: string, job?: string): string {
    const username = this.auth.getUsername() ?? 'guest';
    
    // no context
    if (!spot || !job) {
      return `MomentoShary/${username}/`;
    }
    
    // with context
    const date = new Date().toISOString().split('T')[0];
    return `MomentoShary/${username}/${date}/${spot}/${job}/`;
  }

  async uploadPhoto(photoBlob: Blob, filename: string, context?: { spot: string; job: string; comments?: string }): Promise<string> {
    const userId = this.auth.getUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }

    const formData = new FormData();
    formData.append('file', photoBlob, filename);
    formData.append('userId', userId.toString());
    
    // Add context parameters if provided
    if (context) {
      formData.append('spot', context.spot);
      formData.append('job', context.job);
      if (context.comments) {
        formData.append('comments', context.comments);
      }
    }

    try {
      const response = await firstValueFrom(
        this.http.post<PhotoUploadResponse>(`${this.API_URL}/upload`, formData).pipe(
          retry({
            count: 3,
            delay: (error, retryCount) => {
              // Exponential backoff: 1s, 2s, 4s
              const delayMs = Math.pow(2, retryCount - 1) * 1000;
              console.log(`🔄 Upload retry ${retryCount}/3 for ${filename} in ${delayMs}ms...`);
              return timer(delayMs);
            }
          })
        )
      );
      return response.filePath;
    } catch (error) {
      console.error('❌ Photo upload failed after 3 retries:', filename, error);
      throw error;
    }
  }

  private photos = signal<PhotoItem[]>([]);
  
  getPhotos() {
    return this.photos;
  }
  
  addPhotos(newPhotos: PhotoItem[]): void {
    this.photos.set([...this.photos(), ...newPhotos]);
  }
  
  deletePhoto(index: number): void {
    this.photos.update(photos => photos.filter((_, i) => i !== index));
  }

  async loadUserPhotos(): Promise<PhotoInfo[]> {
    const userId = this.auth.getUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }

    try {
      const photos = await firstValueFrom(
        this.http.get<PhotoInfo[]>(`${this.API_URL}/${userId}`)
      );
      return photos;
    } catch (error) {
      console.error('Failed to load photos:', error);
      throw error;
    }
  }

  getPhotoUrl(relativePath: string): string {
    return `https://10.0.0.89:7296/photos/${relativePath}`;
  }
}

export interface PhotoInfo {
  fileName: string;
  relativePath: string;
  createdAt: string;
  sizeInBytes: number;
}
