"use client";

import React from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, Image as ImageIcon, Loader2 } from "lucide-react";
import { 
  PageHeader, 
  AdminCard, 
  DataTable, 
  StatusBadge, 
  SearchInput, 
  FilterBar,
  Pagination,
  EmptyState
} from "@/components/admin/ui";
import { useProducts, useDeleteProduct } from "@/lib/api/admin";
import { ProductStatus, Product } from "@/types/admin";

export default function AdminProductsPage() {
  const { data: products, isLoading, isError } = useProducts();
  const deleteMutation = useDeleteProduct();

  const getStatusVariant = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'DRAFT': return 'warning';
      case 'ARCHIVED': return 'default';
      default: return 'default';
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Products">
        <Link href="/admin/products/new">
          <button className="bg-black text-white px-4 py-2 flex items-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/90 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </Link>
      </PageHeader>

      <AdminCard noPadding>
        <div className="p-4 border-b border-black/10">
          <FilterBar>
            <SearchInput placeholder="Search by name or SKU..." className="w-full sm:max-w-xs" />
            
            <div className="flex flex-wrap gap-3 flex-1 sm:flex-none">
              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">All Categories</option>
                <option value="Jerseys">Jerseys</option>
                <option value="Retro">Retro</option>
                <option value="Custom">Custom</option>
              </select>

              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-black/50 hidden md:inline">Sort By:</span>
              <select className="border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="stock-asc">Stock: Low to High</option>
              </select>
            </div>
          </FilterBar>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-black/50">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-heading font-bold uppercase tracking-widest text-xs uppercase tracking-widest font-bold">Loading Products</p>
          </div>
        ) : isError ? (
          <EmptyState 
            title="Failed to load products" 
            description="There was an error connecting to the backend server." 
          />
        ) : !products || products.length === 0 ? (
          <EmptyState 
            title="No Products Found" 
            description="You haven't created any products yet."
            action={
              <Link href="/admin/products/new">
                <button className="bg-black text-white px-4 py-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/90 transition-colors">
                  Add First Product
                </button>
              </Link>
            }
          />
        ) : (
          <>
            <DataTable headers={["Product", "Category", "Price", "Variants", "Stock", "Status", "Created", "Actions"]}>
              {products.map((product: Product) => (
                <tr key={product.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3 min-w-[200px]">
                      <div className="w-10 h-10 bg-black/5 border border-black/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                        {product.media && product.media.length > 0 && product.media[0].url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.media[0].url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-black/30" />
                        )}
                      </div>
                      <div>
                        <p className="font-heading font-bold uppercase tracking-widest font-medium text-sm leading-tight text-black">{product.name}</p>
                        <p className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/50 mt-0.5">{product.variants?.[0]?.sku || product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 bg-black/5 font-heading font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">
                      {product.categories?.[0] || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-heading uppercase tracking-widest text-xs font-medium whitespace-nowrap">
                    ₹{product.price.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-xs">
                    {product.variantsCount ?? product.variants?.length ?? 0}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className={`font-heading uppercase tracking-widest text-xs font-medium ${(product.totalStock ?? 0) <= 5 ? 'text-red-600' : 'text-black'}`}>
                        {product.totalStock ?? 0}
                      </span>
                      {(product.totalStock ?? 0) <= 5 && (product.totalStock ?? 0) > 0 && (
                        <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-red-600/70">Low</span>
                      )}
                      {(product.totalStock ?? 0) === 0 && (
                        <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-red-600/70">Out</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge 
                      status={product.status} 
                      variant={getStatusVariant(product.status)} 
                    />
                  </td>
                  <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-[10px] text-black/60 whitespace-nowrap">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Link href={`/product/${product.slug}`} target="_blank">
                        <button className="p-2 text-black/50 hover:text-black hover:bg-black/5 transition-colors" title="View Storefront">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link href={`/admin/products/${product.id}`}>
                        <button className="p-2 text-black/50 hover:text-black hover:bg-black/5 transition-colors" title="Edit Product">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-black/50 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50" 
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pagination currentPage={1} totalPages={1} />
          </>
        )}
      </AdminCard>
    </div>
  );
}
