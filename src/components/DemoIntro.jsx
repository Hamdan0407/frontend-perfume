import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export default function DemoIntro({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);
    const [stage, setStage] = useState(0); // 0: init, 1: text-in, 2: fade-out

    useEffect(() => {
        // Stage 1: Text In
        const timer1 = setTimeout(() => setStage(1), 100);
        // Stage 2: Fade Out start
        const timer2 = setTimeout(() => setStage(2), 2000);
        // Complete
        const timer3 = setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
        }, 2500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950 transition-opacity duration-700 ${stage === 2 ? 'opacity-0' : 'opacity-100'
                }`}
        >
            <div className={`flex flex-col items-center gap-4 transition-all duration-1000 transform ${stage >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90'
                }`}>
                <div className="relative">
                    <Sparkles className="w-16 h-16 text-amber-500 animate-pulse" />
                    <div className="absolute inset-0 bg-amber-500 blur-xl opacity-30 animate-pulse"></div>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tighter">
                    Parfum<span className="text-amber-500">é</span>
                </h1>
                <p className="text-slate-400 tracking-widest text-sm uppercase">Luxury Fragrances</p>
            </div>
        </div>
    );
}
