"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Archive, Loader2 } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/forms/ProductForm";
import { ProductFormValues } from "@/lib/validations/product";
import { useProduct, useUpdateProduct } from "@/lib/api/admin";
import toast from "react-hot-toast";

export default function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const { data: product, isLoading, isError } = useProduct(productId);
  const updateMutation = useUpdateProduct();

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      await updateMutation.mutateAsync({ id: productId, data });
      toast.success(`Product "${data.name}" updated successfully!`);
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.message || "Failed to update product.");
      if (err.message && err.message.includes('Product updated, but')) {
        router.push("/admin/products");
      }
    }
  };

  const handleArchive = async () => {
    if (confirm("Are you sure you want to archive this product?")) {
      try {
        // Technically partial updates should be allowed by useUpdateProduct
        await updateMutation.mutateAsync({ id: productId, data: { status: "ARCHIVED" } as any });
        toast.success(`Product archived!`);
        router.push("/admin/products");
      } catch (err) {
        toast.error("Failed to archive product.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-black/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-heading font-bold uppercase tracking-widest text-xs uppercase tracking-widest font-bold">Loading Product...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-5xl">
        <PageHeader title="Error" className="mb-8">
          <Link href="/admin/products" className="mr-auto">
            <button type="button" className="p-2 border border-black/20 hover:bg-black/5 transition-colors rounded-none mr-4">
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
          </Link>
        </PageHeader>
        <EmptyState title="Product Not Found" description="The product you are trying to edit does not exist or an error occurred." />
      </div>
    );
  }

  // Map Product API response to ProductFormValues
  const initialValues: Partial<ProductFormValues> = {
    name: product.name,
    slug: product.slug,
    description: product.description,
    categories: product.categories as any,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    status: product.status as "ACTIVE" | "DRAFT",
    media: product.media.map((m: { id: string, type: string, url: string, sortOrder: number, posterUrl?: string, alt?: string }) => ({ id: m.id, type: m.type as any, url: m.url, sortOrder: m.sortOrder, posterUrl: m.posterUrl || "", alt: m.alt || "" })),
    variants: product.variants.map((v: { id: string, size: string, sku: string, stock: number, priceOverride?: number }) => ({ id: v.id, size: v.size, sku: v.sku, stock: v.stock, priceOverride: v.priceOverride }))
  };

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader 
        title={`Edit Product ${productId}`} 
        className="mb-8"
      >
        <Link href="/admin/products" className="mr-auto">
          <button type="button" className="p-2 border border-black/20 hover:bg-black/5 transition-colors rounded-none mr-4">
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
        </Link>
        <button 
          type="button" 
          onClick={handleArchive}
          disabled={updateMutation.isPending}
          className="bg-white text-red-600 border border-red-600 px-6 py-2.5 flex items-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-red-50 transition-colors rounded-none disabled:opacity-50"
        >
          <Archive className="w-4 h-4" />
          <span className="hidden sm:inline">Archive</span>
        </button>
        <button 
          type="submit" 
          form="product-form"
          disabled={updateMutation.isPending}
          className="bg-black text-white px-6 py-2.5 flex items-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/90 transition-colors rounded-none disabled:opacity-50"
        >
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{updateMutation.isPending ? "Saving..." : "Save Changes"}</span>
        </button>
      </PageHeader>

      <ProductForm 
        productId={productId}
        initialValues={initialValues} 
        onSubmit={handleSubmit} 
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
