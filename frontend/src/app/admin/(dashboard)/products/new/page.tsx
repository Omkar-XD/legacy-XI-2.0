"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/forms/ProductForm";
import { ProductFormValues } from "@/lib/validations/product";

import { useRouter } from "next/navigation";
import { useCreateProduct } from "@/lib/api/admin";
import toast from "react-hot-toast";

export default function AdminNewProductPage() {
  const router = useRouter();
  const createMutation = useCreateProduct();

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success(`Product "${data.name}" created successfully!`);
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
      if (error.message && error.message.includes('Product created, but')) {
        router.push("/admin/products");
      }
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader 
        title="Add New Product" 
        className="mb-8"
      >
        <Link href="/admin/products" className="mr-auto">
          <button type="button" className="p-2 border border-black/20 hover:bg-black/5 transition-colors rounded-none mr-4">
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
        </Link>
        <button 
          type="submit" 
          form="product-form"
          disabled={createMutation.isPending}
          className="bg-black text-white px-6 py-2.5 flex items-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/90 transition-colors rounded-none disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{createMutation.isPending ? "Saving..." : "Save Product"}</span>
        </button>
      </PageHeader>

      <ProductForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </div>
  );
}
