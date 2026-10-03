"use client";

import React from "react";
import Image from "next/image";
import { Product } from "@/types/product";
import { MediaDisplay } from "@/components/media/MediaDisplay";

export function ProductGallery({ product }: { product: Product }) {
  if (!product.media || product.media.length === 0) return null;

  // Sort media by sortOrder if available
  const sortedMedia = [...product.media].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="w-full flex md:grid md:grid-cols-2 gap-1 md:gap-4 overflow-x-auto snap-x snap-mandatory md:overflow-visible md:snap-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {sortedMedia.map((m, i) => (
        <div 
          key={m.id || i} 
          className="relative w-full flex-shrink-0 snap-center md:w-full bg-secondary"
          style={{ aspectRatio: "3/4" }}
        >
          {m.type?.toLowerCase() === "image" ? (
            <Image
              src={m.url}
              alt={m.alt || product.name}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 55vw"
              priority={i === 0}
            />
          ) : (
            <MediaDisplay
              type={m.type}
              src={m.url}
              poster={m.posterUrl}
              alt={m.alt || product.name}
              priority={i === 0}
            />
          )}
        </div>
      ))}
    </div>
  );
}
