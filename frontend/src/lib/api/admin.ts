"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Product, 
  Inventory, 
  Order, 
  Customer, 
  OrderStatus
} from "@/types/admin";

import { apiClient } from "../api-client";

const CATEGORY_MAP: Record<string, number> = {
  'player-version': 1,
  'half-sleeve': 2,
  'five-sleeve': 3,
  'full-sleeve': 4,
  'national-kits': 5,
  'season-kits': 6,
  'full-kit': 7,
  'bibs': 8,
  'cricket': 9,
  'special-edition': 10,
  'shorts': 11,
  'kids': 12,
  'exclusive-offer': 13
};

const REVERSE_CATEGORY_MAP: Record<number, string> = Object.entries(CATEGORY_MAP).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {} as Record<number, string>);

export function useProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/api/admin/products?limit=100');
      return res.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        categories: Array.isArray(p.category_ids) ? p.category_ids.map((id: number) => REVERSE_CATEGORY_MAP[id] || 'player-version') : ['player-version'],
        price: p.base_price / 100,
        status: p.is_active ? 'ACTIVE' : 'INACTIVE',
        variantsCount: (p.variants || []).length,
        totalStock: (p.variants || []).reduce((acc: number, v: any) => acc + (v.available_quantity || 0), 0),
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          stock: v.available_quantity
        })),
        media: (p.media || []).map((m: any) => ({
          id: m.id,
          url: m.url
        })),
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/api/admin/products/${id}`);
      return {
        id: res.product.id,
        name: res.product.name,
        description: res.product.description,
        slug: res.product.slug,
        categories: Array.isArray(res.product.category_ids) ? res.product.category_ids.map((id: number) => REVERSE_CATEGORY_MAP[id] || 'player-version') : ['player-version'],
        price: res.product.base_price / 100,
        compareAtPrice: res.product.compare_at_price ? res.product.compare_at_price / 100 : undefined,
        status: res.product.is_active ? 'ACTIVE' : 'DRAFT',
        variants: (res.variants || []).map((v: any) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          priceOverride: v.price_override != null ? v.price_override / 100 : "",
          stock: v.available_quantity
        })),
        media: (res.media || []).map((m: any) => ({
          id: m.id,
          type: m.resource_type === 'video' ? 'VIDEO' : 'IMAGE',
          url: m.url,
          sortOrder: m.sort_order
        }))
      };
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/ /g, '-'),
        description: data.description,
        base_price: Math.round(data.price * 100),
        category_ids: data.categories ? data.categories.map((c: string) => CATEGORY_MAP[c] || 1) : [1],
        is_active: data.status === 'ACTIVE'
      };
      const res = await apiClient.post<any>('/api/admin/products', payload);
      const product = res.product;
      
      // Create variants
      if (data.variants && data.variants.length > 0) {
        for (const variant of data.variants) {
          const variantPayload = {
            sku: variant.sku,
            size: variant.size,
            available_quantity: Number(variant.stock) || 0,
            price_override: variant.priceOverride ? Math.round(Number(variant.priceOverride) * 100) : null
          };
          await apiClient.post(`/api/admin/products/${product.id}/variants`, variantPayload);
        }
      }
      
      // Upload media files or create manually via URL
      if (data.media && data.media.length > 0) {
        const uploadErrors = [];
        for (let i = 0; i < data.media.length; i++) {
          const m = data.media[i];
          try {
            if (m.file) {
              const formData = new FormData();
              formData.append('file', m.file);
              formData.append('resource_type', m.type === 'VIDEO' ? 'video' : 'image');
              formData.append('sort_order', i.toString());
              if (m.alt) formData.append('alt_text', m.alt);
              
              await apiClient.post(`/api/admin/products/${product.id}/media`, formData);
            } else if (m.url && !m.url.startsWith('blob:')) {
              await apiClient.post(`/api/admin/products/${product.id}/media-url`, {
                url: m.url,
                resource_type: m.type === 'VIDEO' ? 'video' : 'image',
                sort_order: i
              });
            }
          } catch (err: any) {
            console.error(`Failed to upload media ${i}:`, err);
            uploadErrors.push(err.message || 'Unknown upload error');
          }
        }
        
        if (uploadErrors.length > 0) {
          throw new Error(`Product created, but media upload failed: ${uploadErrors.join(', ')}`);
        }
      }
      
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload: any = {};
      if (data.name) payload.name = data.name;
      if (data.description) payload.description = data.description;
      if (data.price !== undefined) payload.base_price = Math.round(data.price * 100);
      if (data.status) payload.is_active = data.status === 'ACTIVE';
      if (data.categories) payload.category_ids = data.categories.map((c: string) => CATEGORY_MAP[c] || 1);
      
      const res = await apiClient.patch<any>(`/api/admin/products/${id}`, payload);
      const product = res.product;
      
      if (data.variants && data.variants.length > 0) {
        for (const variant of data.variants) {
          const variantPayload = {
            sku: variant.sku,
            size: variant.size,
            available_quantity: Number(variant.stock) || 0,
            price_override: variant.priceOverride ? Math.round(Number(variant.priceOverride) * 100) : null
          };
          
          if (variant.id) {
            await apiClient.patch(`/api/admin/variants/${variant.id}`, variantPayload);
          } else {
            await apiClient.post(`/api/admin/products/${id}/variants`, variantPayload);
          }
        }
      }
      
      if (data.media && data.media.length > 0) {
        const uploadErrors = [];
        for (let i = 0; i < data.media.length; i++) {
          const m = data.media[i];
          try {
            // Just insert new media directly for now (in a real app, delete old or update)
            if (m.file && !m.id) {
              const formData = new FormData();
              formData.append('file', m.file);
              formData.append('resource_type', m.type === 'VIDEO' ? 'video' : 'image');
              formData.append('sort_order', i.toString());
              if (m.alt) formData.append('alt_text', m.alt);
              
              await apiClient.post(`/api/admin/products/${id}/media`, formData);
            } else if (m.url && !m.id && !m.url.startsWith('blob:')) {
              await apiClient.post(`/api/admin/products/${id}/media-url`, {
                url: m.url,
                resource_type: m.type === 'VIDEO' ? 'video' : 'image',
                sort_order: i
              });
            }
          } catch (err: any) {
            console.error(`Failed to upload media ${i}:`, err);
            uploadErrors.push(err.message || 'Unknown upload error');
          }
        }
        
        if (uploadErrors.length > 0) {
          throw new Error(`Product updated, but media upload failed: ${uploadErrors.join(', ')}`);
        }
      }
      
      return product;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', variables.id] });
    }
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/admin/products/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  });
}

export function useInventory() {
  return useQuery({
    queryKey: ['admin-inventory'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/api/admin/inventory?limit=100');
      return res.inventory.map((inv: any) => ({
        id: inv.variant_id,
        productId: inv.product_id,
        productName: inv.product_name,
        size: inv.size,
        sku: inv.sku,
        available: inv.available_quantity,
        reserved: inv.reserved_quantity,
        total: inv.available_quantity + inv.reserved_quantity,
        status: inv.available_quantity === 0 ? "OUT_OF_STOCK" : (inv.available_quantity < 5 ? "LOW_STOCK" : "IN_STOCK"),
        lastUpdated: inv.updated_at || inv.created_at
      }));
    }
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId, available }: { variantId: string, available: number }) => {
      await apiClient.patch(`/api/admin/inventory/${variantId}`, { available_quantity: available });
      return { variantId, available };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    }
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/api/admin/orders?limit=100');
      return res.orders.map((o: any) => ({
        id: o.id,
        createdDate: o.created_at,
        paymentStatus: o.payment_status || o.status,
        orderStatus: o.status,
        customer: { name: 'Customer', email: o.user_id }, // Need relations for more
        total: o.total_amount / 100,
        itemsCount: o.items_count || 0,
        products: o.products || [],
      }));
    }
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/api/admin/orders/${id}`);
      return {
        id: res.order.id,
        createdDate: res.order.created_at,
        paymentStatus: res.order.payment_status || res.order.status,
        orderStatus: res.order.status,
        customer: { name: res.order.customer?.name || 'Customer', email: res.order.customer?.email || res.order.user_id, phone: res.order.customer?.phone },
        shippingAddress: res.order.shipping_address || {},
        total: res.order.total_amount / 100,
        itemsCount: res.items.length,
        tracking: {
          courier: res.order.courier || '',
          trackingNumber: res.order.tracking_number || '',
          trackingUrl: res.order.tracking_url || '',
          shipDate: res.order.shipped_at,
          estDelivery: res.order.estimated_delivery_date,
          deliveryNotes: res.order.delivery_notes || ''
        },
        products: res.items.map((i: any) => ({
          id: i.id,
          name: i.product_name || 'Product',
          variant: i.variant_size || '',
          quantity: i.quantity,
          unitPrice: (i.price_at_time || 0) / 100,
          total: ((i.price_at_time || 0) * i.quantity) / 100
        })),
        payment: { 
          provider: res.order.payment_provider || 'N/A', 
          paymentId: res.order.payment_id || 'N/A', 
          status: res.order.payment_status || 'PENDING',
          amount: (res.order.total_amount || 0) / 100 
        },
        timeline: res.order.tracking_timeline || [], 
        availableActions: [
          { action: "PAID", label: "Mark Paid", type: "primary" },
          { action: "SHIPPED", label: "Mark Shipped", type: "primary" },
          { action: "DELIVERED", label: "Mark Delivered", type: "primary" }
        ]
      };
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, action, trackingData }: { orderId: string, action?: string, trackingData?: any }) => {
      if (action) {
        await apiClient.post(`/api/admin/orders/${orderId}/transition`, { status: action });
      }
      if (trackingData) {
        await apiClient.patch(`/api/admin/orders/${orderId}/tracking`, trackingData);
      }
      return { orderId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order', variables.orderId] });
    }
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/api/admin/customers');
      return res.customers.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        ordersCount: c.ordersCount,
        totalSpent: c.totalSpent / 100, // convert cents to dollars/rupees
        status: c.status,
        avatarUrl: c.avatar_url,
        createdAt: c.createdAt
      }));
    }
  });
}
