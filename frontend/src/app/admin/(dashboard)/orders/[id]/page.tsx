"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, Package, User, MapPin, CreditCard, Clock, Settings, ChevronRight, Loader2, Truck } from "lucide-react";
import { PageHeader, AdminCard, StatusBadge, EmptyState } from "@/components/admin/ui";
import { useOrder, useUpdateOrderStatus } from "@/lib/api/admin";
import { PaymentStatus, OrderStatus, OrderItem, OrderTimelineEvent } from "@/types/admin";

export default function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  
  const { data: order, isLoading, isError } = useOrder(orderId);
  const updateMutation = useUpdateOrderStatus();

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

  const handleAction = (action: string) => {
    updateMutation.mutate({ orderId, action });
  };

  const [status, setStatus] = React.useState<OrderStatus>("PENDING");
  const [tracking, setTracking] = React.useState({
    courier: "",
    trackingNumber: "",
    trackingUrl: "",
    shipDate: "",
    estDelivery: "",
    deliveryNotes: "",
    timelineEvent: ""
  });

  React.useEffect(() => {
    if (order) {
      setStatus(order.orderStatus);
      setTracking({
        courier: order.tracking?.courier || "",
        trackingNumber: order.tracking?.trackingNumber || "",
        trackingUrl: order.tracking?.trackingUrl || "",
        shipDate: order.tracking?.shipDate ? new Date(order.tracking.shipDate).toISOString().split('T')[0] : "",
        estDelivery: order.tracking?.estDelivery ? new Date(order.tracking.estDelivery).toISOString().split('T')[0] : "",
        deliveryNotes: order.tracking?.deliveryNotes || "",
        timelineEvent: ""
      });
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-black/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-heading font-bold uppercase tracking-widest text-xs uppercase tracking-widest font-bold">Loading Order...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-5xl">
        <PageHeader title="Error" className="mb-8">
          <Link href="/admin/orders" className="mr-auto">
            <button type="button" className="p-2 border border-black/20 hover:bg-black/5 transition-colors rounded-none mr-4">
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
          </Link>
        </PageHeader>
        <EmptyState title="Order Not Found" description="The order you are trying to view does not exist or an error occurred." />
      </div>
    );
  }

  const handleSaveUpdates = () => {
    updateMutation.mutate({
      orderId,
      action: status !== order.orderStatus ? status : undefined,
      trackingData: {
        courier: tracking.courier,
        tracking_number: tracking.trackingNumber,
        tracking_url: tracking.trackingUrl,
        estimated_delivery_date: tracking.estDelivery || undefined,
        delivery_notes: tracking.deliveryNotes,
        event: tracking.timelineEvent || undefined
      }
    }, {
      onSuccess: () => {
        setTracking(prev => ({ ...prev, timelineEvent: "" }));
        alert("Order updated successfully");
      },
      onError: () => {
        alert("Failed to update order");
      }
    });
  };

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      <PageHeader 
        title={`Order ${order.id}`} 
        className="mb-8"
      >
        <Link href="/admin/orders" className="mr-auto">
          <button type="button" className="p-2 border border-black/20 hover:bg-black/5 transition-colors rounded-none mr-4">
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
        </Link>
        <button 
          onClick={() => window.print()} 
          className="bg-black text-white px-4 py-2 font-heading font-bold uppercase tracking-widest text-xs hover:bg-black/90 transition-colors hidden md:block"
        >
          Download Invoice (PDF)
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Summary */}
          <AdminCard noPadding>
            <div className="p-6">
              <h2 className="font-heading font-bold uppercase tracking-widest text-sm border-b border-black/10 pb-4 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> Order Summary
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Order ID</p>
                  <p className="font-heading font-bold uppercase tracking-widest font-medium text-sm">{order.id}</p>
                </div>
                <div>
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Date</p>
                  <p className="font-heading font-bold uppercase tracking-widest font-medium text-sm">{new Date(order.createdDate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Payment</p>
                  <StatusBadge status={order.paymentStatus} variant={getPaymentStatusVariant(order.paymentStatus)} />
                </div>
                <div>
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Status</p>
                  <StatusBadge status={order.orderStatus.replace('_', ' ')} variant={getOrderStatusVariant(order.orderStatus)} />
                </div>
              </div>
            </div>
          </AdminCard>

          {/* Ordered Products */}
          <AdminCard noPadding>
            <div className="p-6">
              <h2 className="font-heading font-bold uppercase tracking-widest text-sm border-b border-black/10 pb-4 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> Ordered Products
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="pb-3 font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">Product</th>
                      <th className="pb-3 font-heading font-bold uppercase tracking-widest text-[10px] text-black/50">Variant</th>
                      <th className="pb-3 font-heading font-bold uppercase tracking-widest text-[10px] text-black/50 text-right">Price</th>
                      <th className="pb-3 font-heading font-bold uppercase tracking-widest text-[10px] text-black/50 text-center">Qty</th>
                      <th className="pb-3 font-heading font-bold uppercase tracking-widest text-[10px] text-black/50 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {order.products.map((product: OrderItem) => (
                      <tr key={product.id}>
                        <td className="py-4 pr-4">
                          <p className="font-heading font-bold uppercase tracking-widest font-medium text-sm">{product.name}</p>
                        </td>
                        <td className="py-4 px-4 font-heading font-bold uppercase tracking-widest text-[10px] text-black/70">{product.variant}</td>
                        <td className="py-4 px-4 font-heading font-bold uppercase tracking-widest text-xs text-right">₹{product.unitPrice.toLocaleString()}</td>
                        <td className="py-4 px-4 font-heading font-bold uppercase tracking-widest text-xs text-center font-medium">{product.quantity}</td>
                        <td className="py-4 pl-4 font-heading uppercase tracking-widest text-xs font-bold text-right">₹{product.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-black/20">
                      <td colSpan={4} className="py-4 pr-4 font-heading font-bold uppercase tracking-widest text-xs text-right">Grand Total</td>
                      <td className="py-4 pl-4 font-heading uppercase tracking-widest text-base font-bold text-right">₹{order.payment.amount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </AdminCard>

          {/* Payment Information */}
          <AdminCard noPadding>
            <div className="p-6">
              <h2 className="font-heading font-bold uppercase tracking-widest text-sm border-b border-black/10 pb-4 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment Information
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Provider</p>
                  <p className="font-heading font-bold uppercase tracking-widest font-medium text-sm">{order.payment.provider}</p>
                </div>
                <div>
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Payment ID</p>
                  <p className="font-heading font-bold uppercase tracking-widest font-medium text-sm">{order.payment.paymentId}</p>
                </div>
                <div>
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Amount</p>
                  <p className="font-heading font-bold uppercase tracking-widest font-medium text-sm">₹{order.payment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Status</p>
                  <StatusBadge status={order.payment.status} variant={getPaymentStatusVariant(order.payment.status)} />
                </div>
              </div>
            </div>
          </AdminCard>

        </div>

        {/* RIGHT COLUMN - Sidebar */}
        <div className="space-y-6">
          
          {/* Update Order / Shipping Details */}
          <AdminCard noPadding className="border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-6 bg-black/[0.02]">
              <h2 className="font-heading font-bold uppercase tracking-widest text-base border-b border-black/10 pb-4 mb-5 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Update Order
              </h2>
              
              <div className="space-y-5">
                {/* Order Status */}
                <div className="space-y-2">
                  <label className="text-sm font-heading font-bold tracking-widest uppercase text-black/80">
                    Order Status
                  </label>
                  <select 
                    className="w-full border border-black px-3 py-2.5 text-sm font-heading font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-black bg-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                
                {/* Courier */}
                <div className="space-y-2">
                  <label className="text-sm font-heading font-bold tracking-widest uppercase text-black/80">
                    Courier / Partner
                  </label>
                  <input type="text" className="w-full border border-black px-3 py-2.5 text-sm font-heading font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-black bg-white" placeholder="e.g. FedEx" value={tracking.courier} onChange={(e) => setTracking({...tracking, courier: e.target.value})} />
                </div>
                
                {/* Tracking Number */}
                <div className="space-y-2">
                  <label className="text-sm font-heading font-bold tracking-widest uppercase text-black/80">
                    Tracking Number
                  </label>
                  <input type="text" className="w-full border border-black px-3 py-2.5 text-sm font-heading font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-black bg-white" placeholder="Tracking #" value={tracking.trackingNumber} onChange={(e) => setTracking({...tracking, trackingNumber: e.target.value})} />
                </div>

                {/* Tracking URL */}
                <div className="space-y-2">
                  <label className="text-sm font-heading font-bold tracking-widest uppercase text-black/80">
                    Tracking URL
                  </label>
                  <input type="url" className="w-full border border-black px-3 py-2.5 text-sm font-heading font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-black bg-white" placeholder="https://" value={tracking.trackingUrl} onChange={(e) => setTracking({...tracking, trackingUrl: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-heading font-bold tracking-widest uppercase text-black/80">
                      Ship Date
                    </label>
                    <input type="date" className="w-full border border-black px-3 py-2.5 text-sm font-heading font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-black bg-white" value={tracking.shipDate} onChange={(e) => setTracking({...tracking, shipDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-heading font-bold tracking-widest uppercase text-black/80">
                      Est. Delivery
                    </label>
                    <input type="date" className="w-full border border-black px-3 py-2.5 text-sm font-heading font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-black bg-white" value={tracking.estDelivery} onChange={(e) => setTracking({...tracking, estDelivery: e.target.value})} />
                  </div>
                </div>

                {/* Delivery Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-heading font-bold tracking-widest uppercase text-black/80">
                    Delivery Notes
                  </label>
                  <textarea rows={2} className="w-full border border-black px-3 py-2.5 text-sm font-heading font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-black bg-white" placeholder="Add internal or customer-facing notes..." value={tracking.deliveryNotes} onChange={(e) => setTracking({...tracking, deliveryNotes: e.target.value})}></textarea>
                </div>
                
                {/* Add Timeline Event */}
                <div className="pt-4 border-t border-black/10">
                  <div className="space-y-2">
                    <label className="text-sm font-heading font-bold tracking-widest uppercase text-black/80">
                      Add Timeline Update
                    </label>
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 border border-black px-3 py-2 text-sm font-heading font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-black bg-white" placeholder="e.g. Out for delivery" value={tracking.timelineEvent} onChange={(e) => setTracking({...tracking, timelineEvent: e.target.value})} />
                      <button type="button" onClick={() => handleSaveUpdates()} disabled={updateMutation.isPending} className="px-4 py-2 border border-black hover:bg-black/5 text-sm font-heading font-bold uppercase tracking-widest transition-colors">
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveUpdates}
                    disabled={updateMutation.isPending}
                    className="w-full px-4 py-3.5 bg-black text-white font-heading font-bold uppercase tracking-widest text-sm hover:bg-black/90 transition-colors disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </div>
            </div>
          </AdminCard>

          {/* Customer */}
          <AdminCard noPadding>
            <div className="p-6">
              <h2 className="font-heading font-bold uppercase tracking-widest text-base border-b border-black/10 pb-4 mb-5 flex items-center gap-2">
                <User className="w-5 h-5" /> Customer
              </h2>
              <div className="space-y-1.5 font-heading font-bold uppercase tracking-widest text-sm">
                <p className="font-bold">{order.customer.name}</p>
                <p className="text-black/80">{order.customer.email}</p>
                <p className="text-black/80">{order.customer.phone}</p>
              </div>
            </div>
          </AdminCard>

          {/* Shipping Address */}
          <AdminCard noPadding>
            <div className="p-6">
              <h2 className="font-heading font-bold uppercase tracking-widest text-base border-b border-black/10 pb-4 mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Shipping Address
              </h2>
              <div className="font-heading font-bold uppercase tracking-widest text-sm text-black/80 leading-relaxed space-y-1">
                <p className="font-medium text-black">{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          </AdminCard>

          {/* Order Timeline */}
          <AdminCard noPadding>
            <div className="p-6">
              <h2 className="font-heading font-bold uppercase tracking-widest text-base border-b border-black/10 pb-4 mb-5 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Timeline
              </h2>
              <div className="space-y-6">
                {order.timeline.map((step: OrderTimelineEvent, index: number) => (
                  <div key={index} className="flex gap-4 relative">
                    {/* Vertical line connecting steps */}
                    {index < order.timeline.length - 1 && (
                      <div className="absolute left-2.5 top-6 bottom-[-24px] w-px bg-black/15"></div>
                    )}
                    <div className="relative z-10">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                        step.completed 
                          ? 'border-black bg-black' 
                          : 'border-black/25 bg-white'
                      }`}>
                        {step.completed && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                    </div>
                    <div className="flex-1 pb-1">
                      <p className={`font-heading text-sm font-bold uppercase tracking-widest ${step.completed ? 'text-black' : 'text-black/50'}`}>
                        {step.event}
                      </p>
                      {step.date && (
                        <p className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/60 mt-1">
                          {new Date(step.date).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AdminCard>

        </div>
      </div>
    </div>
  );
}
