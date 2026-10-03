"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, MapPin, Package, Truck, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "ORD-0000-XX";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full flex flex-col flex-grow bg-white min-h-screen pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col items-center text-center mb-12">
          <CheckCircle2 className="w-20 h-20 text-green-600 mb-6" />
          <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-widest text-black mb-4">
            Order Placed
          </h1>
          <p className="font-sans text-black/60 max-w-md mb-2">
            Thank you for your purchase! We have received your order and will begin processing it shortly.
          </p>
          <p className="font-heading font-bold uppercase tracking-widest text-lg text-black mt-4">
            Order Number: {orderId}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border border-black/10 p-6 md:p-10 bg-black/[0.02]">
          <div className="space-y-6">
            <h2 className="font-heading font-bold uppercase tracking-widest border-b border-black/10 pb-2 flex items-center gap-2">
              <Package className="w-5 h-5" /> Order Summary
            </h2>
            <div className="font-sans text-sm space-y-2 text-black/70">
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-bold text-green-600 uppercase tracking-widest text-xs">Paid</span>
              </div>
              <div className="flex justify-between">
                <span>Order Status:</span>
                <span className="font-bold text-black uppercase tracking-widest text-xs">Processing</span>
              </div>
            </div>

            <h2 className="font-heading font-bold uppercase tracking-widest border-b border-black/10 pb-2 flex items-center gap-2 mt-8">
              <MapPin className="w-5 h-5" /> Delivery Address
            </h2>
            <div className="font-sans text-sm text-black/70">
              <p>John Doe</p>
              <p>123 Main St</p>
              <p>New York, NY 10001</p>
              <p>United States</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="font-heading font-bold uppercase tracking-widest border-b border-black/10 pb-2 flex items-center gap-2">
              <Truck className="w-5 h-5" /> Shipping Details
            </h2>
            <div className="font-sans text-sm space-y-2 text-black/70">
              <div className="flex justify-between">
                <span>Estimated Delivery:</span>
                <span className="font-bold text-black">3 - 5 Business Days</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Method:</span>
                <span className="font-bold text-black">Standard Shipping</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <Link href={`/account?tab=tracking&order=${orderId}`} className="w-full py-4 bg-black text-white font-heading font-bold uppercase tracking-widest text-sm hover:bg-black/90 transition-colors flex items-center justify-center gap-2">
                Track Order <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/shop" className="w-full py-4 border border-black text-black font-heading font-bold uppercase tracking-widest text-sm hover:bg-black/5 transition-colors flex items-center justify-center">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="w-full flex justify-center p-12">Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
