import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import PremiumNotification from '../components/ui/PremiumNotification';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'success', duration = 4000) => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev, { id, message, type }]);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Public API
    const showSuccess = useCallback((message) => addNotification(message, 'success'), [addNotification]);
    const showError = useCallback((message) => addNotification(message, 'error'), [addNotification]);
    const showInfo = useCallback((message) => addNotification(message, 'info'), [addNotification]);
    const showWarning = useCallback((message) => addNotification(message, 'warning'), [addNotification]);

    return (
        <ToastContext.Provider value={{ success: showSuccess, error: showError, info: showInfo, warn: showWarning, warning: showWarning }}>
            {children}
            <div
                className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
                style={{ perspective: '1000px' }}
            >
                <AnimatePresence mode="popLayout">
                    {notifications.map(notification => (
                        <PremiumNotification
                            key={notification.id}
                            message={notification.message}
                            type={notification.type}
                            onClose={() => removeNotification(notification.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
