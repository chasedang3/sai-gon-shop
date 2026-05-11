import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { CategoryService } from '../../../core/categories/category.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/categories/category.model';

type LoadState = 'idle' | 'loading' | 'error';
type PageToken = number | '...';

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './admin-product-list.component.html',
  styleUrl: './admin-product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProductListComponent {
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  readonly Math = Math;

  readonly state = signal<LoadState>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly categories = signal<Category[]>([]);

  private readonly categoryNameById = computed(() => {
    const map = new Map<string, string>();
    for (const c of this.categories()) map.set(c.id, c.name);
    return map;
  });

  /** Chỉ chứa đúng sản phẩm của trang hiện tại (theo API). */
  readonly products = signal<Product[]>([]);
  /** Tổng số từ API (toàn bộ trang). */
  readonly totalCount = signal(0);

  readonly pageSize = 12;
  readonly page = signal(1);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  readonly pages = computed<PageToken[]>(() => {
    const totalPages = this.totalPages();
    const current = this.page();

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const tokens: PageToken[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);

    if (start > 2) tokens.push('...');
    for (let p = start; p <= end; p += 1) tokens.push(p);
    if (end < totalPages - 1) tokens.push('...');

    tokens.push(totalPages);
    return tokens;
  });

  readonly rangeStart = computed(() =>
    this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize, this.totalCount()),
  );

  readonly deleteModalOpen = signal(false);
  readonly selectedToDelete = signal<Product | null>(null);
  readonly deletingId = signal<string | null>(null);

  constructor() {
    this.loadCategories();

    toObservable(this.page)
      .pipe(
        switchMap((page) => {
          this.state.set('loading');
          this.errorMessage.set(null);
          return this.productService
            .getProductsPage({ page, pageSize: this.pageSize, all: false })
            .pipe(finalize(() => this.state.set('idle')));
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ items, totalCount }) => {
          this.products.set(items ?? []);
          this.totalCount.set(totalCount);
          const maxPage = Math.max(1, Math.ceil(totalCount / this.pageSize));
          if (this.page() > maxPage) {
            this.page.set(maxPage);
          }
        },
        error: (err: unknown) => {
          this.products.set([]);
          this.totalCount.set(0);
          this.state.set('error');
          this.errorMessage.set(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm.');
        },
      });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (items) => this.categories.set(items ?? []),
      error: () => this.categories.set([]),
    });
  }

  /** Đồng bộ lại danh sách trang hiện tại (sau xoá, v.v.). */
  private reloadCurrentPageFromApi(): void {
    const p = this.page();
    this.state.set('loading');
    this.errorMessage.set(null);
    this.productService
      .getProductsPage({ page: p, pageSize: this.pageSize, all: false })
      .pipe(finalize(() => this.state.set('idle')))
      .subscribe({
        next: ({ items, totalCount }) => {
          this.products.set(items ?? []);
          this.totalCount.set(totalCount);
          const maxPage = Math.max(1, Math.ceil(totalCount / this.pageSize));
          if (this.page() > maxPage) {
            this.page.set(maxPage);
          }
        },
        error: (err: unknown) => {
          this.errorMessage.set(err instanceof Error ? err.message : 'Không thể tải lại danh sách.');
        },
      });
  }

  openDeleteModal(p: Product): void {
    if (this.deletingId()) return;
    this.selectedToDelete.set(p);
    this.deleteModalOpen.set(true);
    this.errorMessage.set(null);
  }

  trackByProductId(_index: number, item: Product): string {
    return item.id;
  }

  trackByString(_index: number, item: string): string {
    return item;
  }

  trackByPageToken(index: number, item: PageToken): string {
    return `${item}-${index}`;
  }

  closeDeleteModal(): void {
    if (this.deletingId()) return;
    this.deleteModalOpen.set(false);
    this.selectedToDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.selectedToDelete();
    if (!target) return;

    this.deletingId.set(target.id);
    this.errorMessage.set(null);

    this.productService
      .deleteProduct(target.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.deleteModalOpen.set(false);
          this.selectedToDelete.set(null);
          this.reloadCurrentPageFromApi();
        },
        error: (err: unknown) => {
          this.errorMessage.set(err instanceof Error ? err.message : 'Xoá sản phẩm thất bại. Vui lòng thử lại.');
        },
      });
  }

  goToCreate(): void {
    void this.router.navigateByUrl('/admin/products/create');
  }

  goToEdit(p: Product): void {
    void this.router.navigate(['/admin/products/edit', p.id]);
  }

  formatVnd(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
      price ?? 0,
    );
  }

  categoryLabels(ids: string[]): string[] {
    const map = this.categoryNameById();
    return (ids ?? []).map((id) => map.get(id) ?? 'Khác');
  }

  setPage(p: number): void {
    const maxP = this.totalPages();
    const safe = Math.min(Math.max(1, p), maxP);
    this.page.set(safe);
  }

  prevPage(): void {
    this.setPage(this.page() - 1);
  }

  nextPage(): void {
    this.setPage(this.page() + 1);
  }
}
