import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import "./Alerts.css";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/esp32/latest/ESP32_FIELD_01");
        if (response.ok) {
          const sensorData = await response.json();
          const generatedAlerts = generateAlerts(sensorData);
          setAlerts(generatedAlerts);
        } else {
          setAlerts([{
            id: 1,
            type: "error",
            title: "Sensor Offline",
            message: "ESP32 sensor is not connected.",
            timestamp: new Date().toLocaleString()
          }]);
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
        setAlerts([{
          id: 1,
          type: "error",
          title: "Connection Error",
          message: "Unable to connect to sensor service.",
          timestamp: new Date().toLocaleString()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const generateAlerts = (sensorData) => {
    const alerts = [];
    let id = 1;

    if (sensorData.soil_moisture < 30) {
      alerts.push({
        id: id++,
        type: "error",
        title: "Critical Soil Moisture",
        message: `Soil moisture is critically low at ${sensorData.soil_moisture}%.`,
        timestamp: new Date().toLocaleString()
      });
    } else if (sensorData.soil_moisture < 50) {
      alerts.push({
        id: id++,
        type: "warning",
        title: "Low Soil Moisture",
        message: `Soil moisture is low at ${sensorData.soil_moisture}%.`,
        timestamp: new Date().toLocaleString()
      });
    }

    if (sensorData.temperature > 35) {
      alerts.push({
        id: id++,
        type: "warning",
        title: "High Temperature",
        message: `Temperature is high at ${sensorData.temperature}�C.`,
        timestamp: new Date().toLocaleString()
      });
    }

    if (sensorData.water_level < 20) {
      alerts.push({
        id: id++,
        type: "error",
        title: "Low Water Level",
        message: `Water reservoir is critically low at ${sensorData.water_level}%.`,
        timestamp: new Date().toLocaleString()
      });
    }

    alerts.push({
      id: id++,
      type: "info",
      title: "System Online",
      message: "All sensors are functioning normally.",
      timestamp: new Date().toLocaleString()
    });

    return alerts;
  };

  const getAlertStyle = (type) => {
    switch (type) {
      case "error": return { borderColor: "#ef4444", background: "rgba(239, 68, 68, 0.1)" };
      case "warning": return { borderColor: "#f59e0b", background: "rgba(245, 158, 11, 0.1)" };
      case "info": return { borderColor: "#3b82f6", background: "rgba(59, 130, 246, 0.1)" };
      default: return {};
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="alerts-container">
          <div className="alerts-header">
            <h1>Alerts & Notifications</h1>
            <p>Loading alerts...</p>
          </div>
          <div className="loading">Fetching real-time alerts...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="alerts-container">
        <div className="alerts-header">
          <h1>Alerts & Notifications</h1>
          <p>Real-time sensor alerts</p>
        </div>

        <div className="alerts-list">
          {alerts.map((alert) => (
            <div key={alert.id} className="alert-item" style={getAlertStyle(alert.type)}>
              <div className="alert-header">
                <h3>{alert.title}</h3>
                <span className="alert-time">{alert.timestamp}</span>
              </div>
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Alerts;
