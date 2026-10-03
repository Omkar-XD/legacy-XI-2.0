"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/data/categories";

export function ShopFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    params.delete("page"); // Reset page on filter change
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      <div>
        <h3 className="font-heading uppercase tracking-widest text-lg font-bold mb-4 border-b border-black/10 pb-2">
          Categories
        </h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="shop-category"
              value="all"
              checked={currentCategory === "all"}
              onChange={() => handleCategoryChange("all")}
              className="w-4 h-4 accent-black"
            />
            <span className={`font-heading uppercase tracking-widest text-sm transition-colors ${
              currentCategory === "all" ? "text-black font-bold" : "text-black/60 hover:text-black"
            }`}>
              All Products
            </span>
          </label>
          
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="shop-category"
                value={cat.slug}
                checked={currentCategory === cat.slug}
                onChange={() => handleCategoryChange(cat.slug)}
                className="w-4 h-4 accent-black"
              />
              <span className={`font-heading uppercase tracking-widest text-sm transition-colors ${
                currentCategory === cat.slug ? "text-black font-bold" : "text-black/60 hover:text-black"
              }`}>
                {cat.title}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
