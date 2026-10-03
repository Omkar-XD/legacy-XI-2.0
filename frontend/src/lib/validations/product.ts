import * as z from "zod";

export const variantSchema = z.object({
  id: z.string().optional(),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
  sku: z.string().min(1, "SKU is required"),
  priceOverride: z.coerce.number().min(0).optional().or(z.literal("")),
  stock: z.coerce.number().min(0, "Stock cannot be negative"),
});

export const mediaSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["IMAGE", "VIDEO"]),
  url: z.string().min(1, "URL is required"),
  posterUrl: z.string().optional().or(z.literal("")),
  alt: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Name is too long"),
  slug: z.string().min(1, "Slug is required")
    .transform((val) => val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    .pipe(z.string().regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")),
  description: z.string().min(1, "Description is required"),
  categories: z.array(z.enum([
    "player-version", "half-sleeve", "five-sleeve", "full-sleeve", 
    "national-kits", "season-kits", "full-kit", "bibs", "cricket", 
    "special-edition", "shorts", "kids", "exclusive-offer"
  ])).min(1, "Select at least one category"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  compareAtPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "DRAFT"]),
  media: z.array(mediaSchema).default([]),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductVariantValues = z.infer<typeof variantSchema>;
export type ProductMediaValues = z.infer<typeof mediaSchema>;
