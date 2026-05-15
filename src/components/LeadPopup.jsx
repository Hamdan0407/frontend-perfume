import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';
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

  // Autocomplete states
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    // Check if already shown in this session
    const hasShown = sessionStorage.getItem('lead_popup_shown');
    
    if (!hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000); // 2 seconds delay

      // Pre-fetch countries
      fetchCountries();

      return () => clearTimeout(timer);
    }
  }, []);

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const res = await axios.get('https://restcountries.com/v3.1/all?fields=name');
      const countryNames = res.data.map(c => c.name.common).sort();
      setCountries(countryNames);
      setFilteredCountries(countryNames.slice(0, 10));
    } catch (err) {
      console.error('Error fetching countries:', err);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchCities = async (countryName) => {
    if (!countryName) return;
    try {
      setLoadingCities(true);
      const res = await axios.post('https://countriesnow.space/api/v0.1/countries/cities', {
        country: countryName
      });
      const cityNames = res.data.data.sort();
      setCities(cityNames);
      setFilteredCities(cityNames.slice(0, 10));
    } catch (err) {
      console.error('Error fetching cities:', err);
      setCities([]);
      setFilteredCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // Country Search with Debounce
  useEffect(() => {
    if (!formData.country) {
      setFilteredCountries(countries.slice(0, 10));
      return;
    }
    const timer = setTimeout(() => {
      const filtered = countries.filter(c => 
        c.toLowerCase().includes(formData.country.toLowerCase())
      );
      setFilteredCountries(filtered.slice(0, 10));
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.country, countries]);

  // City Search with Debounce
  useEffect(() => {
    if (!formData.city) {
      setFilteredCities(cities.slice(0, 10));
      return;
    }
    const timer = setTimeout(() => {
      const filtered = cities.filter(c => 
        c.toLowerCase().includes(formData.city.toLowerCase())
      );
      setFilteredCities(filtered.slice(0, 10));
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.city, cities]);

  // Fetch cities when country changes
  useEffect(() => {
    const isExactMatch = countries.find(c => c.toLowerCase() === formData.country.toLowerCase());
    if (isExactMatch) {
      fetchCities(isExactMatch);
    }
  }, [formData.country, countries]);

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
            <Autocomplete
              label="Country"
              placeholder="India"
              value={formData.country}
              onChange={(val) => setFormData({ ...formData, country: val, city: '' })}
              suggestions={filteredCountries}
              loading={loadingCountries}
            />
            <Autocomplete
              label="City"
              placeholder="Mumbai"
              value={formData.city}
              onChange={(val) => setFormData({ ...formData, city: val })}
              suggestions={filteredCities}
              loading={loadingCities}
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
