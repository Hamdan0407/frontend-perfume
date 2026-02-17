import React from 'react';
import { Truck, Gift, Globe } from 'lucide-react';

export default function AnnouncementBar() {
    return (
        <div className="bg-zinc-900 text-white py-2 overflow-hidden relative z-50">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-16 font-medium text-xs sm:text-sm tracking-wide">
                <span className="flex items-center gap-2">
                    <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                    Free Shipping on orders above ₹899
                </span>
                <span className="flex items-center gap-2">
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                    We offer pan-India delivery
                </span>
                <span className="flex items-center gap-2">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                    International Shipping Coming Soon
                </span>

                {/* Duplicate Content for seamless loop */}
                <span className="flex items-center gap-2">
                    <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                    Free Shipping on orders above ₹899
                </span>
                <span className="flex items-center gap-2">
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                    We offer pan-India delivery
                </span>
                <span className="flex items-center gap-2">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                    International Shipping Coming Soon
                </span>

                {/* Duplicate Content for seamless loop (Extra buffer for wide screens) */}
                <span className="flex items-center gap-2">
                    <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                    Free Shipping on orders above ₹899
                </span>
                <span className="flex items-center gap-2">
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                    We offer pan-India delivery
                </span>
                <span className="flex items-center gap-2">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                    International Shipping Coming Soon
                </span>
            </div>
        </div>
    );
}
