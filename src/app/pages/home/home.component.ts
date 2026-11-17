import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Category } from '../../core/categories/category.model';
import { CategoryService } from '../../core/categories/category.service';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

interface FeaturedCollection {
  title: string;
  image: string;
  /** Tên danh mục trên API, theo thứ tự ưu tiên nếu tiêu đề thẻ không khớp đúng. */
  matchNames: string[];
}

const FEATURED_COLLECTIONS: FeaturedCollection[] = [
  {
    title: 'Tranh Hiện Đại',
    image: 'assets/images/son-dau-bg.jpg',
    matchNames: ['Tổng hợp mẫu Hiện đại', 'Hiện đại', 'Hiện đại'],
  },
  {
    title: 'Tranh Tối Giản',
    image: 'assets/images/toi-gian-bg.jpg',
    matchNames: ['Tối giản', 'Tối Giản'],
  },
  {
    title: 'Tranh Phong Cảnh',
    image: 'assets/images/phong-canh-bg.jpg',
    matchNames: ['Phong Cảnh', 'Phong cảnh'],
  },
  {
    title: 'Tranh Trừu Tượng',
    image: 'assets/images/truu-tuong-bg.jpg',
    matchNames: ['Trừu Tượng', 'Trừu tượng'],
  },
  {
    title: 'Tranh Hoa',
    image: 'assets/images/hoa-bg.jpg',
    matchNames: ['Hoa', 'Bình Hoa'],
  },
  {
    title: 'Tranh Động Vật',
    image: 'assets/images/dong-vat-bg.jpg',
    matchNames: ['Động vật', 'Động Vật'],
  },
];

function normalizeCategoryName(value: string): string {
  return value.normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);

  readonly featuredCollections = FEATURED_COLLECTIONS;
  readonly featuredProducts = signal<Product[]>([]);
  readonly featuredLoading = signal(true);
  readonly featuredError = signal<string | null>(null);
  private readonly categories = signal<Category[]>([]);

  constructor() {
    this.categoryService.getCategories().subscribe({
      next: (items) => this.categories.set(items ?? []),
      error: () => this.categories.set([]),
    });

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

  trackCollection(_index: number, item: FeaturedCollection): string {
    return item.title;
  }

  /** Query giống bộ lọc danh mục trên trang sản phẩm: ?category=<id>&page=1 */
  collectionQuery(item: FeaturedCollection): Params {
    const category = this.categoryIdFor(item);
    return category ? { category, page: 1 } : { page: 1 };
  }

  private categoryIdFor(item: FeaturedCollection): string | null {
    const byName = new Map<string, string>();
    for (const category of this.categories()) {
      const key = normalizeCategoryName(category.name);
      if (key && category.id && !byName.has(key)) {
        byName.set(key, category.id);
      }
    }

    const stripped = item.title.replace(/^tranh\s+/i, '');
    const candidates = [item.title, stripped, ...item.matchNames];
    for (const name of candidates) {
      const id = byName.get(normalizeCategoryName(name));
      if (id) return id;
    }
    return null;
  }
}
