import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { SORT_OPTIONS } from '../constants/sortOptions';
import { cn } from '../lib/utils';

export default function ProductSort({ currentSort, onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // Find label of active option
  const activeOption = SORT_OPTIONS.find(opt => opt.value === currentSort) || SORT_OPTIONS[0];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div 
      className="relative z-40" 
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Label and button block */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:inline-block">
          Sort By
        </span>
        
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-300",
            "border border-slate-200 hover:border-slate-800 rounded-full bg-background min-w-[190px] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2",
            isOpen && "border-slate-800 ring-2 ring-slate-900 ring-offset-2"
          )}
        >
          <span className="truncate">{activeOption.label}</span>
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-slate-500 transition-transform duration-300 shrink-0",
              isOpen && "transform rotate-180 text-slate-900"
            )} 
          />
        </button>
      </div>

      {/* Dropdown Menu with premium glassmorphism / styling */}
      {isOpen && (
        <ul
          role="listbox"
          aria-label="Sort products options"
          className={cn(
            "absolute right-0 mt-2 min-w-[210px] bg-background border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 overflow-hidden",
            "origin-top-right transition-all duration-300 ease-out transform scale-100 opacity-100",
            "backdrop-blur-md bg-white/95"
          )}
        >
          {SORT_OPTIONS.map((option) => {
            const isActive = option.value === currentSort;
            return (
              <li key={option.value} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    onSortChange(option.value);
                    setIsOpen(false);
                    buttonRef.current?.focus();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors duration-200 focus:outline-none",
                    isActive 
                      ? "bg-slate-950 text-white font-semibold" 
                      : "text-slate-700 hover:bg-slate-50 focus:bg-slate-50"
                  )}
                >
                  <span>{option.label}</span>
                  {isActive && <Check className="h-4 w-4 text-white ml-2 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
