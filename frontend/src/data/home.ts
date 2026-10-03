// Omitted MediaDisplayProps since we use MediaConfig now

export type MediaConfig = {
  type: "image" | "video";
  src: string;
  mobileSrc?: string;
  poster?: string;
  alt?: string;
  objectPosition?: string;
  mobileObjectPosition?: string;
};

export interface HeroConfig {
  media: MediaConfig;
  overlayOpacity?: number; // 0 to 100
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  heightClass?: string;
}

export const heroData: HeroConfig = {
  media: {
    type: "image",
    src: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070&auto=format&fit=crop", // High-quality football/stadium related image placeholder
    mobileSrc: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop",
    alt: "Legacy XI Premium Football Jersey",
    objectPosition: "center",
  },
  overlayOpacity: 20,
  title: "Define Your Legacy",
  subtitle: "Authentic & Premium Football Kits",
  ctaText: "Shop the Collection",
  ctaLink: "/shop",
  heightClass: "h-[85vh] min-h-[600px]",
};
