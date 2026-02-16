import { useState, useEffect, useRef } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import axios from 'axios';

// Adaptive timing: frequent initially, then slower for engaged users
const INITIAL_INTERVAL_MIN = 8000;  // 8 seconds
const INITIAL_INTERVAL_MAX = 10000; // 10 seconds
const LATER_INTERVAL = 300000;      // 5 minutes
const TRANSITION_TIME = 900000;     // 15 minutes

// Indian names for realistic notifications
const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan',
    'Ananya', 'Diya', 'Pari', 'Aadhya', 'Sara', 'Anvi', 'Aaradhya', 'Navya', 'Saanvi', 'Prisha',
    'Rajesh', 'Amit', 'Rahul', 'Rohit', 'Priya', 'Pooja', 'Sneha', 'Kavya', 'Neha', 'Ritu'
];

const lastNames = [
    'Kumar', 'Singh', 'Sharma', 'Patel', 'Gupta', 'Reddy', 'Nair', 'Iyer', 'Rao', 'Mehta',
    'Desai', 'Joshi', 'Shah', 'Agarwal', 'Verma', 'Mishra', 'Pandey', 'Tiwari', 'Yadav', 'Chauhan'
];

const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 
    'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Patna', 'Vadodara', 'Surat'
];

export default function PurchaseNotification() {
    const [notifications, setNotifications] = useState([]);
    const [sessionStartTime] = useState(Date.now());
    const [products, setProducts] = useState([]);
    const usedIndicesRef = useRef([]);

    // Fetch real products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/api/products');
                if (response.data && response.data.length > 0) {
                    setProducts(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch products for notifications:', error);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        // Don't show notifications if no products exist
        if (products.length === 0) return;

        let notificationId = 0;
        let currentInterval = null;

        const addNotification = () => {
            // Get available product indices
            let availableIndices = [];
            for (let i = 0; i < products.length; i++) {
                if (!usedIndicesRef.current.includes(i)) {
                    availableIndices.push(i);
                }
            }

            // If all products used, reset the pool
            if (availableIndices.length === 0) {
                usedIndicesRef.current = [];
                availableIndices = Array.from({ length: products.length }, (_, i) => i);
            }

            // Pick a random unused product
            const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            const product = products[randomIndex];
            const id = notificationId++;

            // Generate random name and city
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const city = cities[Math.floor(Math.random() * cities.length)];

            // Mark this index as used
            usedIndicesRef.current.push(randomIndex);

            setNotifications(prev => [...prev, { 
                id, 
                name: `${firstName} ${lastName}`,
                city,
                brand: product.brand,
                product: product.name,
                image: product.imageUrl || product.images?.[0] || 'https://via.placeholder.com/100'
            }]);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 5000);
        };

        const scheduleNextNotification = () => {
            const timeOnSite = Date.now() - sessionStartTime;

            // Adaptive timing based on session duration
            let delay;
            if (timeOnSite < TRANSITION_TIME) {
                // First 15 minutes: frequent notifications (8-10 seconds)
                delay = Math.random() * (INITIAL_INTERVAL_MAX - INITIAL_INTERVAL_MIN) + INITIAL_INTERVAL_MIN;
            } else {
                // After 15 minutes: slower notifications (5 minutes)
                delay = LATER_INTERVAL;
            }

            currentInterval = setTimeout(() => {
                addNotification();
                scheduleNextNotification(); // Schedule the next one
            }, delay);
        };

        // Show first notification after 3 seconds
        const initialTimeout = setTimeout(() => {
            addNotification();
            scheduleNextNotification(); // Start the adaptive cycle
        }, 3000);

        return () => {
            clearTimeout(initialTimeout);
            if (currentInterval) clearTimeout(currentInterval);
        };
    }, [sessionStartTime, products]);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto z-50 space-y-2 sm:space-y-3">
            {notifications.map((notification, index) => (
                <div
                    key={notification.id}
                    className="animate-slide-in-left"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 p-3 sm:p-4 max-w-sm flex items-start gap-2 sm:gap-3 relative">
                        {/* Close button */}
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>

                        {/* Shopping bag icon */}
                        <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-full p-1.5 sm:p-2">
                            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-foreground">
                                {notification.name}
                                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal ml-1">
                                    from {notification.city}
                                </span>
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                                purchased <span className="font-medium text-foreground">{notification.brand}</span>
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Just now
                            </p>
                        </div>

                        {/* Product image */}
                        <div className="flex-shrink-0">
                            <img
                                src={notification.image}
                                alt={notification.product}
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-md object-cover border border-gray-200 dark:border-slate-600"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/100/cccccc/666666?text=Product';
                                }}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
