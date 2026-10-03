"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ProductAccordion({ description }: { description?: string }) {
  return (
    <Accordion className="w-full mt-4">
      <AccordionItem value="shipping" className="border-b border-black">
        <AccordionTrigger className="font-heading font-bold uppercase tracking-wide text-sm md:text-base hover:no-underline hover:text-black/70 py-5 text-black [&>svg]:text-black">
          SHIPPING
        </AccordionTrigger>
        <AccordionContent className="text-black/80 leading-relaxed font-sans text-sm pb-5">
          <ul className="list-disc pl-5 space-y-2">
            <li>Standard Shipping (3-5 business days)</li>
            <li>Express Shipping (1-2 business days)</li>
            <li>Free worldwide shipping on orders over $150</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="returns" className="border-b border-black">
        <AccordionTrigger className="font-heading font-bold uppercase tracking-wide text-sm md:text-base hover:no-underline hover:text-black/70 py-5 text-black [&>svg]:text-black">
          RETURN POLICY
        </AccordionTrigger>
        <AccordionContent className="text-black/80 leading-relaxed font-sans text-sm pb-5">
          We accept returns within 30 days of delivery. Items must be unworn, unwashed, and have original tags attached. Customized kits cannot be returned unless defective.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="sizing" className="border-b border-black">
        <AccordionTrigger className="font-heading font-bold uppercase tracking-wide text-sm md:text-base hover:no-underline hover:text-black/70 py-5 text-black [&>svg]:text-black">
          SIZING GUIDE
        </AccordionTrigger>
        <AccordionContent className="text-black/70 leading-relaxed font-sans text-sm pb-4">
          Our authentic player-version kits feature an athletic, slim fit. If you prefer a looser fit, we recommend ordering one size up from your usual size. Check our detailed size chart for exact measurements.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
