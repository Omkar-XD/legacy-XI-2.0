"use client";

import React from "react";
import Link from "next/link";
import { Eye, Loader2 } from "lucide-react";
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
import { PaymentStatus, OrderStatus, Order } from "@/types/admin";

export default function AdminOrdersPage() {
  const { data: orders, isLoading, isError } = useOrders();

  const getPaymentStatusVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'error';
      case 'REFUNDED': return 'default';
      default: return 'default';
    }
  };

  const getOrderStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED': return 'success';
      case 'SHIPPED': return 'success';
      case 'PROCESSING': return 'warning';
      case 'PENDING': 
      case 'PAYMENT_PENDING': return 'warning';
      case 'PAID': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" />

      <AdminCard noPadding>
        <div className="p-4 border-b border-black/10">
          <FilterBar>
            <SearchInput placeholder="Search Order ID or Customer..." className="w-full sm:max-w-xs" />
            
            <div className="flex flex-wrap gap-3 flex-1 sm:flex-none">
              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">All Payment Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>

              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">All Order Statuses</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PAYMENT_PENDING">Payment Pending</option>
              </select>

              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">Any Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
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
            description="You don't have any orders matching the current filters."
          />
        ) : (
          <>
            <DataTable headers={["Order ID", "Customer", "Items", "Total", "Payment", "Order Status", "Created", "Actions"]}>
              {orders.map((order: Order) => (
                <tr key={order.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/admin/orders/${order.id}`} className="font-heading font-bold uppercase tracking-wider text-sm hover:underline">
                      {order.id}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-heading font-bold uppercase tracking-widest font-medium text-sm text-black leading-tight">{order.customer.name}</p>
                      <p className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/50 mt-0.5">{order.customer.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-xs text-black/70">
                    {order.itemsCount ?? order.products?.length ?? 0} {(order.itemsCount ?? order.products?.length ?? 0) === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3 px-4 font-heading uppercase tracking-widest text-xs font-bold">
                    ₹{(order.total ?? 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge 
                      status={order.paymentStatus} 
                      variant={getPaymentStatusVariant(order.paymentStatus)} 
                    />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge 
                      status={order.orderStatus.replace('_', ' ')} 
                      variant={getOrderStatusVariant(order.orderStatus)} 
                    />
                  </td>
                  <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-[10px] text-black/60 whitespace-nowrap">
                    {new Date(order.createdDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/orders/${order.id}`}>
                      <button className="p-2 text-black/50 hover:text-black hover:bg-black/5 transition-colors" title="View Order">
                        <Eye className="w-4 h-4" />
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
