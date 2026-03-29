import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly productService = inject(ProductService);

  readonly featuredProducts = signal<Product[]>([]);
  readonly featuredLoading = signal(true);
  readonly featuredError = signal<string | null>(null);

  constructor() {
    this.productService
      .getProducts({ page: 1, pageSize: 8, all: false })
      .pipe(finalize(() => this.featuredLoading.set(false)))
      .subscribe({
        next: (items) => this.featuredProducts.set(items ?? []),
        error: (err: unknown) => {
          this.featuredProducts.set([]);
          this.featuredError.set(
            err instanceof Error ? err.message : 'Không thể tải sản phẩm nổi bật.'
          );
        },
      });
  }

  trackFeaturedId(_index: number, product: Product): string {
    return product.id;
  }
}
