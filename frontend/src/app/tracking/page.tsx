import React from "react";
import { trackingInfo } from "@/data/info";
import { Metadata } from "next";
import { TrackingForm } from "./TrackingForm";

export const metadata: Metadata = {
  title: "Tracking & Updates | Legacy XI",
  description: "Information regarding shipping and order tracking at Legacy XI.",
};

export default function TrackingPage() {
  return (
    <div className="w-full flex-grow bg-white text-black py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-3xl flex flex-col space-y-12 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-widest text-center mb-4">
          {trackingInfo.title}
        </h1>
        
        <TrackingForm />

        <div className="space-y-12">
          {trackingInfo.sections.map((section, index) => (
            <div key={index} className="flex flex-col space-y-4">
              <h2 className="font-heading uppercase tracking-widest font-bold text-base md:text-lg text-black">
                {section.title}:
              </h2>
              <div className="font-heading uppercase font-bold text-sm md:text-base text-black space-y-2 leading-relaxed">
                <p>{section.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
