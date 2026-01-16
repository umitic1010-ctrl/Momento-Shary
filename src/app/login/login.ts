import { Component, inject, signal } from '@angular/core';
import { Auth } from '../auth';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  protected readonly auth = inject(Auth);
  protected readonly router = inject(Router);

  protected username = signal('');
  protected password = signal('');
  protected readonly errorMessage = signal('');
  
  async submit() {
    const success = await this.auth.login(this.username(), this.password());
    if (success) {
      this.errorMessage.set('');
      console.log('Login successful!');
      this.router.navigate(['/home']);
    } else {
      this.errorMessage.set('Invalid username or password');
    }
  }
}
