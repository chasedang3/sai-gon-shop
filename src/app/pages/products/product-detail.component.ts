import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, signal } from '@angular/core';

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}

@Component({
  standalone: true,
  selector: 'app-product-detail',
  imports: [CommonModule, NgOptimizedImage, CurrencyPipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent {
  readonly placeholderImage = 'assets/images/placeholder-product.jpg';

  product = signal<Product>({
    id: 'p1',
    name: 'Tranh Sơn Dầu Hoàng Hôn Phòng Khách',
    price: 2_500_000,
    imageUrl: 'assets/images/PG9108.jpg',
    description:
      'Bức tranh sơn dầu phong cách hiện đại, tông màu ấm, phù hợp trang trí phòng khách, phòng ngủ hoặc không gian làm việc. Chất liệu sơn dầu cao cấp, màu sắc bền đẹp theo thời gian.',
  });

  imageUrlOrPlaceholder(): string {
    const current = this.product();
    return current.imageUrl?.trim() ? current.imageUrl : this.placeholderImage;
  }
}

