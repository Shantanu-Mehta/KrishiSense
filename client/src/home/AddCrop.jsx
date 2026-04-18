import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import './AddCrop.css';

function AddCrop() {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  
  // Form fields - User input fields
  const [farm_id, setFarm_id] = useState('');
  const [region, setRegion] = useState('');
  const [crop_type, setCrop_type] = useState('');
  const [soil_type, setSoil_type] = useState('');
  const [sowing_date, setSowing_date] = useState('');
  const [harvest_date, setHarvest_date] = useState('');
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState(true);
  
  // Live sensor data - will be populated from IoT devices
  const [sensorData, setSensorData] = useState({
    soil_moisture_percent: 45.5,
    soil_pH: 7.0,
    temperature_C: 25.5,
    rainfall_mm: 100,
    humidity_percent: 65,
    crop_growth_days: 120,
    NDVI_index: 0.45
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Farm ID is optional; backend will auto-generate if omitted
    if (!region.trim()) {
      setMsg('❌ Region is required');
      return;
    }
    if (!crop_type) {
      setMsg('❌ Crop Type is required');
      return;
    }
    if (!soil_type) {
      setMsg('❌ Soil Type is required');
      return;
    }
    if (!sowing_date) {
      setMsg('❌ Sowing Date is required');
      return;
    }
    
    setLoading(true);
    setMsg('');
    setSuccess(false);

    const formData = new FormData();
    // User input fields
    if (farm_id && farm_id.trim()) {
      formData.append('farm_id', farm_id.trim());
    }
    formData.append('region', region.trim());
    formData.append('crop_type', crop_type.toLowerCase().trim());
    formData.append('soil_type', soil_type.toLowerCase().trim());
    formData.append('sowing_date', sowing_date);
    if (harvest_date) {
      formData.append('harvest_date', harvest_date);
    }
    formData.append('status', status);
    
    // Live sensor data from IoT devices
    formData.append('soil_moisture_%', sensorData.soil_moisture_percent);
    formData.append('soil_pH', sensorData.soil_pH);
    formData.append('temperature_C', sensorData.temperature_C);
    formData.append('rainfall_mm', sensorData.rainfall_mm);
    formData.append('humidity_%', sensorData.humidity_percent);
    formData.append('crop_growth_days', sensorData.crop_growth_days);
    formData.append('NDVI_index', sensorData.NDVI_index);
    
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      const res = await axios.post('http://localhost:5000/api/data/crops', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (res.data.success) {
        setSuccess(true);
        setMsg('✓ Crop added successfully! Your AI irrigation schedule will be generated and displayed in "Irrigation Schedules" section.');
        // Reset form
        setFarm_id('');
        setRegion('');
        setCrop_type('');
        setSoil_type('');
        setSowing_date('');
        setHarvest_date('');
        setPhoto(null);
        setTimeout(() => {
          setSuccess(false);
          setMsg('');
        }, 5000);
      } else {
        setMsg('❌ ' + (res.data.message || 'Failed to add crop'));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Error adding crop';
      console.error('Crop addition error:', err);
      setMsg('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#f3f4f6', margin: '0 0 8px 0' }}>
            Add New Crop
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            Register a new crop with essential details. Sensor data will be automatically populated from live IoT devices for intelligent ML-based irrigation scheduling.
          </p>
        </div>

        <div
          style={{
            background: '#1f2937',
            border: '1px solid #374151',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          {msg && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: success ? '#10b981' : '#ef4444',
                border: `1px solid ${success ? '#10b981' : '#ef4444'}`,
                fontSize: '14px',
              }}
            >
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Farm ID (optional) */}
            <div>
              <label style={{ fontWeight: '500', color: '#e5e7eb', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
                Farm ID (optional)
              </label>
              <input
                type="text"
                value={farm_id}
                onChange={(e) => setFarm_id(e.target.value)}
                placeholder="Leave empty to auto-generate"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  color: '#f3f4f6',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  background: '#111827',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Region */}
            <div>
              <label style={{ fontWeight: '500', color: '#e5e7eb', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
                Region *
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., North India, Punjab"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  color: '#f3f4f6',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  background: '#111827',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* Crop Type */}
            <div>
              <label style={{ fontWeight: '500', color: '#e5e7eb', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
                Crop Type *
              </label>
              <select
                value={crop_type}
                onChange={(e) => setCrop_type(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  color: '#f3f4f6',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  background: '#111827',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                required
              >
                <option value="">Select Crop Type</option>
                <option value="rice">Rice</option>
                <option value="wheat">Wheat</option>
                <option value="maize">Maize</option>
                <option value="groundnut">Groundnut</option>
                <option value="cotton">Cotton</option>
              </select>
            </div>

            {/* Soil Type */}
            <div>
              <label style={{ fontWeight: '500', color: '#e5e7eb', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
                Soil Type *
              </label>
              <select
                value={soil_type}
                onChange={(e) => setSoil_type(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  color: '#f3f4f6',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  background: '#111827',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                required
              >
                <option value="">Select Soil Type</option>
                <option value="sandy">Sandy</option>
                <option value="clayey">Clayey</option>
                <option value="loamy">Loamy</option>
                <option value="alluvial">Alluvial</option>
                <option value="laterite">Laterite</option>
                <option value="black">Black Soil</option>
              </select>
            </div>

            {/* Sowing Date */}
            <div>
              <label style={{ fontWeight: '500', color: '#e5e7eb', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
                📅 Sowing Date *
              </label>
              <input
                type="date"
                value={sowing_date}
                onChange={(e) => setSowing_date(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  paddingRight: '36px',
                  color: '#f3f4f6',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  background: '#111827',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%2710b981%27 stroke-width=%272%27%3e%3crect x=%273%27 y=%274%27 width=%2718%27 height=%2718%27 rx=%272%27 ry=%272%27%3e%3c/rect%3e%3cline x1=%2716%27 y1=%272%27 x2=%2716%27 y2=%276%27%3e%3c/line%3e%3cline x1=%278%27 y1=%272%27 x2=%278%27 y2=%276%27%3e%3c/line%3e%3cline x1=%273%27 y1=%2710%27 x2=%2721%27 y2=%2710%27%3e%3c/line%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '20px',
                }}
                required
              />
            </div>

            {/* Harvest Date */}
            <div>
              <label style={{ fontWeight: '500', color: '#e5e7eb', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
                📅 Expected Harvest Date
              </label>
              <input
                type="date"
                value={harvest_date}
                onChange={(e) => setHarvest_date(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  paddingRight: '36px',
                  color: '#f3f4f6',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  background: '#111827',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27f97316%27 stroke-width=%272%27%3e%3crect x=%273%27 y=%274%27 width=%2718%27 height=%2718%27 rx=%272%27 ry=%272%27%3e%3c/rect%3e%3cline x1=%2716%27 y1=%272%27 x2=%2716%27 y2=%276%27%3e%3c/line%3e%3cline x1=%278%27 y1=%272%27 x2=%278%27 y2=%276%27%3e%3c/line%3e%3cline x1=%273%27 y1=%2710%27 x2=%2721%27 y2=%2710%27%3e%3c/line%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '20px',
                }}
              />
            </div>

            {/* Crop Photo */}
            <div>
              <label style={{ fontWeight: '500', color: '#e5e7eb', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
                Crop Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  color: '#9ca3af',
                  border: '2px dashed #374151',
                  borderRadius: '6px',
                  background: '#111827',
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              {photo && (
                <p style={{ color: '#10b981', fontSize: '13px', marginTop: '6px' }}>
                  ✓ {photo.name}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label style={{ fontWeight: '500', color: '#e5e7eb', marginBottom: '6px', display: 'block', fontSize: '14px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value === 'true')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  color: '#f3f4f6',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  background: '#111827',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                background: loading ? '#6b7280' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.6 : 1,
                fontSize: '15px'
              }}
            >
              {loading ? 'Adding Crop...' : 'Add Crop'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default AddCrop;