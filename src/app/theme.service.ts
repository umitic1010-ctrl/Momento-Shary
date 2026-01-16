import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'momento_theme';
  
  readonly theme = signal<Theme>(this.loadTheme());
  readonly effectiveTheme = signal<'light' | 'dark'>('light');
  
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  constructor() {
    // Watch for system preference changes
    this.mediaQuery.addEventListener('change', () => {
      this.updateEffectiveTheme();
    });
    
    // Apply theme on initialization
    effect(() => {
      this.updateEffectiveTheme();
      this.applyTheme(this.effectiveTheme());
    });
  }
  
  setTheme(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.updateEffectiveTheme();
  }
  
  toggleTheme(): void {
    const current = this.theme();
    if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('auto');
    } else {
      this.setTheme('light');
    }
  }
  
  private updateEffectiveTheme(): void {
    const theme = this.theme();
    if (theme === 'auto') {
      this.effectiveTheme.set(this.mediaQuery.matches ? 'dark' : 'light');
    } else {
      this.effectiveTheme.set(theme);
    }
  }
  
  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  private loadTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
    return stored || 'auto';
  }
}
