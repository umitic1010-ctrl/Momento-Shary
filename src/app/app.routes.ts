import { Routes } from '@angular/router';
import { PhotoCounter } from './photo-counter/photo-counter';
import { Home } from './home/home';
import { ContextShare } from './context-share/context-share';
import { Login } from './login/login';
import { authGuard } from './auth-guard';
import { QrScannerComponent } from './qr-scanner/qr-scanner';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer';
import { ImageChrono } from './image-chrono/image-chrono';
import { WorkplaceHierarchy } from './workplace-hierarchy/workplace-hierarchy';

export const routes: Routes = [
    { path: 'login', component: Login },   
    { path: 'photo', component: PhotoCounter, canActivate: [authGuard] },
    { path: 'home', component: Home, canActivate: [authGuard] },
    { path: 'gallery', component: ImageChrono, canActivate: [authGuard] },
    { path: 'workplaces', component: WorkplaceHierarchy, canActivate: [authGuard] },
    { path: 'qr-scanner', component: QrScannerComponent, canActivate: [authGuard] },
    { path: 'pdfs', component: PdfViewerComponent, canActivate: [authGuard] },
    //{ path: 'share', component: Share },
    { path: 'context-share', component: ContextShare, canActivate: [authGuard] },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
