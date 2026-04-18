import React, { useState } from "react";
import { dashboardData } from "../components/DashBoardData";
import Layout from "../components/Layout";
import "./Analytics.css";

function Analytics() {
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const analyticsList = dashboardData.analytics || [];

  return (
    <Layout>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
        {/* Page Header */}
        <div className="analytics-header">
          <div>
            <h1 className="analytics-title">📊 ML Analytics & Predictions</h1>
            <p className="analytics-subtitle">
              Machine Learning analysis of irrigation patterns and water optimization
            </p>
          </div>
        </div>

        {/* Analytics Cards Grid */}
        <div className="analytics-grid">
          {analyticsList.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
              <p>No analytics data available yet</p>
            </div>
          ) : (
            analyticsList.map((crop) => (
              <div
                key={crop.id}
                className={`analytics-card ${
                  expandedCards[crop.id] ? "expanded" : "collapsed"
                }`}
              >
                {/* Card Header - Always Visible */}
                <div className="card-header">
                  <div className="header-content">
                    <h2 className="crop-name">🌾 {crop.cropName}</h2>
                    <div className="header-meta">
                      <span className="field-id">{crop.fieldId}</span>
                      <span className="moisture-badge">
                        💧 {crop.soilMoistureLevel}%
                      </span>
                    </div>
                  </div>
                  <button
                    className={`expand-btn ${
                      expandedCards[crop.id] ? "expanded" : ""
                    }`}
                    onClick={() => toggleCard(crop.id)}
                    title={expandedCards[crop.id] ? "Collapse" : "Expand"}
                  >
                    {expandedCards[crop.id] ? "−" : "+"}
                  </button>
                </div>

                {/* Quick Info - Always Visible */}
                <div className="quick-info">
                  <div className="info-item">
                    <span className="info-label">Last Watered</span>
                    <span className="info-value">{crop.lastWatered}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Next Water</span>
                    <span className="info-value prediction">{crop.prediction}</span>
                  </div>
                </div>

                {/* Expandable Content */}
                {expandedCards[crop.id] && (
                  <div className="expanded-content">
                    {/* ML Analysis */}
                    <div className="analysis-section">
                      <h3>🤖 AI Analysis</h3>
                      <div className="analysis-text">{crop.aiAnalysis}</div>
                    </div>

                    {/* Water Metrics */}
                    <div className="metrics-section">
                      <h3>💧 Water Metrics</h3>
                      <div className="metrics-grid">
                        <div className="metric-item">
                          <span className="metric-label">Soil Moisture</span>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${crop.soilMoistureLevel}%`,
                                background:
                                  crop.soilMoistureLevel > 70
                                    ? "#10b981"
                                    : crop.soilMoistureLevel > 40
                                    ? "#f59e0b"
                                    : "#ef4444",
                              }}
                            ></div>
                          </div>
                          <span className="metric-value">
                            {crop.soilMoistureLevel}%
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Recommended Volume</span>
                          <span className="metric-value">{crop.waterVolume}</span>
                        </div>
                      </div>
                    </div>

                    {/* Water History */}
                    <div className="history-section">
                      <h3>📈 Watering History</h3>
                      <div className="history-table">
                        <div className="history-header">
                          <span>Date</span>
                          <span>Time</span>
                          <span>Volume</span>
                        </div>
                        {crop.waterHistory.map((record, idx) => (
                          <div key={idx} className="history-row">
                            <span>{record.date}</span>
                            <span>{record.time}</span>
                            <span className="volume">{record.volume}L</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Future Plan */}
                    <div className="plan-section">
                      <h3>🎯 Future Watering Plan</h3>
                      <div className="plan-items">
                        <div className="plan-item">
                          <span className="plan-label">Next Scheduled</span>
                          <span className="plan-value">{crop.prediction}</span>
                        </div>
                        <div className="plan-item">
                          <span className="plan-label">Recommended Frequency</span>
                          <span className="plan-value">Every 2 days</span>
                        </div>
                        <div className="plan-item">
                          <span className="plan-label">Average Volume/Cycle</span>
                          <span className="plan-value">{crop.waterVolume}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Analytics;
