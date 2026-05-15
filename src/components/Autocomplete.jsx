import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';

const Autocomplete = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  suggestions = [], 
  loading = false,
  onSearch = () => {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    onSearch(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (item) => {
    onChange(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') setIsOpen(true);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        } else if (suggestions.length > 0) {
          handleSelect(suggestions[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="lead-form-group" ref={containerRef} style={{ position: 'relative' }}>
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="lead-form-input"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (suggestions.length > 0 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 100,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              marginTop: '4px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {loading ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                Searching...
              </div>
            ) : (
              suggestions.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    background: highlightedIndex === index ? '#f3f4f6' : 'transparent',
                    color: highlightedIndex === index ? '#1a1a1a' : '#444',
                    transition: 'background 0.1s'
                  }}
                >
                  {item}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Autocomplete;
