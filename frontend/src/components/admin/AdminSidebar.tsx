"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Archive, 
  ShoppingCart, 
  Users, 
  LogOut,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Inventory", href: "/admin/inventory", icon: Archive },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Tracking", href: "/admin/tracking", icon: Truck },
  { name: "Customers", href: "/admin/customers", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex flex-col w-64 h-screen border-r border-black/10 bg-white sticky top-0">
      <div className="h-20 flex items-center px-6 border-b border-black/10">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <img src="/logo.png" alt="Legacy XI" className="h-12 w-auto object-contain" />
          <span className="font-heading font-bold uppercase tracking-widest text-lg text-black/50 mt-1">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-4 px-4 py-3 rounded-none font-heading font-bold uppercase tracking-widest text-xs transition-colors",
                isActive 
                  ? "bg-black text-white" 
                  : "text-black hover:bg-black/5"
              )}
            >
              <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-black")} />
              <span className="mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-black/10">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center space-x-4 px-4 py-3 rounded-none font-heading font-bold uppercase tracking-widest text-xs text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="mt-0.5">Logout</span>
        </button>
      </div>
    </div>
  );
}
