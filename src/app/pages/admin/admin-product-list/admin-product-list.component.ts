import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { delay, finalize, of, throwError } from 'rxjs';

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  type: string;
  isAvailable: boolean;
  categoryIds: string[];
}

type Category = { id: string; name: string };
type LoadState = 'idle' | 'loading' | 'error';

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
  readonly Math = Math;

  readonly state = signal<LoadState>('idle');
  readonly errorMessage = signal<string | null>(null);

  // Mock categories (IDs match create page examples)
  readonly categories = signal<Category[]>([
    { id: '7f2e0e67-7d1f-4d94-8a2c-97f18fd2f8d1', name: 'Phong cảnh' },
    { id: 'b5d92c20-cc92-4fd2-8c89-f4d2e0c1d933', name: 'Trừu tượng' },
    { id: '40a8a9d2-4f8f-45d3-8d5d-6424c1aef9a0', name: 'Tối giản' },
    { id: '0c5bfc1b-48c2-4b0c-a2b9-08b9c69f6e1b', name: 'Chân dung' }
  ]);

  private readonly categoryNameById = computed(() => {
    const map = new Map<string, string>();
    for (const c of this.categories()) map.set(c.id, c.name);
    return map;
  });

  // Mock product data
  readonly products = signal<Product[]>(this.buildMockProducts());

  // Pagination
  readonly pageSize = 10;
  readonly page = signal(1);

  readonly total = computed(() => this.products().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  readonly pages = computed(() => {
    const totalPages = this.totalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  });

  readonly pagedProducts = computed(() => {
    const page = this.page();
    const start = (page - 1) * this.pageSize;
    return this.products().slice(start, start + this.pageSize);
  });

  readonly rangeStart = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1));
  readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize, this.total()));

  // Delete modal
  readonly deleteModalOpen = signal(false);
  readonly selectedToDelete = signal<Product | null>(null);
  readonly deletingId = signal<string | null>(null);

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

  trackByNumber(_index: number, item: number): number {
    return item;
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

    this.mockDeleteProduct(target.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.products.update(list => list.filter(p => p.id !== target.id));
          this.deleteModalOpen.set(false);
          this.selectedToDelete.set(null);

          // Keep current page in range after deletion
          const nextTotalPages = Math.max(1, Math.ceil(this.products().length / this.pageSize));
          if (this.page() > nextTotalPages) this.page.set(nextTotalPages);
        },
        error: (err: unknown) => {
          this.errorMessage.set(err instanceof Error ? err.message : 'Xoá sản phẩm thất bại. Vui lòng thử lại.');
        }
      });
  }

  private mockDeleteProduct(id: string) {
    // Placeholder for future DELETE /products/{id}
    const exists = this.products().some(p => p.id === id);
    return exists ? of(true).pipe(delay(650)) : throwError(() => new Error('Không tìm thấy sản phẩm.')).pipe(delay(650));
  }

  goToCreate(): void {
    void this.router.navigateByUrl('/admin/products/create');
  }

  goToEdit(p: Product): void {
    // Placeholder route for future edit page
    void this.router.navigate(['/admin/products', p.id, 'edit']);
  }

  formatVnd(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price ?? 0);
  }

  categoryLabels(ids: string[]): string[] {
    const map = this.categoryNameById();
    return (ids ?? []).map(id => map.get(id) ?? 'Khác');
  }

  setPage(p: number): void {
    const safe = Math.min(Math.max(1, p), this.totalPages());
    this.page.set(safe);
  }

  prevPage(): void {
    this.setPage(this.page() - 1);
  }

  nextPage(): void {
    this.setPage(this.page() + 1);
  }

  private buildMockProducts(): Product[] {
    const imgs = [
      'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=60',
      'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=600&q=60',
      'https://images.unsplash.com/photo-1520699918507-5423f26f25b4?auto=format&fit=crop&w=600&q=60'
    ];

    const typePool = ['canvas', 'poster', 'frame'];
    const categoryPool = [
      '7f2e0e67-7d1f-4d94-8a2c-97f18fd2f8d1',
      'b5d92c20-cc92-4fd2-8c89-f4d2e0c1d933',
      '40a8a9d2-4f8f-45d3-8d5d-6424c1aef9a0',
      '0c5bfc1b-48c2-4b0c-a2b9-08b9c69f6e1b'
    ];

    const out: Product[] = [];
    for (let i = 1; i <= 23; i++) {
      const id = `prd_${String(i).padStart(3, '0')}`;
      const type = typePool[i % typePool.length];
      const isAvailable = i % 5 !== 0;
      const price = 850_000 + i * 125_000;
      const categoryIds = i % 3 === 0 ? [categoryPool[0], categoryPool[2]] : [categoryPool[i % categoryPool.length]];

      out.push({
        id,
        title: `Tác phẩm #${i} — ${type.toUpperCase()}`,
        price,
        imageUrl: imgs[i % imgs.length],
        type,
        isAvailable,
        categoryIds
      });
    }
    return out;
  }
}

