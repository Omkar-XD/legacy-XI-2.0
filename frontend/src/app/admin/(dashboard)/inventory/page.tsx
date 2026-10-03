"use client";

import React from "react";
import { Image as ImageIcon, Save, Loader2 } from "lucide-react";
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
import { useInventory, useUpdateInventory } from "@/lib/api/admin";
import { InventoryStatus, Inventory } from "@/types/admin";

export default function AdminInventoryPage() {
  const { data: inventory, isLoading, isError } = useInventory();
  const updateMutation = useUpdateInventory();

  const getStatusVariant = (status: InventoryStatus) => {
    switch (status) {
      case 'IN_STOCK': return 'success';
      case 'LOW_STOCK': return 'warning';
      case 'OUT_OF_STOCK': return 'error';
      default: return 'default';
    }
  };

  const handleUpdateStock = (variantId: string, newAvailable: number) => {
    updateMutation.mutate({ variantId, available: newAvailable });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Management" />

      <AdminCard noPadding>
        <div className="p-4 border-b border-black/10">
          <FilterBar>
            <SearchInput placeholder="Search SKU or product..." className="w-full sm:max-w-xs" />
            
            <div className="flex flex-wrap gap-3 flex-1 sm:flex-none">
              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">All Products</option>
                <option value="PROD-1">Real Madrid Home</option>
                <option value="PROD-2">Arsenal Away</option>
                <option value="PROD-3">Juventus Third</option>
              </select>

              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">All Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>

              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">All Sizes</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          </FilterBar>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-black/50">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-heading font-bold uppercase tracking-widest text-xs uppercase tracking-widest font-bold">Loading Inventory</p>
          </div>
        ) : isError ? (
          <EmptyState 
            title="Failed to load inventory" 
            description="There was an error connecting to the backend server." 
          />
        ) : !inventory || inventory.length === 0 ? (
          <EmptyState 
            title="No Inventory Found" 
            description="There are no product variants available to manage."
          />
        ) : (
          <>
            <DataTable headers={["Product", "Variant", "SKU", "Available", "Reserved", "Total", "Status", "Last Updated", "Adjust"]}>
              {inventory.map((item: Inventory) => (
                <tr key={item.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3 min-w-[200px]">
                      <div className="w-10 h-10 bg-black/5 border border-black/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-black/30" />
                        )}
                      </div>
                      <div>
                        <p className="font-heading font-bold uppercase tracking-widest font-medium text-sm leading-tight text-black line-clamp-1">{item.productName}</p>
                        <p className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/50 uppercase tracking-wider mt-0.5">{item.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 bg-black/5 border border-black/10 font-heading font-bold uppercase tracking-widest font-bold text-xs">
                      {item.size}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-[10px] text-black/70 whitespace-nowrap">
                    {item.sku}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-heading uppercase tracking-widest text-xs font-bold ${item.available <= 5 ? 'text-red-600' : 'text-black'}`}>
                      {item.available}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-xs text-black/50">
                    {item.reserved}
                  </td>
                  <td className="py-3 px-4 font-heading uppercase tracking-widest text-xs font-medium">
                    {item.total}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge 
                      status={item.status.replace(/_/g, ' ')} 
                      variant={getStatusVariant(item.status)} 
                    />
                  </td>
                  <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-[10px] text-black/50 whitespace-nowrap">
                    {item.lastUpdated}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const newAvailable = parseInt(formData.get("available") as string, 10);
                        if (!isNaN(newAvailable)) {
                          handleUpdateStock(item.id, newAvailable);
                        }
                      }}
                      className="flex items-center justify-end space-x-2"
                    >
                      <input 
                        name="available"
                        type="text"
                        inputMode="numeric" 
                        defaultValue={item.available}
                        className="w-16 border border-black/20 px-2 py-1.5 font-heading font-bold uppercase tracking-widest text-[10px] focus:outline-none focus:border-black text-center" 
                      />
                      <button 
                        type="submit"
                        disabled={updateMutation.isPending && updateMutation.variables?.variantId === item.id}
                        className="p-1.5 bg-black text-white hover:bg-black/80 transition-colors disabled:opacity-50"
                        title="Update Stock"
                      >
                        {updateMutation.isPending && updateMutation.variables?.variantId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </button>
                    </form>
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
