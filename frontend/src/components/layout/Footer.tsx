import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          
          {/* Newsletter Section */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-heading uppercase tracking-widest text-lg">Join the Legacy</h3>
            <p className="text-white/60 text-sm max-w-sm">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <div className="flex w-full max-w-sm items-center border-b border-white/30 pb-2 pt-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/40 focus:ring-0"
              />
              <button className="text-white hover:text-white/70 transition-colors ml-2" aria-label="Subscribe">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Centered Logo Area */}
          <div className="flex flex-col items-center justify-center text-center">
            <Link href="/" className="mb-4 inline-block bg-white rounded-full px-6 py-3 shadow-lg hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="Legacy XI" className="h-10 md:h-14 w-auto object-contain" />
            </Link>
            <p className="text-white/60 text-xs tracking-widest uppercase">
              Premium Football Jerseys
            </p>
          </div>

          {/* Policy Links */}
          <div className="flex flex-col md:items-end space-y-4">
            <h3 className="font-heading uppercase tracking-widest text-lg">Support</h3>
            <nav className="flex flex-col md:items-end space-y-3">
              <Link href="/contact" className="text-white/60 hover:text-white text-sm transition-colors uppercase tracking-wider font-heading">Contact Us</Link>
              <Link href="/tracking" className="text-white/60 hover:text-white text-sm transition-colors uppercase tracking-wider font-heading">Tracking & Updates</Link>
              <Link href="/returns" className="text-white/60 hover:text-white text-sm transition-colors uppercase tracking-wider font-heading">Return & Exchange</Link>
              <Link href="/faq" className="text-white/60 hover:text-white text-sm transition-colors uppercase tracking-wider font-heading">FAQ</Link>
            </nav>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-white/40 uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} Legacy XI. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
