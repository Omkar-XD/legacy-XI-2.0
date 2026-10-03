"use client";

import React, { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartItem } from "./CartItem";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function CartDrawer() {
  const { isOpen, closeCart, items } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  
  // Hydration mismatch fix for Zustand persist
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-white p-0 flex flex-col border-l border-black/10 shadow-2xl">
        <SheetHeader className="p-6 border-b border-black/10 text-left">
          <div className="flex justify-between items-center">
            <SheetTitle className="font-heading uppercase tracking-widest text-xl text-black">
              Your Cart ({itemCount})
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Cart Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
              <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-black/40" />
              </div>
              <div>
                <p className="font-heading uppercase tracking-widest text-lg text-black mb-2">
                  Your cart is empty
                </p>
                <p className="font-sans text-sm text-black/60">
                  Looks like you haven&apos;t added any items to your cart yet.
                </p>
              </div>
              <button
                onClick={closeCart}
                className="bg-black text-white px-8 py-4 font-heading uppercase tracking-widest text-sm hover:bg-black/80 transition-colors w-full"
              >
                Continue Shopping
              </button>
              
              <div className="pt-8 border-t border-black/10 w-full">
                <p className="font-sans text-sm text-black/60 mb-4">Have an account?</p>
                <Link 
                  href="/login" 
                  onClick={closeCart}
                  className="block bg-white border border-black text-black px-8 py-4 font-heading uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors w-full"
                >
                  Log In
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-black/10 bg-white">
            <div className="flex justify-between items-center mb-6">
              <span className="font-heading uppercase tracking-widest text-sm text-black">Subtotal</span>
              <span className="font-sans font-medium text-lg text-black">RS. {subtotal.toFixed(2)}</span>
            </div>
            <p className="font-sans text-xs text-black/60 mb-6">
              Shipping, taxes, and discounts calculated at checkout.
            </p>
            <Link
              href={isLoggedIn ? "/checkout" : "/login?redirect=/checkout"}
              onClick={closeCart}
              className="block text-center w-full bg-black text-white py-4 font-heading uppercase tracking-widest text-sm hover:bg-black/80 transition-colors"
            >
              Checkout
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
