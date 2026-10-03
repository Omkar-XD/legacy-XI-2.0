"use client";

import React, { useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { productSchema, ProductFormValues } from "@/lib/validations/product";
import { FormSection, AdminCard } from "@/components/admin/ui";
import { ProductMediaManager } from "./ProductMediaManager";

interface ProductFormProps {
  productId?: string;
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (data: ProductFormValues) => void;
  isLoading?: boolean;
}

export function ProductForm({ productId, initialValues, onSubmit, isLoading = false }: ProductFormProps) {
  const pendingFilesRef = useRef<Map<string, File>>(new Map());

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: initialValues?.name || "",
      slug: initialValues?.slug || "",
      description: initialValues?.description || "",
      categories: initialValues?.categories || ["player-version"],
      price: initialValues?.price || 0,
      compareAtPrice: initialValues?.compareAtPrice || "",
      status: initialValues?.status || "DRAFT",
      media: initialValues?.media || [],
      variants: initialValues?.variants || [
        { size: "S", sku: "", stock: 0 },
        { size: "M", sku: "", stock: 0 },
        { size: "L", sku: "", stock: 0 }
      ]
    }
  });

  const { register, control, handleSubmit, formState: { errors }, watch } = form;

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants"
  });

  const handleFormSubmit = (data: ProductFormValues) => {
    // Map the external File state into the payload, bypassing RHF's strict serialization
    const enrichedData = {
      ...data,
      media: data.media.map(m => {
        const file = pendingFilesRef.current.get(m.url);
        return file ? { ...m, file } : m;
      })
    };
    
    onSubmit(enrichedData);
  };

  return (
    <form id="product-form" onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Basic Information */}
        <AdminCard noPadding>
          <FormSection title="Basic Information" className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block font-heading text-xs font-bold uppercase tracking-widest text-black/70 mb-1">Product Name</label>
                <input 
                  type="text" 
                  {...register("name")}
                  className="w-full border border-black/20 px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none" 
                  placeholder="e.g. Real Madrid Home Kit 23/24"
                />
                {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-xs font-bold uppercase tracking-widest text-black/70 mb-1">Slug</label>
                  <input 
                    type="text" 
                    {...register("slug")}
                    className="w-full border border-black/20 px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none" 
                    placeholder="real-madrid-home-23-24"
                  />
                  {errors.slug && <p className="text-red-600 text-xs mt-1">{errors.slug.message}</p>}
                </div>
              </div>
              
              <div>
                <label className="block font-heading text-xs font-bold uppercase tracking-widest text-black/70 mb-2">Categories</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: "player-version", label: "Player Version" },
                    { id: "half-sleeve", label: "Half Sleeve" },
                    { id: "five-sleeve", label: "Five Sleeve" },
                    { id: "full-sleeve", label: "Full Sleeve" },
                    { id: "national-kits", label: "National Kits" },
                    { id: "season-kits", label: "Season Kits" },
                    { id: "full-kit", label: "Full Kit" },
                    { id: "bibs", label: "Bibs" },
                    { id: "cricket", label: "Cricket" },
                    { id: "special-edition", label: "Special Edition" },
                    { id: "shorts", label: "Shorts" },
                    { id: "kids", label: "Kids" },
                    { id: "exclusive-offer", label: "Exclusive Offer" }
                  ].map(cat => (
                    <label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        value={cat.id} 
                        {...register("categories")}
                        className="w-4 h-4 accent-black rounded-none"
                      />
                      <span className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/80">{cat.label}</span>
                    </label>
                  ))}
                </div>
                {errors.categories && <p className="text-red-600 text-xs mt-1">{errors.categories.message}</p>}
              </div>

              <div>
                <label className="block font-heading text-xs font-bold uppercase tracking-widest text-black/70 mb-1">Description</label>
                <textarea 
                  rows={5} 
                  {...register("description")}
                  className="w-full border border-black/20 px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none" 
                  placeholder="Detailed product description..."
                />
                {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
              </div>
            </div>
          </FormSection>
        </AdminCard>

        {/* Media */}
        <AdminCard noPadding>
          <FormSection title="Product Media" className="p-6">
            <ProductMediaManager 
              productId={productId}
              control={control}
              register={register}
              watch={watch}
              errors={errors}
              pendingFilesRef={pendingFilesRef}
            />
          </FormSection>
        </AdminCard>

        {/* Variants */}
        <AdminCard noPadding>
          <FormSection title="Variants & Inventory" className="p-6">
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="pb-2 font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">Size</th>
                      <th className="pb-2 font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">SKU</th>
                      <th className="pb-2 font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">Stock</th>
                      <th className="pb-2 font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">Price Override (Opt)</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {variantFields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="py-3 pr-2">
                          <input type="hidden" {...register(`variants.${index}.id` as const)} />
                          <select 
                            {...register(`variants.${index}.size` as const)}
                            className="w-full border border-black/20 bg-transparent px-2 py-1.5 font-heading font-bold uppercase tracking-widest text-[10px] focus:outline-none focus:border-black rounded-none"
                          >
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <input 
                            type="text" 
                            {...register(`variants.${index}.sku` as const)}
                            placeholder="SKU"
                            className="w-full border border-black/20 px-2 py-1.5 font-heading font-bold uppercase tracking-widest text-[10px] focus:outline-none focus:border-black rounded-none"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input 
                            type="text" 
                            inputMode="numeric"
                            {...register(`variants.${index}.stock` as const)}
                            placeholder="0"
                            className="w-20 border border-black/20 px-2 py-1.5 font-heading font-bold uppercase tracking-widest text-[10px] focus:outline-none focus:border-black rounded-none"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input 
                            type="text" 
                            inputMode="decimal"
                            {...register(`variants.${index}.priceOverride` as const)}
                            placeholder="e.g. 1599"
                            className="w-full border border-black/20 px-2 py-1.5 font-heading font-bold uppercase tracking-widest text-[10px] focus:outline-none focus:border-black rounded-none"
                          />
                        </td>
                        <td className="py-3 pl-2 text-right">
                          <button type="button" onClick={() => removeVariant(index)} className="p-1 text-black/40 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {errors.variants && <p className="text-red-600 text-xs">{errors.variants.message}</p>}

              <button 
                type="button" 
                onClick={() => appendVariant({ size: "M", sku: "", stock: 0 })}
                className="w-full py-2 border border-black/20 flex items-center justify-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Variant</span>
              </button>
            </div>
          </FormSection>
        </AdminCard>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">
        
        {/* Pricing */}
        <AdminCard noPadding>
          <FormSection title="Pricing" className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block font-heading text-xs font-bold uppercase tracking-widest text-black/70 mb-1">Base Price (₹)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  {...register("price")}
                  className="w-full border border-black/20 px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none text-xl font-bold" 
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label className="block font-heading text-xs font-bold uppercase tracking-widest text-black/70 mb-1">Compare-at Price (₹) - Optional</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  {...register("compareAtPrice")}
                  className="w-full border border-black/20 px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none" 
                  placeholder="0.00"
                />
              </div>
            </div>
          </FormSection>
        </AdminCard>

        {/* Status */}
        <AdminCard noPadding>
          <FormSection title="Product Status" className="p-6">
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 border border-black/10 hover:bg-black/[0.02]">
                <input 
                  type="radio" 
                  value="ACTIVE" 
                  {...register("status")}
                  className="w-4 h-4 accent-black" 
                />
                <div>
                  <span className="block font-heading text-sm font-bold uppercase tracking-widest">Active</span>
                  <span className="block font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">Visible to customers immediately</span>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer p-3 border border-black/10 hover:bg-black/[0.02]">
                <input 
                  type="radio" 
                  value="DRAFT" 
                  {...register("status")}
                  className="w-4 h-4 accent-black" 
                />
                <div>
                  <span className="block font-heading text-sm font-bold uppercase tracking-widest">Draft</span>
                  <span className="block font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">Hidden, requires further editing</span>
                </div>
              </label>
            </div>
          </FormSection>
        </AdminCard>

      </div>
    </form>
  );
}
