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
    return new Date(dateString).toLocaleDateString();
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
          <p>7-day plan for {plan.crop}</p>
        </div>

        <div className="plan-summary">
          <div className="summary-item">
            <strong>Plan ID:</strong> {plan.plan_id}
          </div>
          <div className="summary-item">
            <strong>Crop:</strong> {plan.crop}
          </div>
          <div className="summary-item">
            <strong>Location:</strong> {plan.location}
          </div>
          <div className="summary-item">
            <strong>Total Water Needed:</strong> {plan.water_amount_per_session} Liters
          </div>
        </div>

        <div className="schedule-list">
          {plan.schedule?.map((day, idx) => (
            <div key={idx} className={`schedule-day ${day.should_irrigate ? "active" : "inactive"}`}>
              <div className="day-header">
                <span className="day-date">{formatDate(day.date)}</span>
                <span className={`day-status ${day.should_irrigate ? "yes" : "no"}`}>
                  {day.should_irrigate ? "Irrigate" : "Skip"}
                </span>
              </div>
              {day.should_irrigate && day.sessions && (
                <div className="day-sessions">
                  {day.sessions.map((session, sidx) => (
                    <div key={sidx} className="session-card">
                      <div className="session-title">Session {sidx + 1}</div>
                      <div className="session-details">
                        <span><strong>Motor ON:</strong> {session.time}</span>
                        <span><strong>Motor OFF:</strong> {session.end_time || "-"}</span>
                        <span><strong>Amount:</strong> {session.water_amount_liters ? `${Math.ceil(session.water_amount_liters)} L` : "-"}</span>
                      </div>
                    </div>
                  ))}
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
