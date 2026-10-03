import React from "react";
import { Circle } from "lucide-react";

const MESSAGES = [
  "10,000+ ORDERS — YOUR SUPPORT KEEPS US GOING",
  "PREMIUM FOOTBALL JERSEYS TRUSTED BY FANS ACROSS INDIA",
  "FAST DELIVERY & TOP QUALITY — SHOP YOUR FAVOURITE TEAM NOW",
  "LIMITED STOCK AVAILABLE — GRAB YOURS BEFORE IT'S GONE!",
];

export function BenefitsBar() {
  // Duplicate messages to ensure seamless infinite scroll
  const marqueeItems = [...MESSAGES, ...MESSAGES, ...MESSAGES, ...MESSAGES];

  return (
    <div className="bg-black border-y border-white/20 py-2.5 overflow-hidden flex w-full">
      <div className="flex w-max animate-marquee motion-reduce:animate-none motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:py-2">
        {marqueeItems.map((message, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 md:space-x-8 px-4 md:px-8 motion-reduce:mb-2 motion-reduce:px-2"
          >
            <span className="font-heading uppercase tracking-widest text-xs md:text-sm text-white whitespace-nowrap">
              {message}
            </span>
            <Circle className="w-1.5 h-1.5 fill-white text-white motion-reduce:hidden" />
          </div>
        ))}
      </div>
    </div>
  );
}
