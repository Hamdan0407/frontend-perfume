import React, { useState } from 'react';
import { Save, Lock, Bell, Shield, Eye } from 'lucide-react';
import '../styles/AdminSettings.css';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    storeName: 'Perfume Shop',
    email: 'admin@perfumeshop.com',
    phone: '+1 234-567-8900',
    address: '123 Fashion Street, NY',
    currency: 'USD',
    taxRate: '10',
    freeShippingThreshold: '100',
    notificationsEmail: true,
    notificationsSMS: false,
    twoFactorAuth: true,
    sessionTimeout: '30'
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {saved && <div className="alert-success">Settings saved successfully!</div>}

      <div className="settings-sections">
        {/* Business Settings */}
        <div className="settings-section">
          <h3><Shield size={18} /> Business Settings</h3>
          <div className="form-group">
            <label>Store Name</label>
            <input
              type="text"
              name="storeName"
              value={settings.storeName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={settings.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={settings.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Business Address</label>
            <input
              type="text"
              name="address"
              value={settings.address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Payment & Tax */}
        <div className="settings-section">
          <h3><Lock size={18} /> Payment & Tax</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Currency</label>
              <select name="currency" value={settings.currency} onChange={handleChange}>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tax Rate (%)</label>
              <input
                type="number"
                name="taxRate"
                value={settings.taxRate}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Free Shipping Threshold ($)</label>
            <input
              type="number"
              name="freeShippingThreshold"
              value={settings.freeShippingThreshold}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <h3><Bell size={18} /> Notifications</h3>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="notificationsEmail"
                checked={settings.notificationsEmail}
                onChange={handleChange}
              />
              Email Notifications
            </label>
          </div>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="notificationsSMS"
                checked={settings.notificationsSMS}
                onChange={handleChange}
              />
              SMS Notifications
            </label>
          </div>
        </div>

        {/* Security */}
        <div className="settings-section">
          <h3><Eye size={18} /> Security</h3>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="twoFactorAuth"
                checked={settings.twoFactorAuth}
                onChange={handleChange}
              />
              Enable Two-Factor Authentication
            </label>
          </div>
          <div className="form-group">
            <label>Session Timeout (minutes)</label>
            <input
              type="number"
              name="sessionTimeout"
              value={settings.sessionTimeout}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <button className="btn-save" onClick={handleSave}>
        <Save size={18} />
        Save Settings
      </button>
    </div>
  );
}
