import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  standalone: true,
  selector: 'app-product-list',
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);

  readonly Math = Math;
  readonly pageSize = 12;

  products = signal<Product[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  currentPage = signal(1);

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  totalPagesArray = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  constructor() {
    toObservable(this.currentPage)
      .pipe(
        switchMap((page) => {
          this.loading.set(true);
          this.error.set(null);
          return this.productService
            .getProductsPage({ page, pageSize: this.pageSize, all: false })
            .pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: ({ items, totalCount }) => {
          this.products.set(items);
          this.totalCount.set(totalCount);
          const maxPage = Math.max(1, Math.ceil(totalCount / this.pageSize));
          if (this.currentPage() > maxPage) {
            this.currentPage.set(maxPage);
          }
        },
        error: (err: unknown) => {
          this.products.set([]);
          this.totalCount.set(0);
          this.error.set(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm.');
        },
      });
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(page, 1), this.totalPages());
    this.currentPage.set(clamped);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((current) => current - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((current) => current + 1);
    }
  }

  trackByProductId(_index: number, product: Product): string {
    return product.id;
  }

  trackByPage(_index: number, page: number): number {
    return page;
  }
}
