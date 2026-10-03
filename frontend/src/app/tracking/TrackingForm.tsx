"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";

export function TrackingForm() {
  const [orderId, setOrderId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      router.push(`/account?tab=tracking&order=${orderId.trim()}`);
    }
  };

  return (
    <div className="mb-16 bg-black/[0.02] border border-black/10 p-6 md:p-10">
      <h2 className="font-heading font-bold uppercase tracking-widest text-xl mb-4 flex items-center justify-center md:justify-start gap-2">
        <Truck className="w-5 h-5" /> Track Your Order
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <input 
          type="text" 
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Enter Order ID (e.g. ORD-9932-B8X)"
          className="flex-grow border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
          required
        />
        <button 
          type="submit" 
          className="bg-black text-white px-8 py-3 font-heading font-bold uppercase tracking-widest text-sm hover:bg-black/90 transition-colors whitespace-nowrap"
        >
          Track Now
        </button>
      </form>
    </div>
  );
}
