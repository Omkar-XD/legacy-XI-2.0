"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api-client";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const router = useRouter();
  
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/api/auth/register', { 
        email: data.email, 
        password: data.password 
      });
      toast.success("Registration successful! Please login.");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 font-sans text-sm border border-red-200">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="fullName" className="block font-heading uppercase tracking-widest text-sm text-black">
          Full Name
        </label>
        <input
          {...register("fullName")}
          type="text"
          id="fullName"
          className="w-full border border-black/20 p-3 font-sans focus:outline-none focus:border-black transition-colors bg-white text-black"
          disabled={isLoading}
        />
        {errors.fullName && (
          <p className="text-red-500 text-xs font-sans mt-1">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block font-heading uppercase tracking-widest text-sm text-black">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          id="email"
          className="w-full border border-black/20 p-3 font-sans focus:outline-none focus:border-black transition-colors bg-white text-black"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-red-500 text-xs font-sans mt-1">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="password" className="block font-heading uppercase tracking-widest text-sm text-black">
          Password
        </label>
        <input
          {...register("password")}
          type="password"
          id="password"
          className="w-full border border-black/20 p-3 font-sans focus:outline-none focus:border-black transition-colors bg-white text-black"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-red-500 text-xs font-sans mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block font-heading uppercase tracking-widest text-sm text-black">
          Confirm Password
        </label>
        <input
          {...register("confirmPassword")}
          type="password"
          id="confirmPassword"
          className="w-full border border-black/20 p-3 font-sans focus:outline-none focus:border-black transition-colors bg-white text-black"
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs font-sans mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center bg-black text-white py-4 font-heading uppercase tracking-widest text-sm hover:bg-black/80 transition-colors mt-2 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
      </button>

      <div className="mt-8 text-center border-t border-black/10 pt-8">
        <p className="font-sans text-sm text-black/60 mb-4">
          Already have an account?
        </p>
        <Link
          href="/login"
          className="inline-block border border-black text-black px-8 py-3 font-heading uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors"
        >
          Login
        </Link>
      </div>
    </form>
  );
}
