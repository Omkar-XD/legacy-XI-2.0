"use client";

import React from "react";
import Link from "next/link";
import { 
  IndianRupee, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Plus,
  Archive,
  Eye,
  Activity
} from "lucide-react";
import { 
  PageHeader, 
  StatCard, 
  DataTable, 
  StatusBadge, 
  AdminCard 
} from "@/components/admin/ui";
import { useProducts, useOrders, useInventory } from "@/lib/api/admin";

export default function AdminDashboardPage() {
  const { data: productsData = [], isLoading: pLoading } = useProducts();
  const { data: ordersData = [], isLoading: oLoading } = useOrders();
  const { data: inventoryData = [], isLoading: iLoading } = useInventory();

  const isLoading = pLoading || oLoading || iLoading;

  const validOrders = ordersData.filter((o: any) => o.orderStatus !== 'CANCELED' && o.orderStatus !== 'CANCELLED');
  const totalOrders = validOrders.length;
  const revenue = validOrders.reduce((acc: number, o: any) => acc + (Number(o.total) || 0), 0);
  const productsCount = productsData.length;
  const lowStockCount = inventoryData.filter((i: any) => i.available <= 5).length;

  const stats = [
    { title: "Total Orders", value: totalOrders.toString(), change: "All time", icon: ShoppingCart, trend: "neutral" as const },
    { title: "Revenue", value: `₹${revenue.toLocaleString()}`, change: "All time", icon: IndianRupee, trend: "neutral" as const },
    { title: "Products", value: productsCount.toString(), change: "Active catalog", icon: Package, trend: "neutral" as const },
    { title: "Low Stock Items", value: lowStockCount.toString(), change: "Requires attention", icon: AlertTriangle, trend: lowStockCount > 0 ? "negative" as const : "positive" as const },
  ];

  const recentOrders = validOrders.slice(0, 5).map((o: any) => ({
    id: o.id,
    customer: o.customer?.email || "Customer",
    items: o.itemsCount || 1,
    amount: `₹${(o.total || 0).toLocaleString()}`,
    status: o.orderStatus?.replace('_', ' ') || "PENDING",
    date: new Date(o.createdDate).toLocaleDateString()
  }));

  const lowStockItemsList = inventoryData
    .filter((i: any) => i.available <= 5)
    .slice(0, 4)
    .map((i: any) => ({
      product: i.productName || `Product ${i.productId}`,
      variant: i.size || i.sku,
      stock: i.available,
      status: i.available === 0 ? "Critical" : "Warning"
    }));

  const recentActivity = [
    { action: "Dashboard synced", target: "Live Data Connected", time: "Just now" }
  ];

  if (isLoading) {
    return <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* 5. Quick Actions integrated into PageHeader */}
      <PageHeader title="Dashboard">
        <Link href="/admin/products/new">
          <button className="hidden md:flex bg-black text-white px-3 py-2 items-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/90 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </Link>
        <Link href="/admin/inventory">
          <button className="bg-white text-black border border-black/20 px-3 py-2 flex items-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/5 transition-colors">
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Inventory</span>
          </button>
        </Link>
        <Link href="/admin/orders">
          <button className="bg-white text-black border border-black/20 px-3 py-2 flex items-center space-x-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/5 transition-colors">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View Orders</span>
          </button>
        </Link>
      </PageHeader>

      {/* 1. Overview Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard 
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* 2. Recent Orders Table */}
        <div className="lg:col-span-2">
          <AdminCard noPadding>
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h2 className="font-heading font-bold uppercase tracking-widest text-sm">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs font-heading font-bold uppercase tracking-widest text-black/60 hover:text-black">View All</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-black/50 font-heading text-xs uppercase tracking-widest font-bold">No orders found</div>
            ) : (
              <DataTable headers={["Order ID", "Customer", "Items", "Amount", "Status", "Date"]}>
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest font-medium text-sm">{order.id}</td>
                    <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-xs">{order.customer}</td>
                    <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-xs">{order.items}</td>
                    <td className="py-3 px-4 font-heading uppercase tracking-widest text-xs font-medium">{order.amount}</td>
                    <td className="py-3 px-4">
                      <StatusBadge 
                        status={order.status} 
                        variant={
                          order.status === "DELIVERED" ? "success" : 
                          order.status === "SHIPPED" ? "default" :
                          order.status === "CANCELLED" ? "error" : "warning"
                        } 
                      />
                    </td>
                    <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-[10px] text-black/60 whitespace-nowrap">{order.date}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </AdminCard>
        </div>

        <div className="space-y-6">
          {/* 3. Low Stock Section */}
          <AdminCard noPadding>
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h2 className="font-heading font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Low Stock
              </h2>
              <Link href="/admin/inventory" className="text-xs font-heading font-bold uppercase tracking-widest text-black/60 hover:text-black">Manage</Link>
            </div>
            <div className="divide-y divide-black/10">
              {lowStockItemsList.length === 0 ? (
                 <div className="p-8 text-center text-black/50 font-heading text-xs uppercase tracking-widest font-bold">Stock levels healthy</div>
              ) : lowStockItemsList.map((item: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-black/[0.02] transition-colors">
                  <div>
                    <p className="font-heading font-bold uppercase tracking-widest font-medium text-sm">{item.product}</p>
                    <p className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">{item.variant}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold uppercase tracking-widest font-bold text-sm text-red-600">{item.stock} left</p>
                    <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-red-600/70">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* 4. Recent Activity Section */}
          <AdminCard noPadding>
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h2 className="font-heading font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {recentActivity.map((activity: any, idx: number) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-black/20 flex-shrink-0" />
                  <div>
                    <p className="font-heading font-bold uppercase tracking-widest text-xs text-black">
                      <span className="font-medium">{activity.action}:</span> {activity.target}
                    </p>
                    <p className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/40 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
