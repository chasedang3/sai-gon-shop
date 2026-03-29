import { CommonModule, CurrencyPipe, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, map, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  standalone: true,
  selector: 'app-product-detail',
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly document = inject(DOCUMENT);

  readonly placeholderImage = 'assets/images/placeholder-product.jpg';

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  readonly imageLightboxOpen = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.document.body.style.overflow = '';
    });
    this.route.paramMap
      .pipe(
        map((p) => p.get('id')),
        filter((id): id is string => !!id?.trim()),
        switchMap((id) => {
          this.loading.set(true);
          this.error.set(null);
          this.imageLightboxOpen.set(false);
          this.document.body.style.overflow = '';
          return this.productService.getProductById(id);
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: (p) => {
          this.product.set(p);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.product.set(null);
          this.loading.set(false);
          this.error.set(err instanceof Error ? err.message : 'Không thể tải sản phẩm.');
        },
      });
  }

  imageUrlOrPlaceholder(): string {
    const current = this.product();
    if (!current) {
      return this.placeholderImage;
    }
    return current.imageUrl?.trim() ? current.imageUrl : this.placeholderImage;
  }

  openImageLightbox(): void {
    this.imageLightboxOpen.set(true);
    this.document.body.style.overflow = 'hidden';
  }

  closeImageLightbox(): void {
    this.imageLightboxOpen.set(false);
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseLightbox(): void {
    if (this.imageLightboxOpen()) {
      this.closeImageLightbox();
    }
  }
}
