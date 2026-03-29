import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../core/categories/category.service';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-admin-category-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-category-create.component.html',
  styleUrl: './admin-category-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCategoryCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);

  readonly state = signal<SubmitState>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: this.fb.nonNullable.control<string>('')
  });

  private readonly formValid = toSignal(
    this.form.statusChanges.pipe(
      startWith(this.form.status),
      map(() => this.form.valid)
    ),
    { initialValue: this.form.valid }
  );

  readonly canSubmit = computed(() => this.formValid() && this.state() !== 'loading');

  markAllTouched(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });
  }

  cancel(): void {
    void this.router.navigateByUrl('/admin/categories');
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.markAllTouched();
      return;
    }

    this.state.set('loading');

    const raw = this.form.getRawValue();
    const payload: { name: string; description?: string } = {
      name: raw.name.trim(),
      description: raw.description.trim() || undefined
    };

    this.categoryService
      .createCategory(payload)
      .pipe(
        finalize(() => {
          if (this.state() === 'loading') this.state.set('idle');
        })
      )
      .subscribe({
        next: () => {
          this.state.set('success');
          void this.router.navigateByUrl('/admin/categories');
        },
        error: (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error('[AdminCategoryCreate] create failed', err);
          this.state.set('error');
          this.errorMessage.set(err instanceof Error ? err.message : 'Tạo danh mục thất bại. Vui lòng thử lại.');
        }
      });
  }

  get nameCtrl() {
    return this.form.controls.name;
  }

  get descriptionCtrl() {
    return this.form.controls.description;
  }
}

