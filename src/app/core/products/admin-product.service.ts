import { Injectable } from '@angular/core';
import { delay, map, Observable, of, throwError } from 'rxjs';

export type ProductType = 'canvas' | 'poster' | 'frame';

export type ProductEditModel = {
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  type: ProductType;
  isAvailable: boolean;
  categoryIds: string[];
};

export type ProductEntity = ProductEditModel & { id: string };

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  // Mock in-memory DB. Replace with real API later.
  private readonly products = new Map<string, ProductEntity>();

  constructor() {
    // Seed a few items (IDs match list page format).
    this.seed([
      {
        id: 'prd_001',
        title: 'Tác phẩm #1 — CANVAS',
        description: 'Mô tả mẫu cho sản phẩm #1.',
        price: 975000,
        imageUrl:
          'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=60',
        type: 'canvas',
        isAvailable: true,
        categoryIds: ['7f2e0e67-7d1f-4d94-8a2c-97f18fd2f8d1']
      },
      {
        id: 'prd_010',
        title: 'Tác phẩm #10 — POSTER',
        description: 'Mô tả mẫu cho sản phẩm #10.',
        price: 2100000,
        imageUrl:
          'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=600&q=60',
        type: 'poster',
        isAvailable: false,
        categoryIds: ['b5d92c20-cc92-4fd2-8c89-f4d2e0c1d933']
      }
    ]);
  }

  getById(id: string): Observable<ProductEntity> {
    const value = this.products.get(id);
    if (!value) {
      return throwError(() => new Error('Không tìm thấy sản phẩm.')).pipe(delay(450));
    }
    return of(value).pipe(delay(450));
  }

  update(id: string, payload: ProductEditModel): Observable<ProductEntity> {
    const exists = this.products.has(id);
    if (!exists) {
      return throwError(() => new Error('Không tìm thấy sản phẩm để cập nhật.')).pipe(delay(650));
    }

    const updated: ProductEntity = { id, ...payload };
    this.products.set(id, updated);

    return of(updated).pipe(delay(650));
  }

  private seed(items: ProductEntity[]) {
    for (const p of items) this.products.set(p.id, p);
  }
}

