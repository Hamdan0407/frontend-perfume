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
            className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-700 ${stage === 2 ? 'opacity-0' : 'opacity-100'
                }`}
        >
            <div className={`flex flex-col items-center gap-4 transition-all duration-1000 transform ${stage >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90'
                }`}>
                <div className="w-40 h-40 bg-amber-50 rounded-full flex items-center justify-center border-2 border-amber-200 shadow-xl">
                    <Sparkles className="w-20 h-20 text-amber-500 animate-pulse" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tighter text-gray-900 mt-4">MUWAS</h1>
                <p className="text-amber-600 font-bold tracking-widest text-sm uppercase">Fragrances & Attars</p>
            </div>
        </div>
    );
}
