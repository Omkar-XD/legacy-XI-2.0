"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function SearchOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams();
      params.set("search", query.trim());
      router.push(`/shop?${params.toString()}`);
      onClose();
      setQuery("");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="top" showCloseButton={false} className="w-full bg-white p-0 border-b border-black/10">
        <SheetHeader className="sr-only">
          <SheetTitle>Search</SheetTitle>
        </SheetHeader>
        <div className="container mx-auto px-4 h-24 flex items-center justify-between">
          <form onSubmit={handleSubmit} className="flex-1 flex items-center h-full max-w-3xl mx-auto relative">
            <Search className="w-6 h-6 text-black/50 absolute left-0" strokeWidth={1.5} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH PRODUCTS..."
              autoComplete="off"
              spellCheck="false"
              className="w-full h-full bg-transparent border-none text-xl md:text-3xl font-heading uppercase tracking-widest text-black pl-12 focus:ring-0 focus:outline-none placeholder:text-black/20 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden [&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-12 text-black/50 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </form>
          <button 
            onClick={onClose}
            className="p-2 ml-4 text-black hover:opacity-70 transition-opacity"
            aria-label="Close search"
          >
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
