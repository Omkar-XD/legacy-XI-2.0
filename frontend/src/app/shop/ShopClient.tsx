"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { ShopToolbar } from "@/components/shop/ShopToolbar";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { GetProductsParams } from "@/lib/api";

export function ShopClient() {
  const searchParams = useSearchParams();
  
  const params: GetProductsParams = {
    category: searchParams.get("category") || undefined,
    search: searchParams.get("search") || undefined,
    sort: searchParams.get("sort") || undefined,
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: 12,
  };

  const { products, total, isLoading, error } = useProducts(params);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase tracking-widest text-black">
          Shop {params.category && params.category !== "all" ? `- ${params.category.replace("-", " ")}` : ""}
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <ShopFilters />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ShopToolbar totalProducts={total} />
          
          {isLoading ? (
            <div className="w-full py-20 flex justify-center items-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="w-full py-12 text-center text-red-500 font-heading uppercase tracking-widest text-sm">
              Failed to load products.
            </div>
          ) : (
            <ProductGrid products={products} />
          )}

          {/* Simple Pagination Placeholder */}
          {!isLoading && total > params.limit! && (
            <div className="mt-16 flex justify-center border-t border-black/10 pt-8">
               <button className="border border-black bg-white text-black px-8 py-3 font-heading uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors">
                 Load More
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
