import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "./AddCrop.css";

const cropTypes = [
  'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut',
  'Chickpea', 'Lentil', 'Mustard', 'Potato', 'Tomato', 'Onion', 'Garlic',
  'Cabbage', 'Cauliflower', 'Brinjal', 'Chili', 'Cucumber', 'Pumpkin'
];

const soilTypes = [
  'Alluvial soil', 'Black soil', 'Red and Yellow soil', 'Laterite soil',
  'Arid (Desert) soil', 'Saline and Alkaline soil', 'Peaty and Marshy soil',
  'Forest and Mountain soil'
];

function AddCrop() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    crop: "",
    soilType: "",
    sowingDate: "",
    fieldArea: "",
    city: "",
    state: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [createdPlanId, setCreatedPlanId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.crop.trim()) newErrors.crop = "Crop type is required";
    if (!formData.soilType) newErrors.soilType = "Please select soil type";
    if (!formData.sowingDate) newErrors.sowingDate = "Sowing date is required";
    if (!formData.fieldArea || isNaN(formData.fieldArea) || formData.fieldArea <= 0) newErrors.fieldArea = "Enter valid field area";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setSuccessMessage("");
    try {
      const response = await fetch("http://localhost:5000/api/irrigation/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMessage("Plan created successfully!");
        setSuggestions(data.suggestions || []);
        setCreatedPlanId(data.plan.plan_id);
        localStorage.setItem("irrigationPlan", JSON.stringify(data.plan));
      } else {
        setErrors({ submit: data.error || "Failed to create plan", suggestion: data.suggestion });
      }
    } catch (error) {
      setErrors({ submit: "Network error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="add-crop-container">
        <div className="add-crop-header">
          <h1>Add New Crop</h1>
          <p>Fill in details to generate irrigation plan</p>
        </div>

        {successMessage && (
          <div className="suggestion-box success">
            <h4>✅ {successMessage}</h4>
            {suggestions && suggestions.length > 0 && (
              <div className="suggestions-list">
                <p><strong>Sensor Alerts & Suggestions:</strong></p>
                <ul>
                  {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            <button className="submit-btn view-schedule-btn" onClick={() => navigate(`/schedules/${createdPlanId}`)}>
              View Schedule
            </button>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit} className="add-crop-form">
          <div className="form-group">
            <label>Crop Type</label>
            <select name="crop" value={formData.crop} onChange={handleInputChange}>
              <option value="">Select crop</option>
              {cropTypes.map((crop) => (
                <option key={crop} value={crop.toLowerCase()}>{crop}</option>
              ))}
            </select>
            {errors.crop && <span className="error">{errors.crop}</span>}
          </div>

          <div className="form-group">
            <label>Soil Type</label>
            <select name="soilType" value={formData.soilType} onChange={handleInputChange}>
              <option value="">Select soil</option>
              {soilTypes.map((soil) => (
                <option key={soil} value={soil.toLowerCase()}>{soil}</option>
              ))}
            </select>
            {errors.soilType && <span className="error">{errors.soilType}</span>}
          </div>

          <div className="form-group">
            <label>Sowing Date</label>
            <input type="date" name="sowingDate" value={formData.sowingDate} onChange={handleInputChange} />
            {errors.sowingDate && <span className="error">{errors.sowingDate}</span>}
          </div>

          <div className="form-group">
            <label>Field Area (acres)</label>
            <input type="number" name="fieldArea" value={formData.fieldArea} onChange={handleInputChange} min="0.1" step="0.1" />
            {errors.fieldArea && <span className="error">{errors.fieldArea}</span>}
          </div>

          <div className="form-group">
            <label>City</label>
            <input type="text" name="city" value={formData.city} onChange={handleInputChange} />
            {errors.city && <span className="error">{errors.city}</span>}
          </div>

          <div className="form-group">
            <label>State</label>
            <input type="text" name="state" value={formData.state} onChange={handleInputChange} />
            {errors.state && <span className="error">{errors.state}</span>}
          </div>

          {errors.submit && (
            <div className="suggestion-box error">
              <h4>⚠️ Validation Issue</h4>
              <p>{errors.submit}</p>
              {errors.suggestion && <p className="suggestion-text">💡 {errors.suggestion}</p>}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? "Creating..." : "Create Plan"}
          </button>
        </form>
        )}
      </div>
    </Layout>
  );
}

export default AddCrop;
