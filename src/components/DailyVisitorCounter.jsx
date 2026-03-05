import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

/**
 * Daily Visitor Counter — shows a random number between 50–80
 * that stays consistent for the entire day (resets at midnight).
 * Uses localStorage so the number doesn't change on refresh.
 */
function getDailyVisitorCount() {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const storageKey = 'muwas_daily_visitors';

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (stored && stored.date === today) {
      return stored.count;
    }
  } catch {
    // corrupted data — regenerate
  }

  // Generate a new count for today (50–80 inclusive)
  const count = Math.floor(Math.random() * 31) + 50;
  localStorage.setItem(storageKey, JSON.stringify({ date: today, count }));
  return count;
}

export default function DailyVisitorCounter() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    setCount(getDailyVisitorCount());
  }, []);

  if (count === null) return null;

  return (
    <div className="flex items-center justify-center py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
        <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-primary font-semibold">{count}</span>
        </span>
        <span>people visited today</span>
      </div>
    </div>
  );
}
