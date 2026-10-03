"use client";

import React from "react";
import Link from "next/link";
import { Search, User, ShoppingBag, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SearchOverlay } from "./SearchOverlay";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Contact Us", href: "/contact" },
  { name: "Tracking & Updates", href: "/tracking" },
  { name: "Return & Exchange Policy", href: "/returns" },
  { 
    name: "Login", 
    href: "/login",
    dropdown: [
      { name: "Customer", href: "/login" },
      { name: "Admin", href: "/admin/login" }
    ]
  },
];

export function Navbar() {
  const { openCart, items } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-black/10">
      <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between relative">
        
        {/* Left: Mobile Menu & Desktop Nav */}
        <div className="flex items-center justify-start z-10">
          <div className="lg:hidden mr-2">
            <Sheet>
              <SheetTrigger className="p-2 -ml-2" aria-label="Open menu">
                <Menu className="w-6 h-6 text-black" />
              </SheetTrigger>
              <SheetContent side="left" className="bg-white p-6 border-r border-black/10">
                <SheetTitle className="font-heading font-bold uppercase text-xl mb-8">Menu</SheetTitle>
                <nav className="flex flex-col space-y-6">
                  {NAV_LINKS.map((link) => (
                    link.dropdown ? (
                      <div key={link.name} className="flex flex-col space-y-4">
                        <span className="font-heading text-lg font-bold uppercase text-black/50">
                          {link.name}
                        </span>
                        <div className="flex flex-col pl-4 space-y-4 border-l-2 border-black/10">
                          {link.dropdown.map(drop => (
                            <SheetTrigger
                              key={drop.name}
                              render={
                                <Link
                                  href={drop.href}
                                  className="font-heading text-base font-bold uppercase text-black/80 hover:text-black transition-colors"
                                >
                                  {drop.name}
                                </Link>
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <SheetTrigger
                        key={link.name}
                        render={
                          <Link
                            href={link.href}
                            className="font-heading text-lg font-bold uppercase text-black/80 hover:text-black transition-colors"
                          >
                            {link.name}
                          </Link>
                        }
                      />
                    )
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <nav className="hidden lg:flex items-center space-x-3 xl:space-x-5 whitespace-nowrap">
            {NAV_LINKS.map((link) => (
              link.dropdown ? (
                <div key={link.name} className="relative group py-4">
                  <span className="cursor-pointer font-heading text-base xl:text-[17px] font-bold uppercase text-black/80 hover:text-black transition-colors flex items-center gap-1">
                    {link.name}
                  </span>
                  <div className="absolute top-full left-0 hidden group-hover:flex flex-col bg-white border border-black/10 shadow-lg min-w-[150px] py-2 z-50">
                    {link.dropdown.map(drop => (
                      <Link
                        key={drop.name}
                        href={drop.href}
                        className="px-4 py-2 font-heading text-sm font-bold uppercase text-black/70 hover:text-black hover:bg-black/5 transition-colors"
                      >
                        {drop.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  className="font-heading text-base xl:text-[17px] font-bold uppercase text-black/80 hover:text-black transition-colors"
                >
                  {link.name}
                </Link>
              )
            ))}
          </nav>
        </div>

        {/* Center: Logo (Offset slightly right to avoid long left nav) */}
        <div className="absolute left-1/2 lg:left-[56%] xl:left-[54%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-0">
          <Link href="/" className="flex items-center justify-center">
            <img src="/logo.png" alt="Legacy XI" className="h-10 sm:h-12 md:h-16 lg:h-20 w-auto object-contain transition-all duration-300" />
          </Link>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center justify-end space-x-4 md:space-x-6 z-10">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-1 hover:opacity-70 transition-opacity" 
            aria-label="Search"
          >
            <Search className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
          </button>
          {mounted && (
            <Link 
              href={isLoggedIn ? "/account" : "/login"}
              className="p-1 hover:opacity-70 transition-opacity hidden md:block relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border border-black/10" 
              aria-label="Account"
            >
              {isLoggedIn && useAuthStore.getState().user?.avatarUrl ? (
                <img src={useAuthStore.getState().user!.avatarUrl!} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 md:w-5 md:h-5" strokeWidth={1.5} />
              )}
            </Link>
          )}
          <button 
            onClick={openCart}
            className="p-1 hover:opacity-70 transition-opacity relative" 
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-sans">
                {itemCount}
              </span>
            )}
          </button>
        </div>
        
      </div>
      <CartDrawer />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
