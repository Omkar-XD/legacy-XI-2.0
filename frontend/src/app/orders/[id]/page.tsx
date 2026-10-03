"use client";


import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, CreditCard, Clock, Truck, ExternalLink } from "lucide-react";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";

const timelineSteps = [
  { id: "PENDING", label: "Order Placed", description: "We have received your order." },
  { id: "PROCESSING", label: "Processing", description: "Your order is being packed." },
  { id: "SHIPPED", label: "Shipped", description: "Your order has been handed over to the courier." },
  { id: "DELIVERED", label: "Delivered", description: "Your order has been delivered." }
];

export default function CustomerOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await apiClient.get<any>(`/api/orders/${orderId}`);
        // Map backend response to match UI structure
        setOrder({
          id: res.order.id,
          date: res.order.created_at,
          total: res.order.total_amount,
          paymentStatus: res.order.payment_status || res.order.status,
          orderStatus: res.order.status,
          products: res.items.map((i: any) => ({
            name: i.product_name || "Product",
            size: i.variant_size,
            quantity: i.quantity,
            price: i.unit_price,
            image: "/placeholder.jpg" // We'd need to join media in backend or handle it here
          })),
          shippingAddress: res.order.shipping_address || {},
          payment: {
            provider: res.order.payment_provider || "N/A",
            last4: res.order.payment_id ? res.order.payment_id.slice(-4) : "N/A",
            amount: res.order.total_amount
          },
          tracking: res.order.status === "SHIPPED" || res.order.status === "DELIVERED" ? {
            courier: res.order.courier || "N/A",
            trackingNumber: res.order.tracking_number || "N/A",
            url: res.order.tracking_url || "#",
            estimatedDelivery: res.order.estimated_delivery || res.order.created_at
          } : null
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!order) return <div className="p-12 text-center text-red-500">Order not found</div>;

  // Calculate timeline progress
  const currentStatusIndex = timelineSteps.findIndex(s => s.id === order.orderStatus);
  
  return (
    <div className="w-full flex flex-col flex-grow bg-white min-h-screen pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-black/10 gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/account">
                <button className="p-2 border border-black/20 hover:bg-black/5 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-black" />
                </button>
              </Link>
              <h1 className="text-2xl md:text-4xl font-heading font-bold uppercase tracking-widest text-black">
                Order {order.id}
              </h1>
            </div>
            <p className="font-sans text-sm text-black/60 pl-[52px]">Placed on {new Date(order.date).toLocaleDateString()}</p>
          </div>
          
          <div className="flex flex-col items-end sm:pl-0 pl-[52px]">
            <span className="px-3 py-1 bg-black text-white text-xs font-heading font-bold uppercase tracking-widest">
              {order.orderStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content - Left */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Timeline */}
            <div className="border border-black p-6 md:p-8">
              <h2 className="font-heading font-bold uppercase tracking-widest text-lg border-b border-black/10 pb-4 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Order Status
              </h2>
              
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-black/10 z-0"></div>
                
                <div className="space-y-6">
                  {timelineSteps.map((step, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    
                    return (
                      <div key={step.id} className="relative z-10 flex gap-6">
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 mt-0.5 ${
                          isCompleted 
                            ? "bg-black border-black" 
                            : "bg-white border-black/20"
                        }`}>
                          {isCompleted && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div>
                          <p className={`font-heading font-bold uppercase tracking-widest text-sm ${
                            isCompleted ? "text-black" : "text-black/40"
                          }`}>
                            {step.label}
                          </p>
                          <p className={`font-sans text-xs mt-1 ${
                            isCompleted ? "text-black/70" : "text-black/40"
                          }`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Product Summary */}
            <div className="border border-black p-6 md:p-8">
              <h2 className="font-heading font-bold uppercase tracking-widest text-lg border-b border-black/10 pb-4 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5" /> Items
              </h2>
              
              <div className="space-y-6">
                {order.products.map((product: { name: string, image: string, size: string, quantity: number, price: number }, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-20 h-24 relative bg-black/5 border border-black/10 flex-shrink-0">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <h3 className="font-heading font-bold uppercase tracking-wider text-sm">{product.name}</h3>
                        <p className="font-sans text-xs text-black/60 mt-1">Size: {product.size}</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className="font-sans text-sm font-medium">Qty: {product.quantity}</p>
                        <p className="font-sans text-sm font-bold">${(product.price * product.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-black/10 mt-6 pt-6 flex justify-between items-center">
                <p className="font-heading font-bold uppercase tracking-widest text-sm">Order Total</p>
                <p className="font-sans text-lg font-bold">${order.total.toFixed(2)}</p>
              </div>
            </div>
            
          </div>

          {/* Sidebar - Right */}
          <div className="space-y-6">
            
            {/* Tracking Info */}
            {order.orderStatus === "SHIPPED" || order.orderStatus === "DELIVERED" ? (
              <div className="border border-black p-6 bg-black/[0.02] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="font-heading font-bold uppercase tracking-widest text-sm border-b border-black/10 pb-3 mb-4 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Tracking Info
                </h2>
                
                <div className="space-y-4 font-sans text-sm">
                  <div>
                    <p className="text-xs font-heading font-bold uppercase tracking-widest text-black/50 mb-1">Courier</p>
                    <p className="font-medium">{order.tracking.courier}</p>
                  </div>
                  <div>
                    <p className="text-xs font-heading font-bold uppercase tracking-widest text-black/50 mb-1">Tracking Number</p>
                    <p className="font-medium">{order.tracking.trackingNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-heading font-bold uppercase tracking-widest text-black/50 mb-1">Est. Delivery</p>
                    <p className="font-medium">{new Date(order.tracking.estimatedDelivery).toLocaleDateString()}</p>
                  </div>
                  
                  <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-black text-white font-heading font-bold uppercase tracking-widest text-[10px] hover:bg-black/80 transition-colors">
                    Track Shipment <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : null}

            {/* Shipping Address */}
            <div className="border border-black/20 p-6">
              <h2 className="font-heading font-bold uppercase tracking-widest text-sm border-b border-black/10 pb-3 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping Address
              </h2>
              <div className="font-sans text-sm text-black/70 leading-relaxed">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border border-black/20 p-6">
              <h2 className="font-heading font-bold uppercase tracking-widest text-sm border-b border-black/10 pb-3 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment
              </h2>
              <div className="space-y-3 font-sans text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <span className="text-black/60">Status</span>
                  <span className="font-bold text-green-700">{order.paymentStatus}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black/60">Method</span>
                  <span>{order.payment.provider} ending in {order.payment.last4}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
