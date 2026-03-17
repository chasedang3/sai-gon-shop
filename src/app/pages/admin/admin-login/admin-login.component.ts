import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

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

  private readonly formValid = toSignal(
    this.form.statusChanges.pipe(
      startWith(this.form.status),
      map(() => this.form.valid)
    ),
    { initialValue: this.form.valid }
  );

  readonly canSubmit = computed(() => this.formValid() && this.state() !== 'loading');

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
        next: (ok) => {
          if (!ok) {
            this.state.set('error');
            this.errorMessage.set('Email hoặc mật khẩu không đúng.');
            return;
          }

          this.state.set('success');
          void this.router.navigateByUrl('/admin/products');
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

