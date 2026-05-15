import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Country, City } from 'country-state-city';
import api from '../api/axios';
import toast from '../utils/toast';
import Autocomplete from './Autocomplete';
import '../styles/LeadPopup.css';

const LeadPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: ''
  });

  // Selected country object (to get ISO code)
  const [selectedCountryObj, setSelectedCountryObj] = useState(null);

  // Lists for autocomplete
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  useEffect(() => {
    const hasShown = sessionStorage.getItem('lead_popup_shown');
    if (!hasShown) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Get all countries once
  const allCountries = useMemo(() => Country.getAllCountries(), []);

  // Filtered countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return allCountries.slice(0, 10).map(c => c.name);
    return allCountries
      .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
      .slice(0, 10)
      .map(c => c.name);
  }, [countrySearch, allCountries]);

  // Cities for the selected country
  const countryCities = useMemo(() => {
    if (!selectedCountryObj) return [];
    return City.getCitiesOfCountry(selectedCountryObj.isoCode);
  }, [selectedCountryObj]);

  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch) return countryCities.slice(0, 10).map(c => c.name);
    return countryCities
      .filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
      .slice(0, 10)
      .map(c => c.name);
  }, [citySearch, countryCities]);

  // Handle country selection
  const handleCountryChange = (name) => {
    setCountrySearch(name);
    setFormData(prev => ({ ...prev, country: name, city: '' }));
    setCitySearch('');
    
    const found = allCountries.find(c => c.name.toLowerCase() === name.toLowerCase());
    setSelectedCountryObj(found || null);
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('lead_popup_shown', 'true');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/leads/subscribe', formData);
      toast.success('Thank you for subscribing!');
      handleClose();
    } catch (error) {
      console.error('Lead submission error:', error);
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
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
          <p>Subscribe to receive exclusive offers, early access to new collections, and members-only deals.</p>
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
            <Autocomplete
              label="Country"
              placeholder="India"
              value={formData.country}
              onChange={handleCountryChange}
              onSearch={setCountrySearch}
              suggestions={filteredCountries}
            />
            <Autocomplete
              label="City"
              placeholder="Mumbai"
              value={formData.city}
              onChange={(val) => {
                setFormData({ ...formData, city: val });
                setCitySearch(val);
              }}
              onSearch={setCitySearch}
              suggestions={filteredCities}
              disabled={!selectedCountryObj}
            />
          </div>

          <button type="submit" className="lead-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
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
