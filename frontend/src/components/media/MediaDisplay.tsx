"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

export type MediaType = "image" | "video";

export interface MediaDisplayProps {
  type: MediaType;
  src: string;
  poster?: string;
  alt?: string;
  mobileSrc?: string;
  objectPosition?: string;
  mobileObjectPosition?: string;
  priority?: boolean;
  className?: string;
  hoverVideoSrc?: string; // Support for product hover videos
}

export function MediaDisplay({
  type,
  src,
  poster,
  alt = "Media content",
  mobileSrc,
  objectPosition = "center",
  mobileObjectPosition = "center",
  priority = false,
  className = "",
  hoverVideoSrc,
}: MediaDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  
  // Only trigger intersection observer if not priority
  const isInView = useInView(containerRef, { once: true, margin: "200px" });
  const shouldLoad = priority || isInView;
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const isVideo = type?.toLowerCase() === "video";
  const showVideo = isVideo && !prefersReducedMotion;

  // Handle play state for videos based on reduced motion
  useEffect(() => {
    if (showVideo && shouldLoad) {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {}); // catch autoplay restrictions
      }
      if (mobileVideoRef.current) {
        mobileVideoRef.current.play().catch(() => {});
      }
    }
  }, [showVideo, shouldLoad]);

  const renderVideo = (videoSrc: string, isMobile: boolean, ref: React.RefObject<HTMLVideoElement | null>) => (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload={priority ? "auto" : "none"}
      poster={poster}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
        isMobile ? "block sm:hidden" : mobileSrc ? "hidden sm:block" : "block"
      }`}
      style={{ objectPosition: isMobile ? mobileObjectPosition : objectPosition }}
    >
      {shouldLoad && <source src={videoSrc} type="video/mp4" />}
      Your browser does not support the video tag.
    </video>
  );

  const renderImage = (imageSrc: string, isMobile: boolean, isHoverDisplay = false) => (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      priority={priority && !isHoverDisplay}
      className={`object-cover transition-opacity duration-500 ${
        isMobile ? "block sm:hidden" : mobileSrc && !isHoverDisplay ? "hidden sm:block" : "block"
      } ${isHoverDisplay ? (isHovered ? "opacity-100 z-10" : "opacity-0 z-0") : ""}`}
      style={{ objectPosition: isMobile ? mobileObjectPosition : objectPosition }}
      sizes={priority ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
    />
  );

  return (
    <motion.div
      ref={containerRef}
      initial={priority ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative w-full h-full overflow-hidden bg-secondary ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {shouldLoad && (
        <>
          {showVideo ? (
            <>
              {mobileSrc && renderVideo(mobileSrc, true, mobileVideoRef)}
              {renderVideo(src, false, videoRef)}
            </>
          ) : (
            <>
              {/* If it's a video but user prefers reduced motion, fallback to poster or just don't play */}
              {isVideo && poster ? (
                <>
                  {mobileSrc && renderImage(poster, true)}
                  {renderImage(poster, false)}
                </>
              ) : (
                <>
                  {mobileSrc && renderImage(mobileSrc, true)}
                  {renderImage(src, false)}
                </>
              )}
            </>
          )}

          {/* Product hover video functionality */}
          {hoverVideoSrc && !prefersReducedMotion && (
            <video
              muted
              loop
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isHovered ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              style={{ objectPosition }}
              autoPlay={isHovered} // Play when hovered
            >
              {isHovered && <source src={hoverVideoSrc} type="video/mp4" />}
            </video>
          )}
        </>
      )}
    </motion.div>
  );
}
