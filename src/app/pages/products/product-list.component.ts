import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
}

@Component({
  standalone: true,
  selector: 'app-product-list',
  imports: [CommonModule, NgOptimizedImage, CurrencyPipe],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent {
  Math = Math;

  readonly categories = ['All', 'Painting', 'Sculpture', 'Digital Art'] as const;
  readonly pageSize = 9;

  products = signal<Product[]>([
    {
      id: 'p1',
      name: 'Tranh Sơn Dầu Hoàng Hôn',
      price: 2500000,
      imageUrl: 'assets/images/PG9108.jpg',
      category: 'Painting',
    },
    {
      id: 'p2',
      name: 'Tranh Sơn Dầu Phong Cảnh Biển',
      price: 2800000,
      imageUrl: 'assets/images/son-dau-bg.jpg',
      category: 'Painting',
    },
    {
      id: 'p3',
      name: 'Tranh Canvas Tối Giản Hình Khối',
      price: 1800000,
      imageUrl: 'assets/images/toi-gian-bg.jpg',
      category: 'Digital Art',
    },
    {
      id: 'p4',
      name: 'Tranh Canvas Phong Cảnh Thành Phố',
      price: 1900000,
      imageUrl: 'assets/images/phong-canh-bg.jpg',
      category: 'Digital Art',
    },
    {
      id: 'p5',
      name: 'Tượng Điêu Khắc Trừu Tượng',
      price: 3200000,
      imageUrl: 'assets/images/truu-tuong-bg.jpg',
      category: 'Sculpture',
    },
    {
      id: 'p6',
      name: 'Tượng Decor Phòng Khách',
      price: 2100000,
      imageUrl: 'assets/images/dong-vat-bg.jpg',
      category: 'Sculpture',
    },
    {
      id: 'p7',
      name: 'Bộ Tranh Canvas Hoa Vintage',
      price: 1600000,
      imageUrl: 'assets/images/hoa-bg.jpg',
      category: 'Painting',
    },
    {
      id: 'p8',
      name: 'Tranh Canvas Phòng Ngủ Tối Giản',
      price: 1450000,
      imageUrl: 'assets/images/trang-tri-1.jpg',
      category: 'Digital Art',
    },
    {
      id: 'p9',
      name: 'Bộ Tranh Canvas Phòng Khách',
      price: 2750000,
      imageUrl: 'assets/images/phong-khach-2.jpg',
      category: 'Painting',
    },
    {
      id: 'p10',
      name: 'Tượng Decor Đầu Cổ Điển',
      price: 2950000,
      imageUrl: 'assets/images/trang-tri-2.jpg',
      category: 'Sculpture',
    },
    {
      id: 'p11',
      name: 'Tranh Canvas Động Vật Nghệ Thuật',
      price: 1850000,
      imageUrl: 'assets/images/dong-vat-bg.jpg',
      category: 'Digital Art',
    },
    {
      id: 'p12',
      name: 'Tranh Sơn Dầu Cổ Điển',
      price: 3100000,
      imageUrl: 'assets/images/son-dau-bg.jpg',
      category: 'Painting',
    },
  ]);

  selectedCategory = signal<string>('All');
  currentPage = signal<number>(1);

  filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const allProducts = this.products();

    if (category === 'All') {
      return allProducts;
    }

    return allProducts.filter((product) => product.category === category);
  });

  totalItems = computed(() => this.filteredProducts().length);

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize)),
  );

  totalPagesArray = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  paginatedProducts = computed(() => {
    const page = this.currentPage();
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    return this.filteredProducts().slice(startIndex, endIndex);
  });

  constructor() {
    effect(() => {
      this.selectedCategory();
      this.currentPage.set(1);
    });

    effect(() => {
      const totalPages = this.totalPages();
      const current = this.currentPage();

      if (current > totalPages) {
        this.currentPage.set(totalPages);
      }
    });
  }

  setCategory(category: string): void {
    if (this.selectedCategory() === category) {
      return;
    }
    this.selectedCategory.set(category);
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

