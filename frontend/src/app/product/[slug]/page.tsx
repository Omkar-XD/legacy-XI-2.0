import React from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { ProductClient } from "./ProductClient";
import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  const product = await api.products.getBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Legacy XI",
    };
  }

  return {
    title: `${product.name} | Legacy XI`,
    description: product.description || `Buy ${product.name} at Legacy XI. Premium football jerseys.`,
  };
}

import { RecommendedProducts } from "@/components/product/RecommendedProducts";

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await api.products.getBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="w-full bg-white flex-grow">
      <ProductClient product={product}>
        <RecommendedProducts currentProductId={product.id} />
      </ProductClient>
    </div>
  );
}
