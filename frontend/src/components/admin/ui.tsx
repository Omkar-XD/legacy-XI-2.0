import React from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

// --- AdminCard ---
export function AdminCard({ children, className, noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) {
  return (
    <div className={cn("bg-white border border-black/10 rounded-none", noPadding ? "" : "p-6", className)}>
      {children}
    </div>
  );
}

// --- PageHeader ---
export function PageHeader({ title, children, className }: { title: string, children?: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6", className)}>
      <h1 className="font-heading font-bold uppercase tracking-widest text-xl md:text-2xl text-black">
        {title}
      </h1>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

// --- StatCard ---
export function StatCard({ title, value, change, icon: Icon, trend = "positive" }: { title: string, value: string | number, change?: string, icon?: React.ElementType, trend?: "positive" | "negative" | "neutral" }) {
  return (
    <AdminCard className="flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-black/60">
          {title}
        </h3>
        {Icon && <Icon className="h-4 w-4 text-black/40" />}
      </div>
      <div>
        <div className="text-2xl font-heading font-bold uppercase tracking-widest text-black">{value}</div>
        {change && (
          <p className={cn("text-[10px] font-heading font-bold uppercase tracking-widest mt-1", 
            trend === "positive" ? "text-green-600" : 
            trend === "negative" ? "text-red-600" : 
            "text-black/50"
          )}>
            {change}
          </p>
        )}
      </div>
    </AdminCard>
  );
}

// --- StatusBadge ---
export function StatusBadge({ status, variant = "default" }: { status: string, variant?: "default" | "success" | "warning" | "error" }) {
  const variants = {
    default: "bg-black/5 text-black",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800"
  };
  
  return (
    <span className={cn("inline-block px-2 py-1 font-heading font-bold uppercase tracking-widest text-[10px] rounded-none", variants[variant])}>
      {status}
    </span>
  );
}

// --- SearchInput ---
export function SearchInput({ placeholder = "Search...", className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative flex-1 max-w-md", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
      <input 
        type="text" 
        placeholder={placeholder} 
        className="w-full pl-10 pr-4 py-2 bg-transparent border border-black/20 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black transition-colors rounded-none placeholder:text-black/30"
        {...props}
      />
    </div>
  );
}

// --- FilterBar ---
export function FilterBar({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {children}
    </div>
  );
}

// --- DataTable ---
export function DataTable({ headers, children }: { headers: string[], children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-black/10 bg-black/5">
            {headers.map((header, i) => (
              <th key={i} className="py-3 px-4 font-heading font-bold uppercase tracking-widest text-xs text-black/80 whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// --- Pagination ---
export function Pagination({ currentPage, totalPages }: { currentPage: number, totalPages: number }) {
  return (
    <div className="flex items-center justify-between border-t border-black/10 px-4 py-3 bg-white">
      <span className="font-heading font-bold uppercase tracking-widest text-xs text-black/60">
        Page <span className="font-bold text-black">{currentPage}</span> of <span className="font-bold text-black">{totalPages}</span>
      </span>
      <div className="flex items-center space-x-2">
        <button 
          disabled={currentPage <= 1}
          className="p-1 border border-black/20 text-black disabled:opacity-50 hover:bg-black/5 transition-colors rounded-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button 
          disabled={currentPage >= totalPages}
          className="p-1 border border-black/20 text-black disabled:opacity-50 hover:bg-black/5 transition-colors rounded-none"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- FormSection ---
export function FormSection({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="font-heading font-bold uppercase tracking-widest text-sm border-b border-black/10 pb-2 text-black">
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// --- EmptyState ---
export function EmptyState({ title, description, action }: { title: string, description: string, action?: React.ReactNode }) {
  return (
    <div className="w-full border-2 border-dashed border-black/10 p-12 flex flex-col items-center justify-center text-center bg-black/[0.01]">
      <div className="w-12 h-12 bg-black/5 flex items-center justify-center rounded-none mb-4">
        <Search className="w-6 h-6 text-black/40" />
      </div>
      <h3 className="font-heading font-bold uppercase tracking-widest text-base mb-2">{title}</h3>
      <p className="font-heading font-bold uppercase tracking-widest text-xs text-black/50 mb-6 max-w-sm leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

// --- ConfirmDialog (Custom strict implementation) ---
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, description }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, description: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-white border border-black p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 rounded-none">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="font-heading font-bold uppercase tracking-widest text-lg">{title}</h2>
        </div>
        <p className="font-heading font-bold uppercase tracking-widest text-xs text-black/70 mb-8 leading-relaxed">
          {description}
        </p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-black/20 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/5 transition-colors rounded-none">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white font-heading font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-colors rounded-none">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
