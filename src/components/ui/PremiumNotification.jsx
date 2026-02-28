import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const PremiumNotification = ({ message, type = 'success', onClose }) => {
    const variants = {
        initial: {
            opacity: 0,
            x: 100,
            scale: 0.9,
            rotateX: -15
        },
        animate: {
            opacity: 1,
            x: 0,
            scale: 1,
            rotateX: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 20,
                mass: 0.8
            }
        },
        exit: {
            opacity: 0,
            x: 100,
            scale: 0.9,
            transition: { duration: 0.2 }
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
            case 'error': return <XCircle className="w-6 h-6 text-rose-400" />;
            case 'warning': return <AlertCircle className="w-6 h-6 text-amber-400" />;
            default: return <Info className="w-6 h-6 text-blue-400" />;
        }
    };

    const getGradient = () => {
        switch (type) {
            case 'success': return 'from-emerald-900/40 to-emerald-900/20';
            case 'error': return 'from-rose-900/40 to-rose-900/20';
            case 'warning': return 'from-amber-900/40 to-amber-900/20';
            default: return 'from-blue-900/40 to-blue-900/20';
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return 'border-emerald-500/30';
            case 'error': return 'border-rose-500/30';
            case 'warning': return 'border-amber-500/30';
            default: return 'border-blue-500/30';
        }
    };

    return (
        <motion.div
            layout
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="pointer-events-auto relative w-full max-w-sm"
        >
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${getGradient()} blur-xl opacity-50 rounded-xl`} />

            {/* Main Card */}
            <div className={`
        relative overflow-hidden
        bg-slate-900/90 backdrop-blur-xl
        border ${getBorderColor()}
        rounded-xl shadow-2xl
        p-4 pr-10
        flex items-start gap-4
      `}>
                {/* Decorative Side Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${type === 'success' ? 'from-emerald-400 to-emerald-600' :
                        type === 'error' ? 'from-rose-400 to-rose-600' :
                            type === 'warning' ? 'from-amber-400 to-amber-600' :
                                'from-blue-400 to-blue-600'
                    }`} />

                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5 relative z-10">
                    {getIcon()}
                    {/* Subtle icon glow */}
                    <div className={`absolute inset-0 blur-md opacity-40 ${type === 'success' ? 'bg-emerald-400' :
                            type === 'error' ? 'bg-rose-400' :
                                type === 'warning' ? 'bg-amber-400' :
                                    'bg-blue-400'
                        }`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 z-10">
                    <h4 className="text-sm font-semibold text-white mb-0.5 tracking-wide uppercase text-[10px] opacity-70">
                        {type === 'success' ? 'Success' :
                            type === 'error' ? 'Error' :
                                type === 'warning' ? 'Warning' : 'Information'}
                    </h4>
                    <p className="text-sm font-medium text-slate-100 leading-snug">
                        {message}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors z-20"
                >
                    <X size={14} />
                </button>

                {/* Shine Effect Animation */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
                />
            </div>
        </motion.div>
    );
};

export default PremiumNotification;
