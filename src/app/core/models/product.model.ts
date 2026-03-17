export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  type: string;
  isAvailable: boolean;
  categoryIds: string[];
}

