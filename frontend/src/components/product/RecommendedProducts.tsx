import React from "react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { api } from "@/lib/api";
import { Product } from "@/types/product";

export async function RecommendedProducts({ currentProductId }: { currentProductId: string }) {
  // Simple recommendation logic: get 4 random or next products excluding current
  const res = await api.products.list({ limit: 4 });
  const recommendations: Product[] = res.data
    .filter((p) => p.id !== currentProductId)
    .slice(0, 4);

  if (recommendations.length === 0) return null;

  return (
    <section className="w-full mt-24 pt-16 border-t border-black/10">
      <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-widest text-black text-center mb-10">
        You May Also Like
      </h2>
      <ProductGrid products={recommendations} />
    </section>
  );
}
