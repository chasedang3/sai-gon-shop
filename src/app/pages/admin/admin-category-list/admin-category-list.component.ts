import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../../core/categories/category.service';
import { finalize } from 'rxjs';

interface Category {
  id: string;
  name: string;
  description?: string;
}

type PageState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-admin-category-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-category-list.component.html',
  styleUrl: './admin-category-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCategoryListComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly state = signal<PageState>('loading');
  readonly errorMessage = signal<string | null>(null);
  readonly categories = signal<Category[]>([]);

  // Delete modal
  readonly deleteModalOpen = signal(false);
  readonly selectedToDelete = signal<Category | null>(null);
  readonly deletingId = signal<string | null>(null);

  constructor() {
    this.load();
  }

  goToCreate(): void {
    void this.router.navigateByUrl('/admin/categories/create');
  }

  load(): void {
    this.state.set('loading');
    this.errorMessage.set(null);

    this.categoryService.getCategories().subscribe({
      next: (items) => {
        this.categories.set(items ?? []);
        this.state.set('ready');
      },
      error: (err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[AdminCategoryList] load failed', err);
        this.state.set('error');
        this.errorMessage.set(err instanceof Error ? err.message : 'Không thể tải danh sách danh mục.');
      }
    });
  }

  openDeleteModal(category: Category): void {
    if (this.deletingId()) return;
    this.selectedToDelete.set(category);
    this.deleteModalOpen.set(true);
    this.errorMessage.set(null);
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

    this.categoryService
      .deleteCategory(target.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.deleteModalOpen.set(false);
          this.selectedToDelete.set(null);
          this.load();
        },
        error: (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error('[AdminCategoryList] delete failed', err);
          this.errorMessage.set(err instanceof Error ? err.message : 'Xoá danh mục thất bại. Vui lòng thử lại.');
        }
      });
  }

  trackByCategoryId(_index: number, item: Category): string {
    return item.id;
  }

  editPlaceholder(_category: Category): void {
    // Placeholder for future edit navigation.
  }
}

