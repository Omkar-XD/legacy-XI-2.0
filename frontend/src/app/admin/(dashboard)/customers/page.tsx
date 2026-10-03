"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, User, Loader2 } from "lucide-react";
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
import { useCustomers } from "@/lib/api/admin";
import { AccountStatus, Customer } from "@/types/admin";

export default function AdminCustomersPage() {
  const { data: customers, isLoading, isError } = useCustomers();

  const getStatusVariant = (status: AccountStatus) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'BANNED': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" />

      <AdminCard noPadding>
        <div className="p-4 border-b border-black/10">
          <FilterBar>
            <SearchInput placeholder="Search name or email..." className="w-full sm:max-w-xs" />
            
            <div className="flex flex-wrap gap-3 flex-1 sm:flex-none">
              <select className="flex-1 sm:flex-none border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BANNED">Banned</option>
              </select>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-black/50 hidden md:inline">Sort By:</span>
              <select className="border border-black/20 bg-transparent px-3 py-2 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black rounded-none">
                <option value="newest">Newest First</option>
                <option value="spent-desc">Most Spent</option>
                <option value="orders-desc">Most Orders</option>
              </select>
            </div>
          </FilterBar>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-black/50">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-heading font-bold uppercase tracking-widest text-xs uppercase tracking-widest font-bold">Loading Customers</p>
          </div>
        ) : isError ? (
          <EmptyState 
            title="Failed to load customers" 
            description="There was an error connecting to the backend server." 
          />
        ) : !customers || customers.length === 0 ? (
          <EmptyState 
            title="No Customers Found" 
            description="You don't have any customers matching the current filters."
          />
        ) : (
          <>
            <DataTable headers={["Customer", "Orders", "Total Spent", "Status", "Joined", "Actions"]}>
              {customers.map((customer: Customer) => (
                <tr key={customer.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-black/5 border border-black/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden rounded-full">
                        {customer.avatarUrl ? (
                          <Image src={customer.avatarUrl} alt={customer.name} fill className="object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-black/40" />
                        )}
                      </div>
                      <div>
                        <Link href={`/admin/customers/${customer.id}`} className="font-heading font-bold uppercase tracking-widest font-medium text-sm text-black leading-tight hover:underline">
                          {customer.name}
                        </Link>
                        <p className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/50 mt-0.5">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-xs text-black/70">
                    {customer.ordersCount}
                  </td>
                  <td className="py-3 px-4 font-heading uppercase tracking-widest text-xs font-bold">
                    ₹{customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge 
                      status={customer.status} 
                      variant={getStatusVariant(customer.status)} 
                    />
                  </td>
                  <td className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-[10px] text-black/60 whitespace-nowrap">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/customers/${customer.id}`}>
                      <button className="p-2 text-black/50 hover:text-black hover:bg-black/5 transition-colors" title="View Customer">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pagination currentPage={1} totalPages={5} />
          </>
        )}
      </AdminCard>
    </div>
  );
}
