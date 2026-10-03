import React from "react";
import Image from "next/image";
import { Plus, Minus, X } from "lucide-react";
import { CartItemType, useCartStore } from "@/store/cart-store";
import Link from "next/link";

export function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleQtyChange = (type: "inc" | "dec") => {
    if (type === "inc" && item.quantity < item.maxQuantity) {
      updateQuantity(item.id, item.quantity + 1);
    } else if (type === "dec" && item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  return (
    <div className="flex py-6 border-b border-black/10">
      {/* Product Image */}
      <div className="w-24 h-32 relative bg-secondary flex-shrink-0">
        <Link href={`/product/${item.productId}`}>
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover object-center"
            sizes="96px"
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="ml-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <Link href={`/product/${item.productId}`} className="hover:underline underline-offset-4 font-heading uppercase tracking-widest text-sm text-black leading-tight pr-4">
              {item.name}
            </Link>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeItem(item.id);
              }}
              className="text-black/50 hover:text-black transition-colors -mt-1 -mr-1 p-1 cursor-pointer relative z-10"
              aria-label="Remove item"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="font-sans text-sm text-black/60 mt-1">Size: {item.sizeValue}</p>
        </div>

        <div className="flex items-end justify-between mt-4">
          {/* Quantity Selector */}
          <div className="flex items-center border border-black w-24 h-9">
            <button 
              onClick={() => handleQtyChange("dec")}
              disabled={item.quantity <= 1}
              className="flex-1 flex items-center justify-center text-black hover:bg-black/5 disabled:opacity-50 h-full"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input 
              type="text"
              inputMode="numeric"
              className="w-10 text-center font-sans text-sm bg-transparent focus:outline-none appearance-none"
              value={item.quantity}
              onChange={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = 1;
                updateQuantity(item.id, Math.min(Math.max(1, val), item.maxQuantity));
              }}
            />
            <button 
              onClick={() => handleQtyChange("inc")}
              disabled={item.quantity >= item.maxQuantity}
              className="flex-1 flex items-center justify-center text-black hover:bg-black/5 disabled:opacity-50 h-full"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Price */}
          <span className="font-sans font-medium text-black">
            RS. {(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
