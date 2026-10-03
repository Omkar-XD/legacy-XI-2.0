import React, { Suspense } from "react";
import { ShopClient } from "./ShopClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop | Legacy XI",
  description: "Browse premium football jerseys.",
};

export default function ShopPage() {
  return (
    <div className="w-full bg-white min-h-screen flex flex-col">
      <Suspense fallback={
        <div className="w-full flex-grow flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <ShopClient />
      </Suspense>
    </div>
  );
}
