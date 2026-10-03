"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { heroData } from "@/data/home";
import Image from "next/image";

const heroImages = [
  "/assets/hero/home1.jpg",
  "/assets/hero/home2.jpg",
  "/assets/hero/home3.jpg",
  "/assets/hero/home4.jpg",
  "/assets/hero/home5.jpg",
  "/assets/hero/home6.jpg",
  "/assets/hero/home7.jpg",
];

export function Hero() {
  const { overlayOpacity = 0, title, subtitle, ctaText, ctaLink, heightClass = "h-screen" } = heroData;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 4500); // 4.5 seconds per slide
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={`relative w-full ${heightClass} overflow-hidden`}>
      {/* Background Carousel */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={heroImages[currentIndex]}
              alt={`Hero Image ${currentIndex + 1}`}
              fill
              priority={currentIndex === 0}
              className="object-cover object-top"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black pointer-events-none z-10"
        style={{ opacity: overlayOpacity / 100 }}
      />

      {/* Content */}
      <div className="relative z-20 w-full h-full flex flex-col items-center justify-end md:justify-center pb-20 md:pb-0 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-center max-w-4xl"
        >
          {title && (
            <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-heading font-bold uppercase tracking-tight mb-4 drop-shadow-lg leading-none">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-white/90 text-sm md:text-lg uppercase tracking-widest font-heading mb-8 drop-shadow-md">
              {subtitle}
            </p>
          )}
          {ctaText && ctaLink && (
            <Link
              href={ctaLink}
              className="inline-block bg-white text-black px-10 py-4 font-heading uppercase tracking-widest text-sm hover:bg-black hover:text-white hover:border-white border border-transparent transition-all duration-300"
            >
              {ctaText}
            </Link>
          )}
        </motion.div>
      </div>
      
      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center space-x-2">
        {heroImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 transition-all duration-300 ${
              idx === currentIndex ? "bg-white w-12" : "bg-white/30 hover:bg-white/50 w-6"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
