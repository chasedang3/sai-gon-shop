import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, finalize, switchMap } from 'rxjs';
import { Category } from '../../core/categories/category.model';
import { CategoryService } from '../../core/categories/category.service';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

/** Một danh mục: ?category=id — hỗ trợ ?categories=id (legacy, lấy id đầu). */
function parseCategoryIdFromQuery(q: ParamMap): string | null {
  const direct = q.get('category')?.trim();
  if (direct) return direct;
  const legacy = q.get('categories')?.trim();
  if (legacy) {
    const first = legacy.split(',')[0]?.trim();
    return first || null;
  }
  return null;
}

function categoryFilterKey(q: ParamMap): string {
  return parseCategoryIdFromQuery(q) ?? '';
}

/** Giá trị gửi API — khớp backend. */
export const ARTWORK_TYPE_OPTIONS = [
  { value: 'SonDau', label: 'Sơn dầu' },
  { value: 'TrangGuong', label: 'Tranh gương' },
  { value: 'Canvas', label: 'Canvas' },
] as const;

const ALLOWED_ARTWORK_TYPES: Set<string> = new Set<string>(
  ARTWORK_TYPE_OPTIONS.map((o) => o.value),
);

function parseArtworkTypeFromQuery(q: ParamMap): string | null {
  const raw = q.get('type')?.trim();
  if (!raw || !ALLOWED_ARTWORK_TYPES.has(raw)) return null;
  return raw;
}

function artworkTypeFilterKey(q: ParamMap): string {
  return parseArtworkTypeFromQuery(q) ?? '';
}

@Component({
  standalone: true,
  selector: 'app-product-list',
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly Math = Math;
  readonly pageSize = 12;

  products = signal<Product[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  currentPage = signal(1);
  /** Đang lọc theo một danh mục, hoặc null = tất cả. */
  selectedCategoryId = signal<string | null>(null);
  /** SonDau | TrangGuong | Canvas — null = tất cả loại. */
  selectedArtworkType = signal<string | null>(null);

  readonly artworkTypeOptions = ARTWORK_TYPE_OPTIONS;

  allCategories = signal<Category[]>([]);
  categoriesLoadError = signal<string | null>(null);
  categorySearch = signal('');
  filterPanelOpen = signal(false);

  readonly categoryNameById = computed(() => {
    const m = new Map<string, string>();
    for (const c of this.allCategories()) {
      if (c.id) m.set(c.id, c.name);
    }
    return m;
  });

  readonly filteredCategories = computed(() => {
    const q = this.categorySearch().trim().toLowerCase();
    const all = this.allCategories();
    if (!q) return all;
    return all.filter((c) => c.name.toLowerCase().includes(q));
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  readonly totalPagesArray = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  constructor() {
    this.categoryService.getCategories().subscribe({
      next: (items) => this.allCategories.set(items.filter((c) => c.id)),
      error: () => this.categoriesLoadError.set('Không tải được danh mục.'),
    });

    this.route.queryParamMap
      .pipe(
        distinctUntilChanged(
          (a, b) =>
            (a.get('page') || '1') === (b.get('page') || '1') &&
            categoryFilterKey(a) === categoryFilterKey(b) &&
            artworkTypeFilterKey(a) === artworkTypeFilterKey(b),
        ),
        switchMap((q) => {
          const page = Math.max(1, parseInt(q.get('page') || '1', 10) || 1);
          const categoryId = parseCategoryIdFromQuery(q);
          const artworkType = parseArtworkTypeFromQuery(q);
          this.currentPage.set(page);
          this.selectedCategoryId.set(categoryId);
          this.selectedArtworkType.set(artworkType);
          this.products.set([]);
          this.totalCount.set(0);
          this.loading.set(true);
          this.error.set(null);
          return this.productService
            .getProductsPage({
              page,
              pageSize: this.pageSize,
              all: false,
              categoryId: categoryId ?? undefined,
              type: artworkType ?? undefined,
            })
            .pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ items, totalCount }) => {
          this.products.set(items ?? []);
          this.totalCount.set(totalCount);
          const snapshotPage = Math.max(
            1,
            parseInt(this.route.snapshot.queryParamMap.get('page') || '1', 10) || 1,
          );
          const maxPage = Math.max(1, Math.ceil(totalCount / this.pageSize));
          if (snapshotPage > maxPage) {
            void this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { page: maxPage },
              queryParamsHandling: 'merge',
              replaceUrl: true,
            });
          }
        },
        error: (err: unknown) => {
          this.products.set([]);
          this.totalCount.set(0);
          this.error.set(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm.');
        },
      });
  }

  selectedCategoryLabel(): string | null {
    const id = this.selectedCategoryId();
    if (!id) return null;
    return this.categoryNameById().get(id) ?? id;
  }

  onCategorySearch(ev: Event): void {
    this.categorySearch.set((ev.target as HTMLInputElement).value);
  }

  toggleFilterPanel(): void {
    this.filterPanelOpen.update((v) => !v);
  }

  selectCategory(id: string | null): void {
    const normalized = id?.trim() || null;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: normalized,
        categories: null,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  clearCategoryFilter(): void {
    this.selectCategory(null);
  }

  selectArtworkType(value: string | null): void {
    const v = value?.trim() ?? null;
    const normalized = v && ALLOWED_ARTWORK_TYPES.has(v) ? v : null;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type: normalized, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  artworkTypeLabel(): string | null {
    const t = this.selectedArtworkType();
    if (!t) return null;
    return ARTWORK_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(page, 1), this.totalPages());
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: clamped },
      queryParamsHandling: 'merge',
    });
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  trackByProductId(_index: number, product: Product): string {
    return product.id;
  }

  trackByPage(_index: number, page: number): number {
    return page;
  }

  trackByCategoryId(_index: number, c: Category): string {
    return c.id;
  }
}
