import React from "react";
import { contactInfo } from "@/data/info";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Legacy XI",
  description: "Get in touch with Legacy XI support.",
};

export default function ContactPage() {
  return (
    <div className="w-full flex-grow bg-white text-black py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-3xl flex flex-col space-y-12 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-widest text-center mb-4">
          {contactInfo.title}
        </h1>
        
        <div className="flex flex-col space-y-4">
          <div className="font-heading uppercase font-bold text-sm md:text-base text-black space-y-2 leading-relaxed text-center md:text-left">
            <p>{contactInfo.message}</p>
          </div>
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
          <div className="flex flex-col space-y-4">
            <h2 className="font-heading uppercase tracking-widest font-bold text-base md:text-lg text-black">EMAIL:</h2>
            <a href={`mailto:${contactInfo.email}`} className="font-heading uppercase font-bold text-sm md:text-base text-black hover:underline underline-offset-4 leading-relaxed">
              {contactInfo.email}
            </a>
          </div>
          
          <div className="flex flex-col space-y-4">
            <h2 className="font-heading uppercase tracking-widest font-bold text-base md:text-lg text-black">PHONE:</h2>
            <a href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`} className="font-heading uppercase font-bold text-sm md:text-base text-black hover:underline underline-offset-4 leading-relaxed">
              {contactInfo.phone}
            </a>
          </div>
          
          <div className="flex flex-col space-y-4">
            <h2 className="font-heading uppercase tracking-widest font-bold text-base md:text-lg text-black">BUSINESS HOURS:</h2>
            <p className="font-heading uppercase font-bold text-sm md:text-base text-black leading-relaxed">{contactInfo.hours}</p>
          </div>
          
          <div className="flex flex-col space-y-4">
            <h2 className="font-heading uppercase tracking-widest font-bold text-base md:text-lg text-black">HEADQUARTERS:</h2>
            <p className="font-heading uppercase font-bold text-sm md:text-base text-black leading-relaxed">{contactInfo.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
