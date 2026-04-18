import React, { useEffect, useState } from "react";
// Removed DeviceMetrics, SystemInfo, ProtocolDistribution components
import axios from "axios";
import Layout from "../components/Layout";
import "./DeviceStatus.css";

function DeviceStatus() {
  const [refreshTime, setRefreshTime] = useState(new Date().toLocaleTimeString());
  const [sensors, setSensors] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchSensors = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/data/sensor-data?limit=50');
        const data = res.data || [];
        // pick latest entry per sensorType
        const latest = {};
        data.forEach(d => {
          const key = d.sensorType.toLowerCase();
          if (!latest[key] || new Date(d.timestamp) > new Date(latest[key].timestamp)) {
            latest[key] = d;
          }
        });
        if (mounted) {
          setSensors(latest);
          setConnected(Object.keys(latest).length > 0);
        }
      } catch {
          if (mounted) setConnected(false);
        }
    };

    fetchSensors();
    const poll = setInterval(fetchSensors, 5000);
    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {/* Page Header */}
        <div className="device-status-header">
          <div>
            <h1 className="device-status-title">🖥️ Device Status</h1>
            <p className="device-status-subtitle">
              Single-field IoT setup — ESP32 with pH, soil moisture, humidity, and temperature sensors
            </p>
          </div>
          <div className="refresh-info">
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Last Updated</div>
            <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>{refreshTime}</div>
          </div>
        </div>

        
        <div className="metrics-container">
          <div className="metrics-grid">
            <div className="overview-card">
              <h3>System Health Summary</h3>
              <p style={{ margin: 0, color: '#9ca3af' }}>{connected ? 'All sensors reporting' : 'No sensors connected'}</p>
            </div>
            <div className="overview-card">
              <h3>Active Alerts</h3>
              <p style={{ margin: 0, color: '#9ca3af' }}>View recent sensor alerts below</p>
            </div>
          </div>
        </div>

      
        <div className="additional-info">
          <div className="info-card">
            <div className="info-header">
              <h3>System Health</h3>
              <span className="status-indicator">{connected ? '✓ Connected' : '⚠️ Disconnected'}</span>
            </div>
            <div className="health-details">
              <div className="health-item">
                <div className="health-label">Average Response Time</div>
                <div className="health-value">125ms</div>
              </div>
              <div className="health-item">
                <div className="health-label">Network Latency</div>
                <div className="health-value">8ms</div>
              </div>
              <div className="health-item">
                <div className="health-label">Error Rate</div>
                <div className="health-value">0.02%</div>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-header">
              <h3>Active Alerts</h3>
              <span className="alert-count">3</span>
            </div>
            <div className="alerts-list">
              <div className="sensor-list">
                <div className="sensor-item">
                  <div className="sensor-label">Temperature</div>
                  <div className="sensor-value">{sensors.temperature ? sensors.temperature.value + ' °C' : '—'}</div>
                </div>
                <div className="sensor-item">
                  <div className="sensor-label">Humidity</div>
                  <div className="sensor-value">{sensors.humidity ? sensors.humidity.value + ' %' : '—'}</div>
                </div>
                <div className="sensor-item">
                  <div className="sensor-label">Soil Moisture</div>
                  <div className="sensor-value">{sensors['soil moisture'] ? sensors['soil moisture'].value + ' %' : sensors.soil_moisture ? sensors.soil_moisture.value + ' %' : '—'}</div>
                </div>
                <div className="sensor-item">
                  <div className="sensor-label">pH</div>
                  <div className="sensor-value">{sensors.ph ? sensors.ph.value : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DeviceStatus;