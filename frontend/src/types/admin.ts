import { ReactNode } from "react";

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type OrderStatus = 'ORDER_PLACED' | 'PAYMENT_CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'PENDING' | 'PAYMENT_PENDING' | 'PAID' | 'FAILED';
export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';
export type MediaType = 'IMAGE' | 'VIDEO';

export interface ProductVariant {
  id?: string;
  size: string;
  sku: string;
  stock: number;
  priceOverride?: number;
}

export interface ProductMedia {
  id?: string;
  type: MediaType;
  url: string;
  sortOrder: number;
  posterUrl?: string;
  alt?: string;
}

export interface Product {
  category: ReactNode;
  id: string;
  name: string;
  slug: string;
  description: string;
  categories: string[];
  price: number;
  compareAtPrice?: number;
  status: ProductStatus;
  variants: ProductVariant[];
  media: ProductMedia[];
  createdAt: string;
  updatedAt: string;
  // Computed fields for admin tables
  variantsCount?: number;
  totalStock?: number;
}

export interface Inventory {
  id: string;
  productId: string;
  productName: string;
  image?: string;
  size: string;
  sku: string;
  available: number;
  reserved: number;
  total: number;
  status: InventoryStatus;
  lastUpdated: string;
}

export interface OrderItem {
  id: string;
  name: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  provider: string;
  paymentId: string;
  amount: number;
  status: PaymentStatus;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderTimelineEvent {
  event: string;
  date: string | null;
  completed: boolean;
}

export interface OrderAction {
  action: string;
  label: string;
  type: "primary" | "danger";
}

export interface Order {
  id: string;
  createdDate: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customer: OrderCustomer;
  shippingAddress: ShippingAddress;
  products: OrderItem[];
  payment: Payment;
  timeline: OrderTimelineEvent[];
  availableActions: OrderAction[];
  // For lists:
  itemsCount?: number;
  total?: number;
  // Tracking fields
  trackingNumber?: string;
  trackingUrl?: string;
  courier?: string;
  shippingDate?: string;
  estimatedDelivery?: string;
  deliveryNotes?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
  status: AccountStatus;
  avatarUrl?: string;
  createdAt: string;
}
