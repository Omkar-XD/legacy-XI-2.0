export interface Category {
  id: string;
  slug: string;
  title: string;
  image: string;
  className?: string; // For grid spanning (e.g. "col-span-2 row-span-2")
  imageClassName?: string; // Custom image styling like object-contain, object-top, bg-white
}
