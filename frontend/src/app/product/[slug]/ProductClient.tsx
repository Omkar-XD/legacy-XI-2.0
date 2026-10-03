"use client";

import React from "react";
import { Product } from "@/types/product";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";

export function ProductClient({ product, children }: { product: Product, children?: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col pt-4 md:pt-10 pb-16">
      <div className="container mx-auto px-4">
        {/* Breadcrumb / Top Bar */}
        <div className="mb-6 hidden md:block">
          <nav className="font-heading uppercase tracking-widest text-xs text-black/50">
            Home / Shop / {product.categories?.[0] || 'Uncategorized'} / <span className="text-black">{product.name}</span>
          </nav>
        </div>

        {/* Main Product Area */}
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(380px,0.9fr)] lg:gap-[7%] xl:gap-20">
          {/* Gallery (Left) */}
          <div className="w-full">
            <ProductGallery product={product} />
          </div>

          {/* Info (Right) */}
          <div className="w-full lg:max-w-[480px] mt-8 lg:mt-0">
            <div className="sticky top-24">
              <ProductInfo product={product} />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {children}
      </div>
    </div>
  );
}
