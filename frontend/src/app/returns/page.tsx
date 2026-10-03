import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return Policy | Legacy XI",
  description: "Read our return and exchange policies.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="w-full flex-grow bg-white text-black py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-3xl flex flex-col space-y-12 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-widest text-center mb-4">
          RETURN & EXCHANGE POLICY
        </h1>
        
        <div className="flex flex-col space-y-4">
          <h2 className="font-heading uppercase tracking-widest font-bold text-base md:text-lg text-black">
            RETURN/EXCHANGE:
          </h2>
          <div className="font-heading uppercase font-bold text-sm md:text-base text-black space-y-2 leading-relaxed">
            <p>WE ACCEPT RETURNS OR EXCHANGES ONLY IN CASES OF DAMAGED OR WRONG PRODUCTS.WE DO NOT OFFER EXCHANGES FOR SIZE ISSUES.</p>
            <p>PLEASE CHECK THE SIZE CHART CAREFULLY BEFORE PURCHASING.</p>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <h2 className="font-heading uppercase tracking-widest font-bold text-base md:text-lg text-black">
            CLAIMS:
          </h2>
          <div className="font-heading uppercase font-bold text-sm md:text-base text-black space-y-4 leading-relaxed">
            <p>• AN UNBOXING VIDEO IS MANDATORY (FROM START TO END) TO CLAIM ANY ISSUE RELATED TO DAMAGE, MISSING ITEMS, OR DEFECTS.</p>
            <p>• THE UNBOXING VIDEO MUST CLEARLY SHOW THE SEALED PACKAGE, SEAL CUTTING, AND THE PRODUCT CONDITION TO VALIDATE ANY CLAIM.</p>
            <p>• CLAIMS WITHOUT A COMPLETE AND CONTINUOUS UNBOXING VIDEO (FROM SEAL CUT TO FULLY DISPLAYING THE PRODUCT) WILL NOT BE ACCEPTED.</p>
            <p>• REPLACEMENTS AND RETURNS ARE ACCEPTED ONLY WITHIN 2 DAYS OF RECEIVING THE PRODUCT.</p>
          </div>
        </div>

        <div className="flex flex-col space-y-4 pt-4">
          <h2 className="font-heading uppercase tracking-widest font-bold text-base md:text-lg text-black">
            CONTACT US ON WHATSAPP: 9645921914
          </h2>
        </div>
      </div>
    </div>
  );
}
