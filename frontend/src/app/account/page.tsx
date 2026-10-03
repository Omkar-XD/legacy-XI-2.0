"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, MapPin, Plus, Edit2, Trash2, Camera, Package, Eye, Truck, RefreshCw, LogOut, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  dob: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout, updateAvatarUrl } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "orders" | "tracking">(
    (searchParams.get("tab") as any) || "orders"
  );
  const [trackingOrderId, setTrackingOrderId] = useState<string>(
    searchParams.get("order") || ""
  );
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [trackingTimeline, setTrackingTimeline] = useState<any[]>([]);
  const [trackingDetails, setTrackingDetails] = useState<any>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.jpg");
  const [showAddressForm, setShowAddressForm] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dob: "",
    }
  });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [profileRes, addressesRes, ordersRes] = await Promise.all([
          apiClient.get<any>('/api/account/profile').catch(() => null),
          apiClient.get<any>('/api/account/addresses').catch(() => ({ addresses: [] })),
          apiClient.get<any>('/api/orders').catch(() => ({ orders: [] }))
        ]);
        
        if (profileRes?.profile) {
          reset({
            firstName: profileRes.profile.first_name || "",
            lastName: profileRes.profile.last_name || "",
            email: profileRes.profile.email || "",
            phone: profileRes.profile.phone || "",
            dob: profileRes.profile.dob ? profileRes.profile.dob.split('T')[0] : "",
          });
          if (profileRes.profile.avatar_url) {
            setAvatarUrl(profileRes.profile.avatar_url);
            updateAvatarUrl(profileRes.profile.avatar_url);
          }
        }
        
        setAddresses(addressesRes?.addresses || []);
        setOrders(ordersRes?.orders || []);
        
        if (ordersRes?.orders?.length > 0 && !trackingOrderId) {
          setTrackingOrderId(ordersRes.orders[0].id);
        }
      } catch (err) {
        console.error("Failed to load account data", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [reset]); // trackingOrderId removed to avoid loop

  useEffect(() => {
    async function loadTracking() {
      if (!trackingOrderId) return;
      try {
        const res = await apiClient.get<any>(`/api/orders/${trackingOrderId}/tracking`);
        setTrackingTimeline(res.timeline || []);
        setTrackingDetails(res);
      } catch (err) {
        console.error("Failed to load tracking", err);
        setTrackingTimeline([]);
        setTrackingDetails(null);
      }
    }
    loadTracking();
  }, [trackingOrderId]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const onSaveProfile = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      await apiClient.patch('/api/account/profile', {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        dob: data.dob
      });
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post<{avatar_url: string}>('/api/account/profile/avatar', formData);
      if (res.avatar_url) {
        setAvatarUrl(res.avatar_url);
        updateAvatarUrl(res.avatar_url);
      }
    } catch (err) {
      console.error('Failed to upload avatar', err);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await apiClient.delete(`/api/account/addresses/${id}`);
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      await apiClient.patch(`/api/account/addresses/${id}`, { is_default: 1 });
      setAddresses(addresses.map(a => ({ ...a, is_default: a.id === id ? 1 : 0 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await apiClient.post(`/api/orders/${orderId}/cancel`);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'CANCELED' } : o));
      alert('Order canceled successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="w-full flex flex-col flex-grow bg-white min-h-screen pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-widest text-black mb-12 border-b border-black/10 pb-4">
          My Account
        </h1>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="flex flex-col space-y-2">
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex items-center space-x-3 px-4 py-3 font-heading uppercase tracking-widest text-sm font-bold transition-colors ${
                  activeTab === "orders" 
                    ? "bg-black text-white" 
                    : "bg-transparent text-black hover:bg-black/5"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>My Orders</span>
              </button>
              <button
                onClick={() => setActiveTab("tracking")}
                className={`flex items-center space-x-3 px-4 py-3 font-heading uppercase tracking-widest text-sm font-bold transition-colors ${
                  activeTab === "tracking" 
                    ? "bg-black text-white" 
                    : "bg-transparent text-black hover:bg-black/5"
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Track Order</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center space-x-3 px-4 py-3 font-heading uppercase tracking-widest text-sm font-bold transition-colors ${
                  activeTab === "profile" 
                    ? "bg-black text-white" 
                    : "bg-transparent text-black hover:bg-black/5"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Personal Info</span>
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`flex items-center space-x-3 px-4 py-3 font-heading uppercase tracking-widest text-sm font-bold transition-colors ${
                  activeTab === "addresses" 
                    ? "bg-black text-white" 
                    : "bg-transparent text-black hover:bg-black/5"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses</span>
              </button>
              
              <div className="pt-4 mt-4 border-t border-black/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 font-heading uppercase tracking-widest text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-grow">
            {activeTab === "orders" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-2xl font-heading font-bold uppercase tracking-widest text-black">
                  My Orders
                </h2>

                <div className="space-y-6">
                  {orders.length === 0 ? (
                    <div className="w-full py-12 text-center text-black/50 font-heading uppercase tracking-widest text-sm border border-black/20 border-dashed">
                      No orders yet.
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="border border-black flex flex-col md:flex-row">
                      {/* Order Details */}
                      <div className="p-6 flex-grow border-b md:border-b-0 md:border-r border-black/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                          <div>
                            <p className="text-xs font-heading font-bold uppercase tracking-widest text-black/50 mb-1">Order ID</p>
                            <p className="font-sans font-medium text-black">{order.id}</p>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <p className="text-xs font-heading font-bold uppercase tracking-widest text-black/50 mb-1">Date</p>
                            <p className="font-sans font-medium text-black">{order.created_at}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-heading font-bold uppercase tracking-widest text-black/50">Items</p>
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm font-sans">
                              <span className="font-medium text-black">{item.quantity}x {item.product_name} (Size: {item.variant_size})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="p-6 md:w-64 flex flex-col justify-between bg-black/5">
                        <div className="space-y-4 mb-6">
                          <div>
                            <p className="text-xs font-heading font-bold uppercase tracking-widest text-black/50 mb-1">Total</p>
                            <p className="font-sans font-bold text-black">${order.total_amount}</p>
                          </div>
                          <div>
                            <p className="text-xs font-heading font-bold uppercase tracking-widest text-black/50 mb-1">Status</p>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-800 w-fit uppercase tracking-widest">{order.payment_status || order.status}</span>
                              <span className="text-xs font-bold px-2 py-1 bg-black text-white w-fit uppercase tracking-widest">{order.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <button 
                            onClick={() => {
                              setTrackingOrderId(order.id);
                              setActiveTab("tracking");
                            }}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors font-heading font-bold uppercase tracking-widest text-[10px]"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Track Order</span>
                          </button>
                          <Link href={`/orders/${order.id}`} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white hover:bg-black/80 transition-colors font-heading font-bold uppercase tracking-widest text-[10px]">
                            <Eye className="w-3 h-3" />
                            <span>View Order</span>
                          </Link>
                          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-black/20 text-black/60 hover:border-black hover:text-black transition-colors font-heading font-bold uppercase tracking-widest text-[10px]">
                            <RefreshCw className="w-3 h-3" />
                            <span>Buy Again</span>
                          </button>
                          <button onClick={() => window.print()} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white hover:bg-black/90 transition-colors font-heading font-bold uppercase tracking-widest text-[10px]">
                            <Download className="w-3 h-3" />
                            <span>Invoice (PDF)</span>
                          </button>
                          {['PENDING', 'PAYMENT_PENDING', 'PROCESSING'].includes(order.status) && (
                            <button onClick={() => handleCancelOrder(order.id)} className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-600 transition-colors font-heading font-bold uppercase tracking-widest text-[10px]">
                              <Trash2 className="w-3 h-3" />
                              <span>Cancel Order</span>
                            </button>
                          )}
                        </div>
                      </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "tracking" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-2xl font-heading font-bold uppercase tracking-widest text-black">
                  Track Order
                </h2>
                
                <div className="mb-6">
                  <label className="text-xs font-heading font-bold tracking-widest uppercase text-black/70 mb-2 block">
                    Select Order
                  </label>
                  {orders.length === 0 ? (
                    <div className="text-sm font-sans text-black/50 py-3">No active orders to track.</div>
                  ) : (
                    <select 
                      value={trackingOrderId}
                      onChange={(e) => setTrackingOrderId(e.target.value)}
                      className="w-full md:w-1/2 border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                    >
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>{o.id} - {o.created_at}</option>
                      ))}
                    </select>
                  )}
                </div>

                {orders.length > 0 && trackingOrderId && trackingDetails && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-black/10 pb-8">
                      <div>
                        <p className="text-xs font-heading font-bold uppercase tracking-widest text-black/50 mb-1">Tracking Number</p>
                        <p className="font-sans font-bold text-black text-lg">FEDEX-998827736</p>
                        <p className="text-sm font-sans text-black/70 mt-1">FedEx Priority</p>
                      </div>
                      <div>
                        <p className="text-xs font-heading font-bold uppercase tracking-widest text-black/50 mb-1">Estimated Delivery</p>
                        <p className="font-sans font-bold text-black text-lg">Sept 20, 2026</p>
                        <p className="text-sm font-sans text-black/70 mt-1">by 8:00 PM</p>
                      </div>
                    </div>

                    <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-black/10">
                      {trackingTimeline.map((step, idx) => (
                        <div key={idx} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          {/* Icon */}
                          <div className={`flex items-center justify-center w-4 h-4 rounded-full border-2 border-white absolute left-[-22px] md:left-1/2 md:-translate-x-1/2 ${step.completed ? 'bg-black' : 'bg-black/20'}`}></div>
                          
                          {/* Content */}
                          <div className="w-full md:w-[calc(50%-2rem)]">
                            <p className={`font-heading font-bold uppercase tracking-widest text-sm ${step.completed ? 'text-black' : 'text-black/40'}`}>
                              {step.status}
                            </p>
                            {step.date && (
                              <p className="font-sans text-xs text-black/60 mt-1">{step.date}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-2xl font-heading font-bold uppercase tracking-widest text-black">
                  Personal Information
                </h2>

                <div className="flex items-center space-x-6">
                  <div className="relative w-24 h-24 rounded-full bg-secondary overflow-hidden group cursor-pointer border border-black/10">
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                    <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold uppercase tracking-wider text-black">Profile Photo</h3>
                    <p className="text-sm text-black/60 font-sans mt-1">JPG, GIF or PNG. Max size of 2MB.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-heading font-bold tracking-widest uppercase text-black/70">
                        First Name
                      </label>
                      <input
                        {...register("firstName")}
                        className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                        placeholder="John"
                      />
                      {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-heading font-bold tracking-widest uppercase text-black/70">
                        Last Name
                      </label>
                      <input
                        {...register("lastName")}
                        className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                        placeholder="Doe"
                      />
                      {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-heading font-bold tracking-widest uppercase text-black/70">
                      Email Address
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-heading font-bold tracking-widest uppercase text-black/70">
                        Phone Number
                      </label>
                      <input
                        {...register("phone")}
                        className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-heading font-bold tracking-widest uppercase text-black/70">
                        Date of Birth
                      </label>
                      <input
                        {...register("dob")}
                        type="date"
                        className="w-full border border-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black bg-white transition-all font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="mt-8 px-8 py-4 bg-black text-white font-heading font-bold uppercase tracking-widest text-sm hover:bg-black/80 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-heading font-bold uppercase tracking-widest text-black">
                    Saved Addresses
                  </h2>
                  <button onClick={() => setShowAddressForm(!showAddressForm)} className="flex items-center space-x-2 px-4 py-2 border border-black text-black font-heading font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>{showAddressForm ? 'Cancel' : 'Add New'}</span>
                  </button>
                </div>

                {showAddressForm && (
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
                      setShowAddressForm(false);
                    } catch (err) {
                      console.error('Failed to add address', err);
                      alert('Failed to add address');
                    }
                  }} className="border border-black p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input name="first_name" placeholder="First Name" required className="border border-black px-4 py-3" />
                      <input name="last_name" placeholder="Last Name" required className="border border-black px-4 py-3" />
                    </div>
                    <input name="address_line_1" placeholder="Street Address" required className="w-full border border-black px-4 py-3" />
                    <div className="grid grid-cols-2 gap-4">
                      <input name="city" placeholder="City" required className="border border-black px-4 py-3" />
                      <input name="state" placeholder="State" required className="border border-black px-4 py-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input name="postal_code" placeholder="Zipcode" required className="border border-black px-4 py-3" />
                      <input name="country" placeholder="Country" required className="border border-black px-4 py-3" />
                    </div>
                    <input name="phone" placeholder="Phone Number" className="w-full border border-black px-4 py-3" />
                    <button type="submit" className="px-6 py-3 bg-black text-white font-heading font-bold uppercase tracking-widest text-xs">Save Address</button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((address) => (
                    <div 
                      key={address.id} 
                      className={`border p-6 relative ${address.is_default === 1 ? "border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "border-black/20"}`}
                    >
                      {address.is_default === 1 && (
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-heading uppercase tracking-widest px-2 py-1">
                          Default
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 mb-4">
                        <MapPin className="w-5 h-5" />
                        <h3 className="font-heading font-bold uppercase tracking-wider">{address.first_name} {address.last_name}</h3>
                      </div>
                      
                      <div className="font-sans text-sm text-black/70 space-y-1 mb-6">
                        <p>{address.address_line_1}</p>
                        <p>{address.city}, {address.state} {address.postal_code}</p>
                      </div>

                      <div className="flex items-center space-x-4 border-t border-black/10 pt-4">
                        <button className="text-xs font-heading font-bold uppercase tracking-widest hover:underline flex items-center space-x-1">
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => deleteAddress(address.id)}
                          className="text-xs font-heading font-bold uppercase tracking-widest text-red-600 hover:underline flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                        {!address.is_default && (
                          <button 
                            onClick={() => setDefaultAddress(address.id)}
                            className="ml-auto text-[10px] font-heading font-bold uppercase tracking-widest border border-black/20 px-2 py-1 hover:border-black"
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default function AccountPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center font-heading font-bold uppercase tracking-widest text-black">Loading...</div>}>
      <AccountContent />
    </React.Suspense>
  );
}
