"use client";

import React from "react";
import Link from "next/link";
import { Truck, Loader2 } from "lucide-react";
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
import { useOrders } from "@/lib/api/admin";
import { OrderStatus, Order } from "@/types/admin";

export default function AdminTrackingPage() {
  const { data: orders, isLoading, isError } = useOrders();

  const getOrderStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED': return 'success';
      case 'SHIPPED': return 'success';
      case 'PROCESSING': return 'warning';
      case 'ORDER_PLACED': 
      case 'PAYMENT_CONFIRMED': return 'warning';
      case 'OUT_FOR_DELIVERY': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tracking & Shipping" />

      <AdminCard noPadding>
        <div className="p-4 border-b border-black/10">
          <FilterBar>
            <SearchInput placeholder="Search Order ID, Tracking No..." className="w-full sm:max-w-xs" />
            
            <div className="flex flex-wrap gap-3 flex-1 sm:flex-none">
              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">All Shipping Statuses</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
              </select>

              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">All Couriers</option>
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
                <option value="USPS">USPS</option>
                <option value="DHL">DHL</option>
              </select>
            </div>
          </FilterBar>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-black/50">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-heading font-bold uppercase tracking-widest text-xs uppercase tracking-widest font-bold">Loading Orders</p>
          </div>
        ) : isError ? (
          <EmptyState 
            title="Failed to load orders" 
            description="There was an error connecting to the backend server." 
          />
        ) : !orders || orders.length === 0 ? (
          <EmptyState 
            title="No Orders Found" 
            description="No orders available for shipping management."
          />
        ) : (
          <>
            <DataTable headers={["Order ID", "Status", "Courier", "Tracking No", "Estimated Delivery", "Actions"]}>
              {orders.map((order: Order) => (
                <tr key={order.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/admin/tracking/${order.id}`} className="font-heading font-bold uppercase tracking-wider text-sm hover:underline">
                      {order.id}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge 
                      status={order.orderStatus.replace(/_/g, ' ')} 
                      variant={getOrderStatusVariant(order.orderStatus)} 
                    />
                  </td>
                  <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-xs text-black/70">
                    {order.courier || "-"}
                  </td>
                  <td className="py-3 px-4 font-sans text-sm font-medium">
                    {order.trackingNumber ? (
                       <a href={order.trackingUrl || "#"} className="hover:underline" target="_blank" rel="noreferrer">
                         {order.trackingNumber}
                       </a>
                    ) : "-"}
                  </td>
                  <td className="py-3 px-4 font-sans text-sm text-black/60 whitespace-nowrap">
                    {order.estimatedDelivery || "-"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/tracking/${order.id}`}>
                      <button className="flex items-center gap-2 p-2 px-3 border border-black/20 text-black/70 hover:text-black hover:border-black hover:bg-black/5 transition-colors text-xs font-heading font-bold uppercase tracking-widest ml-auto">
                        <Truck className="w-3 h-3" />
                        <span>Update</span>
                      </button>
                    </Link>
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
