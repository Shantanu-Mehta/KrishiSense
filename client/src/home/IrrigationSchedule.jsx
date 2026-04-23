import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "./IrrigationSchedule.css";

function IrrigationSchedule() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load plan from localStorage
    const savedPlan = localStorage.getItem('irrigationPlan');
    if (savedPlan) {
      try {
        const parsedPlan = JSON.parse(savedPlan);
        setPlan(parsedPlan);
      } catch (error) {
        console.error('Error parsing saved plan:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTodaysWaterAmount = (plan) => {
    const today = new Date().toISOString().split('T')[0];
    const todaysSchedule = plan.schedule?.find(day => day.date === today);
    
    if (!todaysSchedule || !todaysSchedule.should_irrigate || !todaysSchedule.sessions) {
      return 0;
    }
    
    const sessionsToday = todaysSchedule.sessions.length;
    const waterPerSession = plan.water_amount_per_session || 0;
    const fieldArea = plan.field_area || 1; // Default to 1 acre if not specified
    
    return sessionsToday * waterPerSession * fieldArea;
  };

  const getIrrigationStatus = (dayData) => {
    const today = new Date().toISOString().split('T')[0];
    const dayDate = dayData.date;

    if (dayDate < today) return { status: 'completed', color: '#10b981', text: 'Completed' };
    if (dayDate === today) return { status: 'today', color: '#f59e0b', text: 'Today' };
    return { status: 'upcoming', color: '#6b7280', text: 'Upcoming' };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="irrigation-schedule-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading irrigation plan...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!plan) {
    return (
      <Layout>
        <div className="irrigation-schedule-container">
          <div className="schedule-header">
            <h1>💧 Irrigation Schedule</h1>
            <p>AI-powered irrigation plans for optimal crop growth</p>
          </div>
          <div className="no-plans">
            <div className="no-plans-icon">🌱</div>
            <h3>No Irrigation Plan Found</h3>
            <p>Create an irrigation plan by adding a crop first.</p>
            <button
              onClick={() => navigate('/add-field')}
              className="create-plan-button"
            >
              Create Plan
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="irrigation-schedule-container">
        {/* Page Header */}
        <div className="schedule-header">
          <h1>💧 Irrigation Schedule</h1>
          <p>AI-powered irrigation plans for optimal crop growth</p>
        </div>

        {/* Plan Summary Section */}
        <div className="plan-summary">
          <div className="summary-card">
            <h3>📊 Plan Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Plan ID:</span>
                <span className="summary-value">{plan.plan_id}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Crop:</span>
                <span className="summary-value">{plan.crop.charAt(0).toUpperCase() + plan.crop.slice(1)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Season:</span>
                <span className="summary-value">{plan.season}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Location:</span>
                <span className="summary-value">{plan.location}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Should Irrigate:</span>
                <span className="summary-value">
                  {plan.should_irrigate ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Water per Session:</span>
                <span className="summary-value">{plan.water_amount_per_session}L</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Today's Total Water:</span>
                <span className="summary-value">{getTodaysWaterAmount(plan)}L</span>
              </div>
            </div>
          </div>

          <div className="validation-card">
            <h3>✅ Current Status</h3>
            <div className="status-indicators">
              <div className="status-item">
                <span className="status-icon">💧</span>
                <span className="status-text">
                  Irrigation: {plan.should_irrigate ? 'Required' : 'Not Required'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-icon">📅</span>
                <span className="status-text">
                  Plan Duration: 7 Days
                </span>
              </div>
              <div className="status-item">
                <span className="status-icon">🌱</span>
                <span className="status-text">
                  Crop: {plan.crop.charAt(0).toUpperCase() + plan.crop.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            📅 Schedule
          </button>
          <button
            className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            💡 Recommendations
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'schedule' && (
          <div className="schedule-tab">
            <h3>7-Day Irrigation Schedule</h3>
            <div className="schedule-table">
              <div className="table-header">
                <div className="table-cell">Day</div>
                <div className="table-cell">Date</div>
                <div className="table-cell">Irrigation</div>
                <div className="table-cell">Water Amount</div>
                <div className="table-cell">Sessions</div>
                <div className="table-cell">Status</div>
              </div>
              {plan.schedule?.map((day, index) => {
                const dayStatus = getIrrigationStatus(day);
                return (
                  <div key={index} className="table-row">
                    <div className="table-cell">Day {day.day}</div>
                    <div className="table-cell">{formatDate(day.date)}</div>
                    <div className="table-cell">
                      {day.should_irrigate ? '✅ Yes' : '❌ No'}
                    </div>
                    <div className="table-cell">{day.water_amount}L</div>
                    <div className="table-cell">
                      {day.sessions && day.sessions.length > 0 ? (
                        <div className="sessions-list">
                          {day.sessions.map((session, sIndex) => (
                            <div key={sIndex} className="session-item">
                              {formatTime(session.time)} ({session.duration_minutes}min)
                            </div>
                          ))}
                        </div>
                      ) : (
                        'No sessions'
                      )}
                    </div>
                    <div className="table-cell">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: dayStatus.color }}
                      >
                        {dayStatus.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            <h3>🤖 AI Recommendations</h3>
            <div className="recommendations-list">
              {plan.recommendations?.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="recommendation-header">
                    <div className="recommendation-icon">
                      {index === 0 ? '💧' : index === 1 ? '🌱' : '⚠️'}
                    </div>
                    <div className="recommendation-title">
                      {rec.includes('Irrigate') ? 'Irrigation Guidelines' :
                       rec.includes('Water') ? 'Water Management' :
                       rec.includes('Monitor') ? 'Monitoring Tips' : 'General Advice'}
                    </div>
                  </div>
                  <div className="recommendation-content">
                    {rec}
                  </div>
                  <div className="recommendation-actions">
                    <button className="action-button secondary">
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Actions */}
        <div className="plan-actions">
          <button
            onClick={() => navigate('/add-field')}
            className="action-button secondary"
          >
            Create New Plan
          </button>
          <button className="action-button primary">
            Export Schedule
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default IrrigationSchedule;


