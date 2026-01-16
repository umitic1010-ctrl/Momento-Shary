import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../auth';
import { ThemeService } from '../theme.service';


@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Navbar {
protected readonly auth = inject(Auth);
private readonly router = inject(Router);
protected readonly themeService = inject(ThemeService);
protected menuOpen = signal(false);

protected toggleMenu(): void {
  this.menuOpen.update(open => !open);
}

protected closeMenu(): void {
  this.menuOpen.set(false);
}

protected logout(): void {
  this.auth.logout();
  this.closeMenu();
  this.router.navigate(['/login']);
  }
}
