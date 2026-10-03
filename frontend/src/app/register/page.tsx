import React from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Legacy XI",
  description: "Create your Legacy XI account for faster checkout and exclusive offers.",
};

export default function RegisterPage() {
  return (
    <div className="w-full bg-white flex-grow flex items-center justify-center py-16 md:py-24 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Legacy XI" className="h-12 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-xl md:text-2xl font-heading font-bold uppercase tracking-[0.15em] text-black mb-2">
            Register
          </h1>
          <p className="text-black/60 font-sans">
            Create your Legacy XI account
          </p>
        </div>
        
        <RegisterForm />
      </div>
    </div>
  );
}
