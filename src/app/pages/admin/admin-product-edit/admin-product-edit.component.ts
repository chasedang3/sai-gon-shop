import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminProductService, ProductEditModel, ProductType } from '../../../core/products/admin-product.service';

type Category = { id: string; name: string };
type PageState = 'loading' | 'ready' | 'saving' | 'success' | 'error';

function hasAtLeastOneCategory(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

@Component({
  selector: 'app-admin-product-edit',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, RouterLink],
  templateUrl: 'admin-product-edit.component.html',
  styleUrl: 'admin-product-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProductEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(AdminProductService);

  readonly state = signal<PageState>('loading');
  readonly errorMessage = signal<string | null>(null);
  readonly productId = signal<string | null>(null);

  readonly categories = signal<Category[]>([
    { id: '7f2e0e67-7d1f-4d94-8a2c-97f18fd2f8d1', name: 'Phong cảnh' },
    { id: 'b5d92c20-cc92-4fd2-8c89-f4d2e0c1d933', name: 'Trừu tượng' }
  ]);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    price: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    imageUrl: ['', [Validators.required]],
    type: this.fb.nonNullable.control<ProductType>('canvas', [Validators.required]),
    isAvailable: this.fb.nonNullable.control(true),
    categoryIds: this.fb.nonNullable.control<string[]>([], [
      control => (hasAtLeastOneCategory(control.value) ? null : { minSelected: true })
    ])
  });

  readonly imagePreviewUrl = computed(() => {
    const url = (this.form.controls.imageUrl.value ?? '').trim();
    return url.length > 0 ? url : null;
  });

  readonly canSubmit = computed(() => this.form.valid && this.state() !== 'saving' && this.state() !== 'loading');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.set('error');
      this.errorMessage.set('Thiếu mã sản phẩm trong đường dẫn.');
      this.form.disable({ emitEvent: false });
      return;
    }

    this.productId.set(id);
    this.load(id);
  }

  private load(id: string): void {
    this.state.set('loading');
    this.errorMessage.set(null);
    this.form.disable({ emitEvent: false });

    this.productService.getById(id).subscribe({
      next: entity => {
        this.form.patchValue({
          title: entity.title,
          description: entity.description,
          price: entity.price,
          imageUrl: entity.imageUrl,
          type: entity.type,
          isAvailable: entity.isAvailable,
          categoryIds: [...entity.categoryIds]
        });
        this.form.enable({ emitEvent: false });
        this.state.set('ready');
      },
      error: (err: unknown) => {
        this.state.set('error');
        this.errorMessage.set(err instanceof Error ? err.message : 'Không thể tải sản phẩm. Vui lòng thử lại.');
        this.form.disable({ emitEvent: false });
      }
    });
  }

  markAllTouched(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });
  }

  isCategorySelected(id: string): boolean {
    return this.form.controls.categoryIds.value.includes(id);
  }

  trackByCategoryId(_index: number, item: Category): string {
    return item.id;
  }

  toggleCategory(id: string): void {
    const current = this.form.controls.categoryIds.value;
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    this.form.controls.categoryIds.setValue(next);
    this.form.controls.categoryIds.markAsTouched();
    this.form.controls.categoryIds.updateValueAndValidity({ emitEvent: false });
  }

  cancel(): void {
    void this.router.navigateByUrl('/admin/products');
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.markAllTouched();
      return;
    }

    const id = this.productId();
    if (!id) return;

    this.state.set('saving');
    this.form.disable({ emitEvent: false });

    const payload: ProductEditModel = this.form.getRawValue();

    // eslint-disable-next-line no-console
    console.log('[AdminProductEdit] payload', { id, ...payload });

    this.productService
      .update(id, payload)
      .pipe(
        finalize(() => {
          // If update failed, form is re-enabled in error handler. If success, we navigate away.
        })
      )
      .subscribe({
        next: () => {
          this.state.set('success');
          void this.router.navigateByUrl('/admin/products');
        },
        error: (err: unknown) => {
          this.state.set('ready');
          this.form.enable({ emitEvent: false });
          this.errorMessage.set(err instanceof Error ? err.message : 'Cập nhật thất bại. Vui lòng thử lại.');
        }
      });
  }

  get titleCtrl() {
    return this.form.controls.title;
  }
  get descriptionCtrl() {
    return this.form.controls.description;
  }
  get priceCtrl() {
    return this.form.controls.price;
  }
  get imageUrlCtrl() {
    return this.form.controls.imageUrl;
  }
  get typeCtrl() {
    return this.form.controls.type;
  }
  get categoryIdsCtrl() {
    return this.form.controls.categoryIds;
  }
}

