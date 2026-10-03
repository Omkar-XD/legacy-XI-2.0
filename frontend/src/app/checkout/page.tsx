"use client";

import React, { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Loader2, X, CreditCard, ScanLine, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, isLoading } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Payment states for the modal
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "razorpay" | "cod">("stripe");
  const [paymentState, setPaymentState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    
    if (!isLoggedIn) {
      router.push("/login?redirect=/checkout");
      return;
    }

    // Sync cart state on mount to prevent "Cart is empty" mismatches
    useCartStore.getState().fetchCart();
    
    // Fetch addresses
    apiClient.get<any>('/api/account/addresses')
      .then(res => {
        if (res.addresses && res.addresses.length > 0) {
          setAddresses(res.addresses);
          const defaultAddr = res.addresses.find((a: any) => a.is_default);
          setSelectedAddress(defaultAddr ? defaultAddr.id : res.addresses[0].id);
        }
      })
      .catch(err => console.error("Failed to load addresses", err));
  }, []);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 15 : 0; // Flat $15 shipping for now
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    // If order is already created, just open the modal.
    if (createdOrderId) {
      setIsModalOpen(true);
      return;
    }
    
    setPaymentState("loading");
    setErrorMessage("");
    
    try {
      // 1. Backend Checkout API (which does inventory reservation & creates order)
      const res = await apiClient.post<any>('/api/checkout', {});
      setCreatedOrderId(res.order.id);
      setIsModalOpen(true);
      setPaymentState("idle");
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes("empty")) {
        useCartStore.getState().fetchCart();
      }
      setPaymentState("error");
      setErrorMessage(err.message || "Checkout failed. Please try again.");
    }
  };

  const handlePaymentSubmit = async () => {
    if (!createdOrderId) return;
    setPaymentState("loading");
    setErrorMessage("");

    try {
      if (paymentProvider === "cod") {
        await apiClient.post<any>('/api/payments/create', { 
          order_id: createdOrderId, 
          provider: 'COD' 
        });
        await clearCart();
        router.push(`/checkout/success?orderId=${createdOrderId}`);
        return;
      }
      
      const payRes = await apiClient.post<any>('/api/payments/create', { 
        order_id: createdOrderId, 
        provider: paymentProvider 
      });
      
      await clearCart();
      router.push(`/checkout/success?orderId=${createdOrderId}`);
      
    } catch (err: any) {
      setPaymentState("error");
      setErrorMessage(err.message || "Payment failed. Please try again.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full flex flex-col flex-grow bg-white min-h-screen pt-12 pb-24 relative">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-black/10">
          <button onClick={() => router.back()} className="p-2 border border-black/20 hover:bg-black/5 transition-colors">
            <ArrowLeft className="w-4 h-4 text-black" />
          </button>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-widest text-black">
            Checkout
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 flex-col gap-4">
            <Loader2 className="w-8 h-8 text-black animate-spin" />
            <p className="font-heading font-bold uppercase tracking-widest text-sm">Loading your cart...</p>
          </div>
        ) : items.length === 0 && !createdOrderId ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-heading font-bold uppercase tracking-widest text-black mb-4">Your cart is empty</h2>
            <Link href="/shop" className="px-8 py-4 bg-black text-white font-heading font-bold uppercase tracking-widest text-sm hover:bg-black/90 transition-colors inline-block mt-4">
              Return to Shop
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Left Column - Forms */}
            <div className="flex-grow space-y-10">
              
              {paymentState === "error" && !isModalOpen && (
                <div className="border border-red-600 bg-red-50 p-4 flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-0.5">!</span>
                  <div>
                    <h3 className="font-heading font-bold uppercase tracking-widest text-sm text-red-800">Checkout Error</h3>
                    <p className="font-sans text-sm text-red-700 mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              <section className={paymentState === "loading" && !isModalOpen ? "opacity-50 pointer-events-none" : ""}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold uppercase tracking-widest text-black flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Shipping Address
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {addresses.map((address) => (
                    <label 
                      key={address.id} 
                      className={`border p-5 cursor-pointer transition-all ${
                        selectedAddress === address.id 
                          ? "border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black/5" 
                          : "border-black/20 hover:border-black/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading font-bold uppercase tracking-wider">{address.first_name} {address.last_name}</span>
                        <input 
                          type="radio" 
                          name="shipping_address" 
                          value={address.id}
                          checked={selectedAddress === address.id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="accent-black w-4 h-4"
                        />
                      </div>
                      <div className="font-sans text-sm text-black/70 space-y-1">
                        <p>{address.line1 || address.address_line_1}</p>
                        {(address.line2 || address.address_line_2) && <p>{address.line2 || address.address_line_2}</p>}
                        <p>{address.city}, {address.state} {address.zip_code || address.postal_code}</p>
                        <p>{address.country}</p>
                      </div>
                    </label>
                  ))}
                  <div 
                    onClick={() => {
                      const formDiv = document.getElementById("add-address-form");
                      if (formDiv) formDiv.style.display = formDiv.style.display === "none" ? "block" : "none";
                    }}
                    className="border border-black/20 border-dashed p-5 cursor-pointer hover:border-black/50 hover:bg-black/5 transition-all flex flex-col items-center justify-center min-h-[160px]"
                  >
                    <div className="w-8 h-8 rounded-full border border-black flex items-center justify-center mb-2">
                      <span className="text-xl leading-none">+</span>
                    </div>
                    <span className="font-heading font-bold uppercase tracking-widest text-sm">Add New Address</span>
                  </div>
                </div>

                <div id="add-address-form" style={{ display: addresses.length === 0 ? "block" : "none" }} className="border border-black p-5 mt-4">
                  <h3 className="font-heading font-bold uppercase tracking-widest text-sm mb-4">Add New Address</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const newAddr = {
                      first_name: fd.get('first_name'),
                      last_name: fd.get('last_name'),
                      address_line_1: fd.get('address_line_1'),
                      city: fd.get('city'),
                      state: fd.get('state'),
                      postal_code: fd.get('postal_code'),
                      country: fd.get('country'),
                      phone: fd.get('phone'),
                      type: 'shipping'
                    };
                    try {
                      const res = await apiClient.post<{address: any}>('/api/account/addresses', newAddr);
                      setAddresses([...addresses, res.address]);
                      setSelectedAddress(res.address.id);
                      (e.target as HTMLFormElement).reset();
                      const formDiv = document.getElementById("add-address-form");
                      if (formDiv) formDiv.style.display = "none";
                    } catch (err) {
                      console.error('Failed to add address', err);
                      alert('Failed to add address');
                    }
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input name="first_name" placeholder="First Name" required className="border border-black/20 px-3 py-2 text-sm focus:border-black outline-none" />
                      <input name="last_name" placeholder="Last Name" required className="border border-black/20 px-3 py-2 text-sm focus:border-black outline-none" />
                    </div>
                    <input name="address_line_1" placeholder="Street Address" required className="w-full border border-black/20 px-3 py-2 text-sm focus:border-black outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <input name="city" placeholder="City" required className="border border-black/20 px-3 py-2 text-sm focus:border-black outline-none" />
                      <input name="state" placeholder="State" required className="border border-black/20 px-3 py-2 text-sm focus:border-black outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input name="postal_code" placeholder="Zipcode" required className="border border-black/20 px-3 py-2 text-sm focus:border-black outline-none" />
                      <input name="country" placeholder="Country" required className="border border-black/20 px-3 py-2 text-sm focus:border-black outline-none" />
                    </div>
                    <input name="phone" placeholder="Phone Number" className="w-full border border-black/20 px-3 py-2 text-sm focus:border-black outline-none" />
                    <button type="submit" className="px-4 py-2 bg-black text-white font-heading font-bold uppercase tracking-widest text-[10px]">Add & Select Address</button>
                  </form>
                </div>
              </section>

              {/* Action */}
              <div className="pt-6">
                <button
                  onClick={handlePlaceOrder}
                  disabled={paymentState === "loading" && !isModalOpen}
                  className="w-full py-5 bg-black text-white font-heading font-bold uppercase tracking-widest text-lg hover:bg-black/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {(paymentState === "loading" && !isModalOpen) ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Proceed to Payment</span>
                  )}
                </button>
                <p className="text-center font-sans text-xs text-black/50 mt-4">
                  You will choose your payment method on the next step.
                </p>
              </div>

            </div>

            {/* Right Column - Order Summary */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="border border-black p-6 bg-black/[0.02] sticky top-24">
                <h2 className="font-heading font-bold uppercase tracking-widest text-lg border-b border-black/10 pb-4 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-20 relative bg-black/5 border border-black/10 flex-shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-black/5" />
                        )}
                      </div>
                      <div className="flex-grow flex flex-col justify-center">
                        <p className="font-heading font-bold uppercase tracking-wider text-xs line-clamp-2 leading-tight mb-1">{item.name}</p>
                        <p className="font-sans text-[10px] text-black/60">Size: {item.sizeValue}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-sans text-xs font-medium">Qty: {item.quantity}</p>
                          <p className="font-sans text-xs font-bold">RS. {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 font-sans text-sm border-t border-black/10 pt-6 mb-6">
                  <div className="flex justify-between items-center text-black/70">
                    <span>Subtotal</span>
                    <span>RS. {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-black/70">
                    <span>Shipping</span>
                    <span>RS. {shipping.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-black pb-2 pt-4">
                  <span className="font-heading font-bold uppercase tracking-widest">Total</span>
                  <span className="font-sans text-2xl font-bold">RS. {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>

      {/* PAYMENT MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-[500px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 font-sans tracking-normal normal-case">Payment Method</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 bg-[#f7f9fc]">
              
              {/* Option 1: Credit or Debit Card (Stripe) */}
              <div className={`mb-3 bg-white rounded-xl border transition-all ${paymentProvider === 'stripe' ? 'border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)]' : 'border-gray-200'}`}>
                <label className="flex items-center p-4 cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${paymentProvider === 'stripe' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentProvider === 'stripe' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </div>
                  <span className="font-semibold text-gray-800 flex-grow font-sans text-sm tracking-normal normal-case">Credit or Debit Card</span>
                  <div className="flex gap-1">
                     <span className="text-[10px] bg-gray-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">VISA</span>
                     <span className="text-[10px] bg-gray-100 text-orange-600 font-bold px-1.5 py-0.5 rounded">MC</span>
                     <span className="text-[10px] bg-gray-100 text-cyan-600 font-bold px-1.5 py-0.5 rounded">AMEX</span>
                  </div>
                  <input type="radio" className="hidden" checked={paymentProvider === 'stripe'} onChange={() => setPaymentProvider('stripe')} />
                </label>
                
                {paymentProvider === 'stripe' && (
                  <div className="px-4 pb-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 border-2 border-blue-500 rounded-lg p-2.5 flex flex-col cursor-pointer bg-blue-50/30">
                        <CreditCard className="w-5 h-5 text-blue-600 mb-1" />
                        <span className="text-sm font-semibold text-blue-600">Card</span>
                      </div>
                      <div className="flex-1 border border-gray-200 rounded-lg p-2.5 flex flex-col cursor-not-allowed opacity-60">
                        <Wallet className="w-5 h-5 text-gray-500 mb-1" />
                        <div className="flex items-center justify-between">
                           <span className="text-sm font-medium text-gray-600">Bank</span>
                           <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">$5 back</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 font-sans">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Card number</label>
                        <div className="relative">
                          <input type="text" placeholder="1234 1234 1234 1234" className="w-full border border-gray-300 rounded-md py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-100">
                             <span className="text-[9px] bg-[#1434CB] text-white font-bold px-1 py-0.5 rounded">VISA</span>
                             <span className="text-[9px] bg-[#EB001B] text-white font-bold px-1 py-0.5 rounded">MC</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">Expiration date</label>
                          <input type="text" placeholder="MM / YY" className="w-full border border-gray-300 rounded-md py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">Security code</label>
                          <div className="relative">
                            <input type="text" placeholder="CVC" className="w-full border border-gray-300 rounded-md py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4 flex justify-between items-center mb-1 font-sans">
                      <span className="text-sm font-medium text-[#4b5563]">Promo Code Applied</span>
                      <span className="text-sm font-semibold text-[#16a34a]">-0%</span>
                    </div>
                    <div className="flex justify-between items-center mb-4 font-sans">
                      <span className="text-sm font-medium text-gray-800">Due Today</span>
                      <span className="text-lg font-bold text-gray-900">RS. {total.toFixed(2)}</span>
                    </div>
                    
                    {paymentState === "error" && (
                       <div className="mb-4 text-sm text-red-600 font-medium bg-red-50 p-2 rounded">{errorMessage}</div>
                    )}
                    
                    <button 
                      onClick={handlePaymentSubmit}
                      disabled={paymentState === "loading"}
                      className="w-full bg-[#1c32d4] hover:bg-[#1a2db8] text-white font-medium font-sans text-sm py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 tracking-normal normal-case"
                    >
                      {paymentState === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : `Buy Now`}
                    </button>
                  </div>
                )}
              </div>

              {/* Option 2: Razorpay (Equivalent to PayPal in the design) */}
              <div className={`mb-3 bg-white rounded-xl border transition-all ${paymentProvider === 'razorpay' ? 'border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)]' : 'border-gray-200'}`}>
                <label className="flex items-center p-4 cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${paymentProvider === 'razorpay' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentProvider === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </div>
                  <span className="font-semibold text-gray-800 flex-grow font-sans text-sm tracking-normal normal-case flex items-center gap-2">
                    Razorpay <span className="text-[10px] bg-[#0c2f6d] text-white px-1.5 py-0.5 rounded font-bold italic">UPI</span>
                  </span>
                  <input type="radio" className="hidden" checked={paymentProvider === 'razorpay'} onChange={() => setPaymentProvider('razorpay')} />
                </label>
                
                {paymentProvider === 'razorpay' && (
                  <div className="px-4 pb-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-gray-600 mb-4 font-sans">You will be redirected to Razorpay to complete your payment securely via UPI, NetBanking, or Cards.</p>
                    
                    {paymentState === "error" && (
                       <div className="mb-4 text-sm text-red-600 font-medium bg-red-50 p-2 rounded">{errorMessage}</div>
                    )}
                    
                    <button 
                      onClick={handlePaymentSubmit}
                      disabled={paymentState === "loading"}
                      className="w-full bg-[#1c32d4] hover:bg-[#1a2db8] text-white font-medium font-sans text-sm py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 tracking-normal normal-case"
                    >
                      {paymentState === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue to Razorpay"}
                    </button>
                  </div>
                )}
              </div>

              {/* Option 3: Cash on Delivery (Equivalent to Scan to Pay in the design) */}
              <div className={`bg-white rounded-xl border transition-all ${paymentProvider === 'cod' ? 'border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)]' : 'border-gray-200'}`}>
                <label className="flex items-center p-4 cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${paymentProvider === 'cod' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentProvider === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </div>
                  <span className="font-semibold text-gray-800 flex-grow font-sans text-sm tracking-normal normal-case flex items-center gap-2">
                    Cash on Delivery <ScanLine className="w-4 h-4 text-gray-500" />
                  </span>
                  <input type="radio" className="hidden" checked={paymentProvider === 'cod'} onChange={() => setPaymentProvider('cod')} />
                </label>
                
                {paymentProvider === 'cod' && (
                  <div className="px-4 pb-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-gray-600 mb-4 font-sans">Pay in cash when your order is delivered to your address.</p>
                    
                    {paymentState === "error" && (
                       <div className="mb-4 text-sm text-red-600 font-medium bg-red-50 p-2 rounded">{errorMessage}</div>
                    )}
                    
                    <button 
                      onClick={handlePaymentSubmit}
                      disabled={paymentState === "loading"}
                      className="w-full bg-[#1c32d4] hover:bg-[#1a2db8] text-white font-medium font-sans text-sm py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 tracking-normal normal-case"
                    >
                      {paymentState === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Place Order"}
                    </button>
                  </div>
                )}
              </div>

            </div>
            
            {/* Modal Footer */}
            <div className="p-4 text-center border-t border-gray-100 bg-white rounded-b-2xl">
              <p className="text-[11px] text-gray-400 font-sans tracking-normal normal-case">
                By continuing you accept our <a href="#" className="text-blue-500 hover:underline">Terms of Use</a> and <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>
              </p>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
