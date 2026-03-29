export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  type: string;
  isAvailable: boolean;
  categoryIds: string[];
  /** Present when API returns category navigation (e.g. Artworks list/detail). */
  categories?: ProductCategory[];
}

