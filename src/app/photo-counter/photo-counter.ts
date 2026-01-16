import { Component, inject } from '@angular/core';
import { PhotoService } from '../photo-service';
import { PhotoGallery } from '../photo-gallery/photo-gallery';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-photo-counter',
  imports: [PhotoGallery, RouterLink],
  templateUrl: './photo-counter.html',
  styleUrl: './photo-counter.css',
})
export class PhotoCounter {
  protected readonly photoService = inject(PhotoService);

  protected save(): void {
    const photos = this.photoService.getPhotos()();
    // Use the PhotoService method to get the correct path
    const folderPath = this.photoService.getUserPhotoPath();
    
    console.log('Saving photos to:', folderPath);
    console.log('Photos:', photos);
    // TODO: Send photos to backend API to save to network folder
  }
}
