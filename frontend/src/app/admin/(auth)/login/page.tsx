"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function AdminLoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("admin@legacyxi.com");
  const [password, setPassword] = useState("admin123");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Please enter both email and password.");
      }

      const response = await apiClient.post<{ message: string, user: any }>('/api/auth/login', { email, password });
      
      if (response.user.role !== 'admin') {
        throw new Error("Unauthorized. Admin access only.");
      }

      console.log("Real API POST /api/auth/login success");
      
      // Note: We do NOT store auth tokens in localStorage per security requirements.
      // The backend will issue an HttpOnly secure cookie for the session.
      
      // Redirect to dashboard
      router.push("/admin/dashboard");
      
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Legacy XI" className="h-12 w-auto object-contain mx-auto mb-4" />
          <p className="font-heading font-bold uppercase tracking-widest text-xs text-black/60 mb-2">
            Administration Portal
          </p>
          <p className="font-heading font-bold uppercase tracking-widest text-[10px] text-black/40 bg-black/5 p-2 border border-black/10 inline-block">
            Note: Admin credentials are fixed. No registration required.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-600 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-heading font-bold uppercase tracking-widest text-xs">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-heading text-xs font-bold uppercase tracking-widest text-black/70 block">
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@legacyxi.com"
              disabled={isLoading}
              className="w-full border border-black/20 px-4 py-3 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black transition-colors disabled:opacity-50 disabled:bg-black/5"
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-heading text-xs font-bold uppercase tracking-widest text-black/70 block">
              Password
            </label>
            <div className="relative">
              <input 
                type="password"
                className="hidden" // Prevents autofill anomalies in some browsers when dynamically switching types
              />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full border border-black/20 pl-4 pr-12 py-3 font-heading font-bold uppercase tracking-widest text-xs focus:outline-none focus:border-black transition-colors disabled:opacity-50 disabled:bg-black/5"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition-colors focus:outline-none disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="peer appearance-none w-4 h-4 border border-black/30 checked:bg-black checked:border-black transition-colors focus:outline-none cursor-pointer disabled:opacity-50"
                />
                <svg 
                  className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-heading font-bold uppercase tracking-widest text-xs text-black/70 group-hover:text-black transition-colors">
                Remember me
              </span>
            </label>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white font-heading font-bold uppercase tracking-widest text-sm py-4 hover:bg-black/90 transition-colors focus:outline-none disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
