import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import "./IrrigationSchedule.css";

function IrrigationSchedule() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setIsLoading(true);
        if (planId) {
          const res = await fetch(`http://localhost:5000/api/irrigation/plan/${planId}`);
          const data = await res.json();
          if (data.success) {
            setPlan(data.plan);
          }
        } else {
          const res = await fetch(`http://localhost:5000/api/irrigation/plans`);
          const data = await res.json();
          if (data.success && data.plans.length > 0) {
            const latestPlanId = data.plans[0].plan_id;
            const detailRes = await fetch(`http://localhost:5000/api/irrigation/plan/${latestPlanId}`);
            const detailData = await detailRes.json();
            if (detailData.success) {
              setPlan(detailData.plan);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching plan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatWater = (liters) => {
    if (!liters) return "-";
    const amount = Math.ceil(liters);
    return amount >= 1000 ? `${(amount / 1000).toFixed(2)} kL` : `${amount} L`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="schedule-container">
          <div className="loading">Loading schedule...</div>
        </div>
      </Layout>
    );
  }

  if (!plan) {
    return (
      <Layout>
        <div className="schedule-container">
          <div className="schedule-header">
            <h1>Irrigation Schedule</h1>
            <p>No plan found. Create one first.</p>
          </div>
          <button onClick={() => navigate("/add-field")} className="btn-primary">
            Create Plan
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="schedule-container">
        <div className="schedule-header">
          <h1>Irrigation Schedule</h1>
          <p>7-day precise watering plan for {plan.crop}</p>
        </div>

        <div className="plan-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Plan ID</span>
            <span className="summary-value">{plan.plan_id}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Crop</span>
            <span className="summary-value" style={{textTransform: 'capitalize'}}>{plan.crop}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Location</span>
            <span className="summary-value">{plan.location}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Total Water Needed</span>
            <span className="summary-value">{formatWater(plan.water_amount_per_session)}</span>
          </div>
        </div>

        {plan.sensor_data && (
          <div className="sensor-snapshot">
            <h3>Sensor Snapshot</h3>
            <p className="snapshot-subtitle">Field conditions when this plan was generated</p>
            <div className="snapshot-grid">
              <div className="snap-item"><span className="snap-icon">🌡️</span> <strong>Temp:</strong> {plan.sensor_data.temperature || "-"}°C</div>
              <div className="snap-item"><span className="snap-icon">💧</span> <strong>Humidity:</strong> {plan.sensor_data.humidity || "-"}%</div>
              <div className="snap-item"><span className="snap-icon">🌱</span> <strong>Soil Moist:</strong> {plan.sensor_data.soil_moisture || "-"}%</div>
              <div className="snap-item"><span className="snap-icon">⚗️</span> <strong>pH:</strong> {plan.sensor_data.ph ? Number(plan.sensor_data.ph).toFixed(2) : "-"}</div>
              <div className="snap-item"><span className="snap-icon">🌊</span> <strong>Water Lvl:</strong> {plan.sensor_data.water_level || "-"}%</div>
            </div>
          </div>
        )}

        <div className="schedule-list">
          {plan.schedule?.map((day, idx) => (
            <div key={idx} className={`schedule-day-card ${day.should_irrigate ? "active-day" : "skip-day"}`}>
              <div className="day-header">
                <div className="day-title-group">
                  <span className="day-number">Day {day.day}</span>
                  <span className="day-date">{formatDate(day.date)}</span>
                </div>
                <span className={`day-status ${day.should_irrigate ? "status-irrigate" : "status-skip"}`}>
                  {day.should_irrigate ? "💧 Irrigate" : "⏸️ Skip"}
                </span>
              </div>
              
              {day.should_irrigate && day.sessions && day.sessions.length > 0 ? (
                <div className="day-sessions">
                  {day.sessions.map((session, sidx) => (
                    <div key={sidx} className="session-card">
                      <div className="session-header">Session {session.session_number || sidx + 1}</div>
                      <div className="session-details">
                        <div className="session-detail-row">
                          <span className="detail-label">Start Time:</span>
                          <span className="detail-value">{session.time}</span>
                        </div>
                        <div className="session-detail-row">
                          <span className="detail-label">End Time:</span>
                          <span className="detail-value">{session.end_time || "-"}</span>
                        </div>
                        <div className="session-detail-row highlight-row">
                          <span className="detail-label">Amount:</span>
                          <span className="detail-value highlight-value">{formatWater(session.water_amount_liters)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-irrigation-message">
                  Soil moisture is sufficient for this day. No watering needed.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default IrrigationSchedule;
