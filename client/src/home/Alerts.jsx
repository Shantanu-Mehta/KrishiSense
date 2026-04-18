import React, { useState } from "react";
import { dashboardData } from "../components/DashBoardData";
import Layout from "../components/Layout";
import "./Alerts.css";

function Alerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [filterType, setFilterType] = useState("all");

  const allAlerts = dashboardData.alerts || [];

  const visibleAlerts = allAlerts.filter((alert) => {
    if (dismissedAlerts.includes(alert.id)) return false;
    if (filterType === "all") return true;
    return alert.type === filterType;
  });

  const dismissAlert = (id) => {
    setDismissedAlerts((prev) => [...prev, id]);
  };

  const dismissAll = () => {
    setDismissedAlerts(allAlerts.map((a) => a.id));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "info":
        return "#3b82f6";
      default:
        return "#10b981";
    }
  };

  const alertStats = {
    total: allAlerts.length,
    unread: visibleAlerts.length,
    errors: allAlerts.filter((a) => a.type === "error").length,
    warnings: allAlerts.filter((a) => a.type === "warning").length,
    info: allAlerts.filter((a) => a.type === "info").length,
  };

  return (
    <Layout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Page Header */}
        <div className="alerts-header">
          <div>
            <h1 className="alerts-title">🔔 Alerts & Notifications</h1>
            <p className="alerts-subtitle">
              System notifications and device alerts
            </p>
          </div>
        </div>

        {/* Alert Stats */}
        <div className="alert-stats">
          <div className="stat-card">
            <span className="stat-label">Unread</span>
            <span className="stat-value">{alertStats.unread}</span>
          </div>
          <div className="stat-card error">
            <span className="stat-label">Errors</span>
            <span className="stat-value">{alertStats.errors}</span>
          </div>
          <div className="stat-card warning">
            <span className="stat-label">Warnings</span>
            <span className="stat-value">{alertStats.warnings}</span>
          </div>
          <div className="stat-card info">
            <span className="stat-label">Info</span>
            <span className="stat-value">{alertStats.info}</span>
          </div>
        </div>

        {/* Filter & Actions */}
        <div className="alerts-controls">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              All
            </button>
            <button
              className={`filter-btn ${filterType === "error" ? "active" : ""}`}
              onClick={() => setFilterType("error")}
            >
              Errors
            </button>
            <button
              className={`filter-btn ${filterType === "warning" ? "active" : ""}`}
              onClick={() => setFilterType("warning")}
            >
              Warnings
            </button>
            <button
              className={`filter-btn ${filterType === "info" ? "active" : ""}`}
              onClick={() => setFilterType("info")}
            >
              Info
            </button>
          </div>
          {visibleAlerts.length > 0 && (
            <button className="dismiss-all-btn" onClick={dismissAll}>
              Dismiss All
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="alerts-container">
          {visibleAlerts.length === 0 ? (
            <div className="empty-alerts">
              <div className="empty-icon">✨</div>
              <h2>All caught up!</h2>
              <p>
                {dismissedAlerts.length > 0
                  ? "You've dismissed all alerts."
                  : "No alerts at this time."}
              </p>
            </div>
          ) : (
            <div className="alerts-list">
              {visibleAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-item alert-${alert.type}`}
                  style={{
                    borderLeftColor: getAlertColor(alert.type),
                  }}
                >
                  <div className="alert-icon">{getAlertIcon(alert.type)}</div>

                  <div className="alert-content">
                    <div className="alert-header">
                      <h3 className="alert-title">{alert.title}</h3>
                      <span className="alert-time">{alert.timestamp}</span>
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    <div className="alert-footer">
                      <span className="alert-crop">🌾 {alert.crop}</span>
                    </div>
                  </div>

                  <button
                    className="alert-dismiss"
                    onClick={() => dismissAlert(alert.id)}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Alerts;
