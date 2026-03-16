import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

type LoginState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly passwordVisible = signal(false);
  readonly state = signal<LoginState>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  readonly canSubmit = computed(() => this.form.valid && this.state() !== 'loading');

  togglePasswordVisibility(): void {
    this.passwordVisible.update(v => !v);
  }

  markAllTouched(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.markAllTouched();
      return;
    }

    this.state.set('loading');

    const { email, password } = this.form.getRawValue();

    this.auth
      .login(email, password)
      .pipe(
        finalize(() => {
          if (this.state() === 'loading') this.state.set('idle');
        })
      )
      .subscribe({
        next: () => {
          this.state.set('success');
          // Mock success handling: redirect to an admin landing page later.
          // For now, route to home (or update to /admin when you create it).
          void this.router.navigateByUrl('/');
        },
        error: (err: unknown) => {
          this.state.set('error');
          this.errorMessage.set(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
        }
      });
  }

  // Convenience getters for template readability
  get emailCtrl() {
    return this.form.controls.email;
  }

  get passwordCtrl() {
    return this.form.controls.password;
  }
}

