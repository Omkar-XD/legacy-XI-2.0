"use client";

import React, { useState, useRef, useEffect } from "react";
import { Menu, User, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";
import { usePathname } from "next/navigation";
import { useInventory, useOrders } from "@/lib/api/admin";
import { Inventory, Order } from "@/types/admin";
import Link from "next/link";

export function AdminHeader() {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: inventory = [] } = useInventory();
  const { data: orders = [] } = useOrders();

  const lowStockItems = inventory.filter((item: Inventory) => item.available < 5);
  const pendingOrders = orders.filter((order: Order) => order.orderStatus === 'PAID' || order.orderStatus === 'PENDING');
  
  const notifications = [
    ...lowStockItems.map((item: Inventory) => ({
      id: `inv-${item.id}`,
      title: 'Low Stock Alert',
      message: `${item.productName} (${item.size}) has ${item.available} left.`,
      link: '/admin/inventory'
    })),
    ...pendingOrders.map((order: Order) => ({
      id: `ord-${order.id}`,
      title: 'Order Action Required',
      message: `Order #${order.id.slice(-6).toUpperCase()} is ${order.orderStatus.toLowerCase()} and needs attention.`,
      link: `/admin/orders`
    }))
  ];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-black/10 bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger className="p-2 -ml-2 text-black/70 hover:text-black">
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-0" showCloseButton={false}>
              <AdminSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            className="p-2 text-black/70 hover:text-black transition-colors relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-black/10 shadow-lg z-50 flex flex-col">
              <div className="p-3 border-b border-black/10 font-heading font-bold uppercase tracking-widest text-xs text-black">
                Notifications ({notifications.length})
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-black/50 font-sans">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Link 
                      href={notif.link} 
                      key={notif.id}
                      onClick={() => setShowNotifications(false)}
                      className="block p-3 border-b border-black/5 hover:bg-black/5 transition-colors"
                    >
                      <div className="font-heading uppercase font-bold tracking-widest text-[10px] text-black">
                        {notif.title}
                      </div>
                      <div className="text-sm font-sans text-black/70 mt-1">
                        {notif.message}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-black/10 mx-2 hidden sm:block"></div>
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-heading uppercase tracking-widest text-xs font-bold text-black">Admin User</span>
            <span className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">admin@legacyxi.com</span>
          </div>
          <div className="w-8 h-8 bg-black/5 flex items-center justify-center">
            <User className="w-4 h-4 text-black" />
          </div>
        </div>
      </div>
    </header>
  );
}
