"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShopFilters } from "./ShopFilters";

export function ShopToolbar({ totalProducts }: { totalProducts: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "featured";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page"); // Reset to page 1 on sort change
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-black/10 mb-8">
      <div className="flex items-center">
        {/* Mobile Filter Trigger */}
        <div className="md:hidden mr-4">
          <Sheet>
            <SheetTrigger 
              className="flex items-center space-x-2 text-sm font-heading uppercase tracking-widest text-black"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white p-6 sm:max-w-md w-full">
              <SheetHeader className="mb-6 border-b border-black/10 pb-4 text-left">
                <SheetTitle className="font-heading text-xl uppercase tracking-widest text-black">
                  Filters
                </SheetTitle>
              </SheetHeader>
              <ShopFilters />
            </SheetContent>
          </Sheet>
        </div>

        {/* Product Count */}
        <span className="font-sans text-sm text-black/60">
          {totalProducts} Product{totalProducts !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center space-x-3">
        <label htmlFor="sort" className="hidden sm:block font-heading uppercase text-xs tracking-widest text-black/70">
          Sort By
        </label>
        <div className="relative">
          <select
            id="sort"
            value={currentSort}
            onChange={handleSortChange}
            className="appearance-none bg-transparent border border-black/20 text-sm font-heading uppercase tracking-widest py-2 pl-4 pr-10 focus:outline-none focus:border-black cursor-pointer rounded-none"
          >
            <option value="featured">Featured</option>
            <option value="newest">New Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-black/50" />
        </div>
      </div>
    </div>
  );
}
