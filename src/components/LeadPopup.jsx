import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../api/axios';
import toast from '../utils/toast';
import '../styles/LeadPopup.css';

const LeadPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: ''
  });

  useEffect(() => {
    // Check if already shown in this session
    const hasShown = sessionStorage.getItem('lead_popup_shown');
    
    if (!hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000); // 2 seconds delay

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('lead_popup_shown', 'true');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/leads/subscribe', formData);
      toast.success('Thank you for subscribing!');
      handleClose();
    } catch (error) {
      console.error('Lead submission error:', error);
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="lead-popup-overlay">
      <div className="lead-popup-content">
        <button className="lead-popup-close" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="lead-popup-header">
          <h2>Join the MUWAS Elite</h2>
          <p>Subscribe to receive exclusive offers, early access to new collections, and personalized fragrance recommendations.</p>
        </div>

        <form className="lead-popup-form" onSubmit={handleSubmit}>
          <div className="lead-form-group">
            <label>First Name</label>
            <input
              type="text"
              className="lead-form-input"
              placeholder="Enter your name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="lead-form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="lead-form-input"
              placeholder="email@example.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="lead-form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              className="lead-form-input"
              placeholder="+91 XXXXX XXXXX"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="lead-form-group">
              <label>Country</label>
              <input
                type="text"
                className="lead-form-input"
                placeholder="India"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="lead-form-group">
              <label>City</label>
              <input
                type="text"
                className="lead-form-input"
                placeholder="Mumbai"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="lead-submit-btn" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 className="animate-spin" size={18} />
                Submitting...
              </span>
            ) : (
              'Get Exclusive Access'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeadPopup;
