import React from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/products/ProductGrid";
import { api } from "@/lib/api";

export async function NewArrivals() {
  let recentProducts: any[] = [];
  try {
    const res = await api.products.list({ limit: 8, sort: 'newest' });
    recentProducts = res.data?.slice(0, 8) || [];
  } catch (error) {
    console.error("Failed to fetch new arrivals:", error);
  }

  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-baseline justify-between mb-10 border-b border-black/10 pb-4">
          <h2 className="text-2xl md:text-4xl font-heading font-bold uppercase tracking-widest text-black">
            New Arrivals
          </h2>
          <Link
            href="/shop"
            className="hidden md:inline-block text-black font-heading uppercase text-sm tracking-widest hover:underline underline-offset-4 mt-4 md:mt-0"
          >
            View All
          </Link>
        </div>

        {/* Product Grid */}
        <ProductGrid products={recentProducts} />

        {/* Mobile View All Button */}
        <div className="mt-10 flex justify-center md:hidden">
          <Link
            href="/shop"
            className="inline-block border border-black bg-transparent text-black px-8 py-3 font-heading uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}
