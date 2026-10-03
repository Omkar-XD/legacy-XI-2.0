export interface ProductVariant {
  id: string;
  name: string;
  value: string; // e.g., "S", "M", "L"
  size?: string;
  availableQuantity: number;
  priceOverride?: number;
  price?: number;
}

export interface ProductMedia {
  id: string;
  type: "image" | "video";
  url: string;
  posterUrl?: string;
  alt?: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  media: ProductMedia[];
  variants: ProductVariant[];
  badge?: string; // e.g., "SALE", "NEW"
  categories?: string[];
  description?: string;
  availableQuantity: number;
}
