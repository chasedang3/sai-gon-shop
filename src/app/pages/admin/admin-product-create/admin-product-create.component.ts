import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Category } from '../../../core/categories/category.model';
import { CategoryService } from '../../../core/categories/category.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

type ProductType = 'Canvas' | 'SonDau' | 'TrangGuong';

type ProductCreateModel = Omit<Product, 'id'> & { type: ProductType };

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

function hasAtLeastOneCategory(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

@Component({
  selector: 'app-admin-product-create',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-product-create.component.html',
  styleUrl: './admin-product-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProductCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);

  readonly state = signal<SubmitState>('idle');
  readonly errorMessage = signal<string | null>(null);
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

  readonly filteredCategories = computed(() => {
    const keyword = this.categorySearchTerm().trim().toLowerCase();
    if (!keyword) return this.categories();

    return this.categories().filter(c => {
      const name = (c.name ?? '').toLowerCase();
      const id = c.id.toLowerCase();
      return name.includes(keyword) || id.includes(keyword);
    });
  });

  constructor() {
    const imageUrlFromQuery = this.route.snapshot.queryParamMap.get('imageUrl')?.trim();
    if (imageUrlFromQuery) {
      this.form.controls.imageUrl.setValue(imageUrlFromQuery);
    }
    this.loadCategories();
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

  onCategorySearchChange(value: string): void {
    this.categorySearchTerm.set(value);
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
    void this.router.navigateByUrl('/');
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.markAllTouched();
      return;
    }

    this.state.set('loading');

    const payload: ProductCreateModel = this.form.getRawValue();

    // Mock submit handler requirement
    // eslint-disable-next-line no-console
    console.log('[AdminProductCreate] payload', payload);

    this.productService
      .createProduct(payload)
      .pipe(
        finalize(() => {
          if (this.state() === 'loading') this.state.set('idle');
        })
      )
      .subscribe({
        next: () => {
          this.state.set('success');
          // Reset form for quick consecutive creation
          this.form.reset({
            title: '',
            description: '',
            price: 0,
            imageUrl: '',
            type: 'Canvas',
            isAvailable: true,
            categoryIds: []
          });
        },
        error: (err: unknown) => {
          this.state.set('error');
          this.errorMessage.set(err instanceof Error ? err.message : 'Tạo sản phẩm thất bại. Vui lòng thử lại.');
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
    return this.form.valid && this.state() !== 'loading';
  }
}

