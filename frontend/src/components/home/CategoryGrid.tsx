"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { categories } from "@/data/categories";

export function CategoryGrid() {
  return (
    <section className="w-full relative">
      {/* Background that transitions from white to black at the bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-black pointer-events-none z-0" />

      <div className="w-full pt-8 md:pt-16 pb-8 md:pb-16 relative z-10">
        <div className="container mx-auto px-4 mb-10 text-center md:text-left border-b border-black/10 pb-4">
          <h2 className="text-2xl md:text-4xl font-heading font-bold uppercase tracking-widest text-black">
            Shop By Category
          </h2>
        </div>

        <div className="container mx-auto px-4">
          {/* Bento Grid Layout - Connected Edge-to-Edge */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 auto-rows-[180px] md:auto-rows-[300px]">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={`group relative block w-full h-full overflow-hidden bg-black ${
                  cat.className || "col-span-1 row-span-1"
                }`}
              >
                {/* Background Image with Hover Zoom */}
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  className={`${cat.imageClassName || "object-cover object-center"} transition-transform duration-700 ease-out group-hover:scale-105`}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                />
                
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/50" />

                {/* Centered Title */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <h3 className="text-white text-center font-heading uppercase text-xl md:text-3xl font-bold tracking-widest leading-none drop-shadow-md">
                    {cat.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
