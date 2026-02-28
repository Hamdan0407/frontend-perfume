import { useEffect, useState } from 'react';
import { Check, Sparkles, User } from 'lucide-react';

export default function LoginSuccessAnimation({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Wait for exit animation
        }, 3000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-start justify-center px-4 py-6 sm:p-6 pointer-events-none">
            <div
                className="bg-slate-900/90 backdrop-blur-md border border-amber-500/30 text-white rounded-2xl shadow-2xl shadow-amber-900/20 p-6 flex items-center gap-5 max-w-md w-full animate-in slide-in-from-top-10 fade-in duration-700 pointer-events-auto"
            >
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                        <Check className="w-7 h-7 text-white" strokeWidth={3} />
                    </div>
                    <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-300 animate-pulse" />
                </div>

                <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-lg leading-none tracking-tight text-white">
                        Welcome Back!
                    </h3>
                    <p className="text-slate-300 text-sm">
                        Accessing your premium dashboard...
                    </p>
                </div>

                <div className="h-10 w-1 bg-amber-500/20 rounded-full"></div>

                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <User className="w-5 h-5 text-slate-400" />
                </div>
            </div>
        </div>
    );
}
