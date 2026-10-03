"use client";

import React, { useState } from "react";
import { Product } from "@/types/product";
import { ProductAccordion } from "./ProductAccordion";
import { Plus, Minus, ChevronDown, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

export function ProductInfo({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const hasVariants = product.variants && product.variants.length > 0;
  
  // Find selected variant to enforce quantity rules
  const activeVariant = hasVariants 
    ? product.variants!.find(v => v.id === selectedSize) 
    : undefined;

  const maxAvailable = activeVariant 
    ? activeVariant.availableQuantity 
    : product.availableQuantity;

  const isOutOfStock = maxAvailable <= 0;
  const displayPrice = activeVariant?.price ?? product.price;

  const handleQtyChange = (type: "inc" | "dec") => {
    if (type === "inc" && quantity < maxAvailable) {
      setQuantity(q => q + 1);
    } else if (type === "dec" && quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Availability Indicator */}
      <div className="mb-5 flex items-center space-x-2">
        <span className={`w-3 h-3 rounded-full ${isOutOfStock ? "bg-red-500" : "bg-[#f4a261]"}`} />
        <span className="font-heading uppercase font-semibold text-sm text-black/60 tracking-widest">
          {isOutOfStock ? "SOLD OUT" : `${maxAvailable} LEFT`}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-heading font-bold uppercase tracking-tight text-black leading-[1] mb-8">
        {product.name}
      </h1>

      <hr className="border-black/30 mb-6" />

      {/* Description */}
      {product.description && (
        <div className="mb-8 text-black/80 font-sans text-sm leading-relaxed whitespace-pre-wrap">
          {product.description}
        </div>
      )}

      {/* Size Selector */}
      {hasVariants && (
        <div className="mb-6 w-full">
          <label htmlFor="size-select" className="block font-heading font-bold uppercase tracking-widest text-sm text-black mb-3">
            SIZE
          </label>
          <div className="relative w-full">
            <select
              id="size-select"
              value={selectedSize}
              onChange={(e) => {
                setSelectedSize(e.target.value);
                setQuantity(1);
              }}
              className="w-full h-[60px] appearance-none border border-black/30 px-4 font-sans text-sm bg-white text-black focus:outline-none focus:border-black transition-colors rounded-none"
            >
              <option value="" disabled>Select Size</option>
              {product.variants!.map((variant) => (
                <option key={variant.id} value={variant.id} disabled={variant.availableQuantity <= 0}>
                  {variant.value} {variant.availableQuantity <= 0 ? "(Out of Stock)" : ""}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-black">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Price */}
      <div className="flex items-center space-x-3 mb-3">
        <span className="text-base font-sans font-bold text-black">
          RS. {displayPrice.toFixed(2)}
        </span>
        {product.compareAtPrice && product.compareAtPrice > displayPrice && (
          <span className="text-base font-sans line-through text-black/40 font-semibold">
            RS. {product.compareAtPrice.toFixed(2)}
          </span>
        )}
      </div>

      {/* Size chart */}
      <button className="text-left font-sans text-sm text-black/60 hover:text-black mb-8 w-fit underline underline-offset-4">
        Size chart
      </button>

      {/* Quantity & Add to Cart (Same Row) */}
      <div className="flex flex-row space-x-4 mb-4 w-full items-stretch h-[60px]">
        {/* Quantity Selector */}
        <div className="flex items-center border border-black/30 shrink-0 w-[140px] bg-white">
          <button 
            onClick={() => handleQtyChange("dec")}
            disabled={quantity <= 1 || isOutOfStock}
            className="w-12 text-black hover:bg-black/5 disabled:opacity-50 transition-colors h-full flex items-center justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input 
            type="text"
            inputMode="numeric"
            className="flex-1 text-center font-sans text-sm font-semibold bg-transparent focus:outline-none appearance-none min-w-0"
            value={isOutOfStock ? 0 : quantity}
            onChange={(e) => {
              if (isOutOfStock) return;
              let val = parseInt(e.target.value);
              if (isNaN(val)) val = 1;
              setQuantity(Math.min(Math.max(1, val), maxAvailable));
            }}
            disabled={isOutOfStock}
          />
          <button 
            onClick={() => handleQtyChange("inc")}
            disabled={quantity >= maxAvailable || isOutOfStock}
            className="w-12 text-black hover:bg-black/5 disabled:opacity-50 transition-colors h-full flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add to Cart */}
        <button 
          disabled={isOutOfStock || (hasVariants && !selectedSize)}
          onClick={async () => {
            if (!useAuthStore.getState().isLoggedIn) {
              router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
              return;
            }
            if (activeVariant) {
              await addItem(
                activeVariant.id,
                quantity,
                maxAvailable,
                product.name,
                displayPrice,
                product.media[0]?.url || "",
                activeVariant.value,
                product.id
              );
            } else {
              await addItem(
                "", // No variant ID
                quantity,
                maxAvailable,
                product.name,
                displayPrice,
                product.media[0]?.url || "",
                "Default",
                product.id
              );
            }
          }}
          className="flex-1 bg-black text-white font-heading font-bold uppercase tracking-widest text-xs md:text-sm hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 h-full rounded-none"
        >
          <ShoppingBag className="w-4 h-4 hidden sm:block" />
          <span>{isOutOfStock ? "SOLD OUT" : "ADD TO CART"}</span>
        </button>
      </div>

      {/* Buy it Now */}
      <button 
        disabled={isOutOfStock || (hasVariants && !selectedSize)}
        onClick={async () => {
          if (!useAuthStore.getState().isLoggedIn) {
            router.push("/login?redirect=/checkout");
            return;
          }
          if (activeVariant) {
            await addItem(
              activeVariant.id,
              quantity,
              maxAvailable,
              product.name,
              displayPrice,
              product.media[0]?.url || "",
              activeVariant.value,
              product.id
            );
          } else {
            await addItem(
              "", // No variant ID
              quantity,
              maxAvailable,
              product.name,
              displayPrice,
              product.media[0]?.url || "",
              "Default",
              product.id
            );
          }
          router.push("/checkout");
        }}
        className="w-full h-[60px] bg-black border border-black text-white font-heading font-bold uppercase tracking-widest text-sm hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8 rounded-none"
      >
        BUY IT NOW
      </button>

      {/* Accordions */}
      <ProductAccordion description={product.description} />
    </div>
  );
}
