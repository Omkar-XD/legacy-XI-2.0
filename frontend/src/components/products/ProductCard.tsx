"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/cart-store";
import { toast } from "react-hot-toast";

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  const sortedMedia = [...(product.media || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const hasMultipleImages = sortedMedia.length > 1;

  const currentMedia = sortedMedia[currentIdx] || null;
  // If not hovered and at index 0, but we have multiple images, maybe we show second on hover?
  // User asked for arrows, so let's just show the current index.

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % sortedMedia.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev - 1 + sortedMedia.length) % sortedMedia.length);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we have variants
    const variants = product.variants || [];
    if (variants.length === 0) {
      toast.error("This product is currently unavailable.");
      return;
    }
    
    // If multiple variants (e.g. sizes), we might not want to quick add, or just pick the first available
    const availableVariant = variants.find(v => v.availableQuantity > 0);
    
    if (!availableVariant) {
      toast.error("This product is sold out.");
      return;
    }
    
    try {
      await addItem(
        availableVariant.id, 
        1, 
        availableVariant.availableQuantity,
        product.name,
        availableVariant.price ?? product.price,
        sortedMedia[0]?.url || '',
        availableVariant.size || 'OS',
        product.id
      );
      toast.success(`${product.name} added to cart`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add to cart");
    }
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block w-full bg-white relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
        {/* Badge */}
        {product.badge && (
          <div className="absolute top-2 right-2 z-10 bg-black text-white px-2 py-1 text-[10px] font-heading tracking-widest uppercase">
            {product.badge}
          </div>
        )}



        {currentMedia?.type?.toLowerCase() === "video" ? (
          <video
            key={currentMedia.id}
            src={currentMedia.url}
            poster={currentMedia.posterUrl}
            muted
            loop
            playsInline
            autoPlay
            className="object-cover object-center absolute inset-0 w-full h-full transition-opacity duration-300"
          />
        ) : (
          <Image
            key={currentMedia?.id || 'placeholder'}
            src={currentMedia?.url || "/placeholder.jpg"}
            alt={currentMedia?.alt || product.name}
            fill
            className="object-cover object-center transition-opacity duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}
        
        {/* Carousel Arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrev}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/10 hover:bg-black/80 text-white rounded-full transition-all duration-300 ${
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/10 hover:bg-black/80 text-white rounded-full transition-all duration-300 ${
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className={`absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center bg-black hover:bg-black/80 text-white rounded-full transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
        </button>

        {/* Sold Out Overlay */}
        {product.availableQuantity <= 0 && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
            <span className="bg-black text-white px-4 py-2 text-xs font-heading tracking-widest uppercase">
              Sold Out
            </span>
          </div>
        )}

        {/* Premium Shine Effect */}
        <div 
          className={`absolute top-[-50%] w-[50%] h-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transform rotate-[20deg] transition-all duration-700 ease-in-out pointer-events-none z-30 ${
            isHovered ? 'left-[150%]' : 'left-[-100%]'
          }`} 
        />
      </div>

      {/* Product Details */}
      <div className="pt-2 flex flex-col items-start w-full relative">
        <div className="flex justify-between items-start w-full">
          <div className="pr-2 overflow-hidden w-full">
            <h3 className="text-black font-heading font-bold uppercase text-[13px] md:text-sm tracking-wide truncate">
              Legacy XI
            </h3>
            <p className="text-black/60 font-sans text-[11px] md:text-xs truncate w-full">
              {product.name}
            </p>
          </div>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} 
            className="text-black/40 hover:text-red-500 transition-colors flex-shrink-0"
            aria-label="Add to wishlist"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[13px] md:text-sm font-sans">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-black/50 line-through text-[11px] md:text-xs">
              RS. {product.compareAtPrice.toFixed(0)}
            </span>
          )}
          <span className="text-black font-bold">
            RS. {product.price.toFixed(0)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-[#FF905A] font-bold text-[11px] md:text-xs">
              {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
