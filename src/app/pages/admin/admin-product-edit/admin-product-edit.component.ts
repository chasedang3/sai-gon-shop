import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Category } from '../../../core/categories/category.model';
import { CategoryService } from '../../../core/categories/category.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

type PageState = 'loading' | 'ready' | 'saving' | 'success' | 'error';
type ProductType = 'Canvas' | 'SonDau' | 'TrangGuong';

function hasAtLeastOneCategory(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function toProductType(value: unknown): ProductType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (normalized === 'Canvas' || normalized === 'SonDau' || normalized === 'TrangGuong') {
    return normalized;
  }
  return null;
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
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);

  readonly state = signal<PageState>('loading');
  readonly errorMessage = signal<string | null>(null);
  readonly productId = signal<string | null>(null);
  readonly categoriesErrorMessage = signal<string | null>(null);
  readonly isLoadingCategories = signal<boolean>(true);
  readonly categorySearchTerm = signal<string>('');

  readonly categories = signal<Category[]>([]);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    price: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    imageUrl: ['', [Validators.required]],
    type: this.fb.nonNullable.control<ProductType>('Canvas', [Validators.required]),
    isAvailable: this.fb.nonNullable.control(true),
    categoryIds: this.fb.nonNullable.control<string[]>([], [
      control => (hasAtLeastOneCategory(control.value) ? null : { minSelected: true })
    ])
  });

  filteredCategories(): Category[] {
    const keyword = this.categorySearchTerm().trim().toLowerCase();
    const selectedIds = new Set(this.form.controls.categoryIds.value);

    const filtered = this.categories().filter(c => {
      if (!keyword) return true;
      const name = (c.name ?? '').toLowerCase();
      const id = c.id.toLowerCase();
      return name.includes(keyword) || id.includes(keyword);
    });

    return [...filtered].sort((a, b) => {
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);
      if (aSelected === bSelected) return 0;
      return aSelected ? -1 : 1;
    });
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.set('error');
      this.errorMessage.set('Thiếu mã sản phẩm trong đường dẫn.');
      this.form.disable({ emitEvent: false });
      return;
    }

    this.productId.set(id);
    this.loadCategories();
    this.load(id);
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoriesErrorMessage.set(null);

    this.categoryService.getCategories().subscribe({
      next: categories => {
        this.categories.set(categories);
        this.isLoadingCategories.set(false);
      },
      error: (err: unknown) => {
        this.isLoadingCategories.set(false);
        this.categoriesErrorMessage.set(
          err instanceof Error ? err.message : 'Không thể tải danh mục. Vui lòng thử lại.'
        );
      }
    });
  }

  private load(id: string): void {
    this.state.set('loading');
    this.errorMessage.set(null);
    this.form.disable({ emitEvent: false });

    this.productService.getProductById(id).subscribe({
      next: entity => {
        const resolvedType = toProductType(entity.type) ?? this.form.controls.type.value;
        this.form.patchValue({
          title: entity.title,
          description: entity.description,
          price: entity.price,
          imageUrl: entity.imageUrl,
          type: resolvedType,
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

  onCategorySearchChange(value: string): void {
    this.categorySearchTerm.set(value);
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

    const payload: Partial<Product> = this.form.getRawValue();

    // eslint-disable-next-line no-console
    console.log('[AdminProductEdit] payload', { id, ...payload });

    this.productService
      .updateProduct(id, payload)
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

  imagePreviewUrl(): string | null {
    const url = (this.form.controls.imageUrl.value ?? '').trim();
    return url.length > 0 ? url : null;
  }

  canSubmit(): boolean {
    return this.form.valid && this.state() !== 'saving' && this.state() !== 'loading';
  }
}

