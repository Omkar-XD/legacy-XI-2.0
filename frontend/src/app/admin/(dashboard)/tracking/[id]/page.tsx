"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Truck, Calendar, MapPin, Edit3 } from "lucide-react";
import { PageHeader, AdminCard, StatusBadge } from "@/components/admin/ui";
import { useOrder } from "@/lib/api/admin";

export default function AdminTrackingUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: order, isLoading } = useOrder(resolvedParams.id);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [status, setStatus] = useState(order?.orderStatus || "PROCESSING");
  const [courier, setCourier] = useState(order?.tracking?.courier || "");
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking?.trackingNumber || "");
  const [trackingUrl, setTrackingUrl] = useState(order?.tracking?.trackingUrl || "");
  const [shippingDate, setShippingDate] = useState(order?.tracking?.shipDate || "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(order?.tracking?.estDelivery || "");
  const [deliveryNotes, setDeliveryNotes] = useState(order?.tracking?.deliveryNotes || "");

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      alert("Tracking information updated successfully!");
      setIsSaving(false);
    }, 1000);
  };

  if (isLoading || !order) {
    return <div className="p-12 text-center">{isLoading ? "Loading..." : "Order Not Found..."}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/tracking" className="p-2 border border-black/20 hover:bg-black/5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader title={`Update Tracking: ${order.id}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard>
            <div className="font-heading font-bold uppercase tracking-widest text-sm mb-4">Shipping Details</div>
            <div className="space-y-6 p-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-heading font-bold uppercase tracking-widest text-black/70">Order Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                  >
                    <option value="ORDER_PLACED">Order Placed</option>
                    <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-heading font-bold uppercase tracking-widest text-black/70">Courier / Partner</label>
                  <select 
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                  >
                    <option value="">Select Courier...</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="DHL">DHL</option>
                    <option value="USPS">USPS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-heading font-bold uppercase tracking-widest text-black/70">Tracking Number</label>
                  <input 
                    type="text" 
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. 1Z9999999999999999"
                    className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-heading font-bold uppercase tracking-widest text-black/70">Tracking URL</label>
                  <input 
                    type="url" 
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-heading font-bold uppercase tracking-widest text-black/70 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Shipping Date
                  </label>
                  <input 
                    type="date" 
                    value={shippingDate}
                    onChange={(e) => setShippingDate(e.target.value)}
                    className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-heading font-bold uppercase tracking-widest text-black/70 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Estimated Delivery
                  </label>
                  <input 
                    type="date" 
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-heading font-bold uppercase tracking-widest text-black/70">Delivery Notes / Updates</label>
                <textarea 
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Package left at front door..."
                  rows={3}
                  className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans resize-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-black text-white px-8 py-3 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Updates"}</span>
              </button>
            </div>
          </AdminCard>
        </div>

        {/* Right Column: Order Context */}
        <div className="space-y-6">
          <AdminCard>
            <div className="font-heading font-bold uppercase tracking-widest text-sm mb-4">Order Summary</div>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-black/10 pb-4">
                <span className="font-heading font-bold uppercase tracking-widest text-xs text-black/60">Total</span>
                <span className="font-sans font-bold text-lg">₹{(order.total ?? 0).toLocaleString()}</span>
              </div>
              
              <div className="space-y-3 pt-2">
                <h3 className="font-heading font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Destination
                </h3>
                <div className="font-sans text-sm text-black/70">
                  <p>{order.customer?.name || 'Unknown Customer'}</p>
                  {order.shippingAddress ? (
                    <>
                      <p>{order.shippingAddress.line1 || order.shippingAddress.address_line_1}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip || order.shippingAddress.postal_code}</p>
                      <p>{order.shippingAddress.country}</p>
                    </>
                  ) : (
                    <p>No shipping address provided</p>
                  )}
                </div>
              </div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="font-heading font-bold uppercase tracking-widest text-sm mb-4">Current Timeline</div>
              <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-1 before:-translate-x-px before:h-full before:w-0.5 before:bg-black/10 mt-2">
                {(order.timeline || []).map((step: any, idx: number) => (
                  <div key={idx} className="relative flex items-start group">
                    <div className={`flex items-center justify-center w-3 h-3 rounded-full absolute left-[-26px] mt-1 ${step.completed ? 'bg-black' : 'bg-black/20 border-2 border-white'}`}></div>
                    <div>
                      <p className={`font-heading font-bold uppercase tracking-widest text-[10px] ${step.completed ? 'text-black' : 'text-black/40'}`}>
                        {step.event}
                      </p>
                      {step.date && (
                        <p className="font-sans text-xs text-black/60 mt-0.5">{new Date(step.date).toLocaleString()}</p>
                      )}
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
