import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import "./Alerts.css";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch ESP32 data and generate real alerts
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/esp32/latest/ESP32_FIELD_01');
        if (response.ok) {
          const sensorData = await response.json();
          const generatedAlerts = generateAlertsFromSensorData(sensorData);
          setAlerts(generatedAlerts);
        } else {
          // If sensor is offline, show offline alert
          setAlerts([{
            id: 1,
            type: "error",
            title: "Sensor Offline",
            message: "ESP32 sensor is not connected. Unable to retrieve real-time data.",
            timestamp: new Date().toLocaleString(),
            crop: "All Fields"
          }]);
        }
      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
        setAlerts([{
          id: 1,
          type: "error",
          title: "Connection Error",
          message: "Unable to connect to sensor data service.",
          timestamp: new Date().toLocaleString(),
          crop: "All Fields"
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSensorData();
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, []);

  const generateAlertsFromSensorData = (sensorData) => {
    const alerts = [];
    let alertId = 1;

    // Check soil moisture levels
    if (sensorData.soil_moisture < 30) {
      alerts.push({
        id: alertId++,
        type: "error",
        title: "Critical Soil Moisture",
        message: `Soil moisture is critically low at ${sensorData.soil_moisture}%. Immediate irrigation required.`,
        timestamp: new Date().toLocaleString(),
        crop: "All Fields"
      });
    } else if (sensorData.soil_moisture < 50) {
      alerts.push({
        id: alertId++,
        type: "warning",
        title: "Low Soil Moisture",
        message: `Soil moisture is low at ${sensorData.soil_moisture}%. Irrigation may be needed soon.`,
        timestamp: new Date().toLocaleString(),
        crop: "All Fields"
      });
    }

    // Check temperature levels
    if (sensorData.temperature > 35) {
      alerts.push({
        id: alertId++,
        type: "warning",
        title: "High Temperature",
        message: `Temperature is high at ${sensorData.temperature}°C. Monitor crop stress.`,
        timestamp: new Date().toLocaleString(),
        crop: "All Fields"
      });
    }

    // Check water level
    if (sensorData.water_level < 20) {
      alerts.push({
        id: alertId++,
        type: "error",
        title: "Low Water Level",
        message: `Water reservoir is critically low at ${sensorData.water_level}%. Refill required.`,
        timestamp: new Date().toLocaleString(),
        crop: "All Fields"
      });
    } else if (sensorData.water_level < 40) {
      alerts.push({
        id: alertId++,
        type: "warning",
        title: "Low Water Level",
        message: `Water reservoir is low at ${sensorData.water_level}%. Consider refilling.`,
        timestamp: new Date().toLocaleString(),
        crop: "All Fields"
      });
    }

    // Check humidity levels
    if (sensorData.humidity < 40) {
      alerts.push({
        id: alertId++,
        type: "info",
        title: "Low Humidity",
        message: `Humidity is low at ${sensorData.humidity}%. This may affect crop transpiration.`,
        timestamp: new Date().toLocaleString(),
        crop: "All Fields"
      });
    }

    // System status alert
    alerts.push({
      id: alertId++,
      type: "info",
      title: "System Online",
      message: `All sensors are functioning normally. Last update: ${new Date().toLocaleTimeString()}`,
      timestamp: new Date().toLocaleString(),
      crop: "All Fields"
    });

    return alerts;
  };

  const visibleAlerts = alerts.filter((alert) => {
    if (dismissedAlerts.includes(alert.id)) return false;
    if (filterType === "all") return true;
    return alert.type === filterType;
  });

  const dismissAlert = (id) => {
    setDismissedAlerts((prev) => [...prev, id]);
  };

  const dismissAll = () => {
    setDismissedAlerts(alerts.map((a) => a.id));
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
    total: alerts.length,
    unread: visibleAlerts.length,
    errors: alerts.filter((a) => a.type === "error").length,
    warnings: alerts.filter((a) => a.type === "warning").length,
    info: alerts.filter((a) => a.type === "info").length,
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
          <div className="alerts-header">
            <h1 className="alerts-title">🔔 Alerts & Notifications</h1>
            <p className="alerts-subtitle">Loading sensor data...</p>
          </div>
          <div className="loading-spinner" style={{ textAlign: "center", padding: "50px" }}>
            <div className="spinner"></div>
            <p>Fetching real-time alerts...</p>
          </div>
        </div>
      </Layout>
    );
  }

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
