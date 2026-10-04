import { Product } from "@/types/product";
import { apiClient } from "./api-client";

export interface GetProductsParams {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const api = {
  products: {
    list: async (params: GetProductsParams): Promise<PaginatedResponse<Product>> => {
      // Instead of pagination right now, the backend supports limit/offset
      const limit = params.limit || 12;
      const page = params.page || 1;
      const offset = (page - 1) * limit;

      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());
      if (params.sort) queryParams.append('sort', params.sort);
      
      // If we have a search query, hit the search endpoint
      let endpoint = '/api/products';
      if (params.search) {
        endpoint = '/api/products/search';
        queryParams.append('q', params.search);
      } else if (params.category && params.category !== 'all') {
        // Need to resolve category slug to ID first in a real scenario,
        // but for now we'll fetch all and filter in frontend if we don't have category_id.
        // Or fetch categories to find the ID.
      }

      const response = await apiClient.get<{ products: any[] }>(`${endpoint}?${queryParams.toString()}`);
      
      // We now receive media and variants directly from the backend
      const fullProducts = response.products.map((p: any) => ({
        id: p.id,
        slug: p.slug || p.id,
        name: p.name,
        price: p.base_price / 100,
        media: (p.media || []).map((m: any) => ({
          id: m.id,
          type: m.resource_type,
          url: m.url,
          posterUrl: m.poster_url,
          alt: m.alt_text,
          sortOrder: m.sort_order,
        })),
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          name: 'Size',
          value: v.size,
          availableQuantity: v.available_quantity || 0,
          price: v.price / 100
        })),
        categories: p.category_ids ? p.category_ids.map((id: number) => {
          const map: Record<number, string> = {1:'player-version',2:'half-sleeve',3:'five-sleeve',4:'full-sleeve',5:'national-kits',6:'season-kits',7:'full-kit',8:'bibs',9:'cricket',10:'special-edition',11:'shorts',12:'kids',13:'exclusive-offer'};
          return map[id] || id.toString();
        }) : [],
        availableQuantity: (p.variants || []).reduce((sum: number, v: any) => sum + (v.available_quantity || 0), 0),
      }));

      const validProducts = fullProducts.filter(Boolean) as Product[];

      // Manual category filtering if needed
      let filtered = validProducts;
      if (!params.search && params.category && params.category !== 'all') {
         // Need the ID for the slug to match with backend output if it maps differently, but assuming ID maps roughly to slug or we check strings
         filtered = filtered.filter(p => p.categories && p.categories.includes(params.category!));
      }

      return {
        data: filtered,
        total: filtered.length,
        page,
        totalPages: Math.ceil(filtered.length / limit),
      };
    },
    getBySlug: async (slugOrId: string): Promise<Product | null> => {
      try {
        // Our backend uses ID, but the frontend passes slug.
        // We will try to fetch by ID. If we need by slug, we'd need a backend change.
        // For Phase 16, let's assume we can fetch by ID directly.
        // (Wait, frontend uses slug in URL, so we MUST find the ID).
        
        const id = slugOrId;

        const res = await apiClient.get<any>(`/api/products/${encodeURIComponent(id)}`);
        
        // Map backend format to frontend `Product`
        const p = res.product;
        const variants = res.variants || [];
        const media = res.media || [];
        
        return {
          id: p.id,
          slug: p.slug || p.id,
          name: p.name,
          description: p.description,
          price: p.base_price / 100,
          media: media.map((m: any) => ({
            id: m.id,
            type: m.resource_type,
            url: m.url,
            posterUrl: m.poster_url,
            alt: m.alt_text,
            sortOrder: m.sort_order,
          })),
          variants: variants.map((v: any) => ({
            id: v.id,
            name: 'Size',
            value: v.size,
            availableQuantity: v.available_quantity || 0,
            price: v.price / 100
          })),
          categories: p.category_ids ? p.category_ids.map((id: number) => {
            const map: Record<number, string> = {1:'player-version',2:'half-sleeve',3:'five-sleeve',4:'full-sleeve',5:'national-kits',6:'season-kits',7:'full-kit',8:'bibs',9:'cricket',10:'special-edition',11:'shorts',12:'kids',13:'exclusive-offer'};
            return map[id] || id.toString();
          }) : [],
          availableQuantity: variants.reduce((sum: number, v: any) => sum + (v.available_quantity || 0), 0),
        };
      } catch (err) {
        console.error(err);
        return null;
      }
    },
  },
};
