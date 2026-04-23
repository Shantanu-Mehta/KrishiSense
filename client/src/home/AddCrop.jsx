import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "./AddCrop.css";

function AddCrop() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    crop: '',
    soilType: '',
    sowingDate: '',
    fieldArea: '',
    city: '',
    state: ''
  });

  const [esp32Data, setEsp32Data] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState(null);

  // Fetch ESP32 data on component mount
  useEffect(() => {
    const fetchEsp32Data = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/esp32/latest/ESP32_FIELD_01');
        if (response.ok) {
          const data = await response.json();
          setEsp32Data(data);
        }
      } catch (error) {
        console.error('Failed to fetch ESP32 data:', error);
      }
    };

    fetchEsp32Data();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear validation errors when user starts typing
    if (validationErrors) {
      setValidationErrors(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.crop.trim()) {
      newErrors.crop = 'Crop type is required';
    }

    if (!formData.soilType) {
      newErrors.soilType = 'Please select a soil type';
    }

    if (!formData.sowingDate) {
      newErrors.sowingDate = 'Sowing date is required';
    }

    if (!formData.fieldArea || isNaN(formData.fieldArea) || formData.fieldArea <= 0) {
      newErrors.fieldArea = 'Please enter a valid field area in acres';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    setValidationErrors(null);

    try {
      const response = await fetch('http://localhost:5000/api/irrigation/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Irrigation plan created successfully! Redirecting to schedule view...');

        // Store the plan data in localStorage for the IrrigationSchedule component
        localStorage.setItem('irrigationPlan', JSON.stringify(data.plan));

        // Reset form
        setFormData({
          crop: '',
          soilType: '',
          sowingDate: '',
          fieldArea: '',
          city: '',
          state: ''
        });

        // Navigate to irrigation schedule after a delay
        setTimeout(() => {
          navigate('/schedules');
        }, 2000);
      } else {
        // Handle validation errors
        if (data.error === 'Validation failed' && data.validation) {
          setValidationErrors(data.validation);
        } else {
          setErrors({
            submit: data.error || 'Failed to create irrigation plan'
          });
        }
      }
    } catch (error) {
      console.error('Error creating irrigation plan:', error);
      setErrors({
        submit: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cropTypes = [
    'wheat', 'rice', 'cotton', 'sugarcane', 'maize', 'vegetables', 'fruits'
  ];

  const soilTypes = [
    'loamy', 'sandy', 'clay', 'black', 'red'
  ];

  return (
    <Layout>
      <div className="add-crop-page">
        <div className="add-crop-container">
          {/* Page Header */}
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">🌾 Add New Crop</h1>
              <p className="page-subtitle">Fill in your crop details to generate an irrigation plan</p>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="success-banner">
              <div className="success-icon">✅</div>
              <div className="success-text">{successMessage}</div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors && (
            <div className="validation-error-banner">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <h3>Validation Failed</h3>
                <p><strong>Failed at:</strong> {validationErrors.failedAt}</p>
                <p><strong>Reason:</strong> {validationErrors.reason}</p>
                <p><strong>Suggestion:</strong> {validationErrors.suggestion}</p>
                <div className="validation-checks">
                  <h4>Validation Checks:</h4>
                  <ul>
                    {Object.entries(validationErrors.checks).map(([key, check]) => (
                      <li key={key}>
                        <span className={check.passed ? 'check-passed' : 'check-failed'}>
                          {check.passed ? '✅' : '❌'} {key}: {check.note}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Main Form Card */}
          <div className="form-card">
            <form onSubmit={handleSubmit} className="crop-form">
              {/* Section A — Crop Information */}
              <div className="form-section">
                <div className="section-header">
                  <h2 className="section-title">🌾 Crop Information</h2>
                  <div className="section-divider"></div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="crop">Crop Type *</label>
                    <select
                      id="crop"
                      name="crop"
                      value={formData.crop}
                      onChange={handleInputChange}
                      className={errors.crop ? 'error' : ''}
                    >
                      <option value="">Select crop type</option>
                      {cropTypes.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                    {errors.crop && <span className="error-message">{errors.crop}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="soilType">Soil Type *</label>
                    <select
                      id="soilType"
                      name="soilType"
                      value={formData.soilType}
                      onChange={handleInputChange}
                      className={errors.soilType ? 'error' : ''}
                    >
                      <option value="">Select soil type</option>
                      {soilTypes.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                    {errors.soilType && <span className="error-message">{errors.soilType}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="sowingDate">Sowing Date *</label>
                    <input
                      type="date"
                      id="sowingDate"
                      name="sowingDate"
                      value={formData.sowingDate}
                      onChange={handleInputChange}
                      className={errors.sowingDate ? 'error' : ''}
                    />
                    {errors.sowingDate && <span className="error-message">{errors.sowingDate}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="fieldArea">Field Area (acres) *</label>
                    <input
                      type="number"
                      id="fieldArea"
                      name="fieldArea"
                      value={formData.fieldArea}
                      onChange={handleInputChange}
                      placeholder="e.g., 2.5"
                      min="0.1"
                      step="0.1"
                      className={errors.fieldArea ? 'error' : ''}
                    />
                    {errors.fieldArea && <span className="error-message">{errors.fieldArea}</span>}
                  </div>
                </div>
              </div>

              {/* Section B — Location Details */}
              <div className="form-section">
                <div className="section-header">
                  <h2 className="section-title">📍 Location Details</h2>
                  <div className="section-divider"></div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g., Amritsar"
                      className={errors.city ? 'error' : ''}
                    />
                    {errors.city && <span className="error-message">{errors.city}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="e.g., Punjab"
                      className={errors.state ? 'error' : ''}
                    />
                    {errors.state && <span className="error-message">{errors.state}</span>}
                  </div>
                </div>
              </div>

              {/* ESP32 Data Display */}
              <div className="form-section">
                <div className="section-header">
                  <h2 className="section-title">📊 Current Sensor Data</h2>
                  <div className="section-divider"></div>
                </div>
                <div className="sensor-data-grid">
                  <div className="sensor-item">
                    <span className="sensor-label">Temperature:</span>
                    <span className="sensor-value">{esp32Data ? `${esp32Data.temperature}°C` : 'OFF'}</span>
                  </div>
                  <div className="sensor-item">
                    <span className="sensor-label">Humidity:</span>
                    <span className="sensor-value">{esp32Data ? `${esp32Data.humidity}%` : 'OFF'}</span>
                  </div>
                  <div className="sensor-item">
                    <span className="sensor-label">Soil Moisture:</span>
                    <span className="sensor-value">{esp32Data ? `${esp32Data.soil_moisture}%` : 'OFF'}</span>
                  </div>
                  <div className="sensor-item">
                    <span className="sensor-label">Water Level:</span>
                    <span className="sensor-value">{esp32Data ? `${esp32Data.water_level}%` : 'OFF'}</span>
                  </div>
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="error-banner">{errors.submit}</div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Plan...' : '🚀 Generate Irrigation Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AddCrop;
            