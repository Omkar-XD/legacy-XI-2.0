"use client";

import React from "react";

export function PromoVideo() {
  return (
    <section className="w-full relative bg-white pb-8 md:pb-16 pt-8 md:pt-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="w-full relative aspect-[16/9] md:aspect-[21/9] bg-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
          <video 
            src="/assets/video/el-clasico.mp4" 
            autoPlay 
            muted 
            loop 
            playsInline 
            className="w-full h-full object-cover"
          />
          {/* Overlay text for aesthetic impact */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none flex items-center justify-center">
            <h2 className="text-4xl md:text-6xl font-heading font-bold uppercase tracking-widest text-white text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              Feel The Passion
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
