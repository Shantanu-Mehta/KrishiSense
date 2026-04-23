import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "./DeviceStatus.css";

function DeviceStatus() {
  const [esp32Data, setEsp32Data] = useState(null);
  const [pumpStatus, setPumpStatus] = useState('OFF');
  const [lastSync, setLastSync] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [manualDuration, setManualDuration] = useState(10);
  const [error, setError] = useState(null);
  const [lastSyncText, setLastSyncText] = useState('Never');

  // Poll ESP32 live data every 10 seconds
  useEffect(() => {
    let mounted = true;

    const fetchEsp32Data = async () => {
      try {
        setError(null);
        const res = await axios.get('http://localhost:5000/api/esp32/latest/ESP32_FIELD_01');
        if (mounted) {
          setEsp32Data(res.data);
          setLastSync(Date.now());
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to fetch ESP32 data:', error);
          setError('Failed to connect to ESP32 device');
          setEsp32Data(null);
          setPumpStatus('UNKNOWN');
        }
      }
    };

    fetchEsp32Data();
    const interval = setInterval(fetchEsp32Data, 10000); // Poll every 10 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Update last sync text every second
  useEffect(() => {
    const updateSyncText = () => {
      if (lastSync === 0) {
        setLastSyncText('Never');
      } else {
        const seconds = Math.floor((Date.now() - lastSync) / 1000);
        if (seconds < 60) {
          setLastSyncText(`${seconds}s ago`);
        } else {
          const minutes = Math.floor(seconds / 60);
          setLastSyncText(`${minutes}m ago`);
        }
      }
    };

    updateSyncText();
    const interval = setInterval(updateSyncText, 1000);
    return () => clearInterval(interval);
  }, [lastSync]);

  const isLive = lastSync && (Date.now() - lastSync) < 120000; // 2 minutes

  const handleTakeReading = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://localhost:5000/api/esp32/trigger/ESP32_FIELD_01');
      if (res.data.success) {
        setEsp32Data(res.data.data);
        setLastSync(Date.now());
        alert('Reading taken successfully!');
      }
    } catch (error) {
      console.error('Failed to take reading:', error);
      setError('Failed to take reading: ' + (error.response?.data?.error || error.message));
    }
    setIsLoading(false);
  };

  const handlePumpControl = async (action) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.post(`http://localhost:5000/api/esp32/pump/ESP32_FIELD_01`, {
        action: action,
        duration_minutes: manualDuration
      });
      if (res.data.success) {
        setPumpStatus(res.data.command === 'PUMP_ON' ? 'ON' : 'OFF');
        alert(`Pump ${action.toLowerCase()} command sent successfully!`);
      }
    } catch (error) {
      console.error('Failed to control pump:', error);
      setError('Failed to control pump: ' + (error.response?.data?.error || error.message));
    }
    setIsLoading(false);
  };

  const getSensorStatus = (sensorName, value) => {
    const now = Date.now();
    const lastUpdate = esp32Data ? new Date(esp32Data.timestamp).getTime() : 0;
    const timeDiff = (now - lastUpdate) / 1000 / 60; // minutes

    if (timeDiff > 2) return { status: 'Offline 🔴', color: '#ef4444' };
    if (!value && value !== 0) return { status: 'No Data ⚠️', color: '#f59e0b' };

    switch (sensorName) {
      case 'soil_moisture':
        if (value >= 5 && value <= 95) return { status: 'Online 🟢', color: '#10b981' };
        return { status: 'Warning 🟡', color: '#f59e0b' };
      case 'ph':
        if (value >= 4 && value <= 10) return { status: 'Online 🟢', color: '#10b981' };
        return { status: 'Warning 🟡', color: '#f59e0b' };
      case 'water_level':
        if (value >= 5 && value <= 95) return { status: 'Online 🟢', color: '#10b981' };
        return { status: 'Warning 🟡', color: '#f59e0b' };
      case 'temperature':
        if (value >= 0 && value <= 60) return { status: 'Online 🟢', color: '#10b981' };
        return { status: 'Warning 🟡', color: '#f59e0b' };
      case 'humidity':
        if (value >= 10 && value <= 90) return { status: 'Online 🟢', color: '#10b981' };
        return { status: 'Warning 🟡', color: '#f59e0b' };
      default:
        return { status: 'Online 🟢', color: '#10b981' };
    }
  };

  return (
    <Layout>
      <div className="device-status-container">
        {/* Section 1 — Page Header */}
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">
              📡 Device Manager
            </h1>
            <p className="page-subtitle">
              ESP32_FIELD_01 — Live Monitoring
            </p>
          </div>
          <div className="header-right">
            <div className={`live-badge ${isLive ? 'live' : 'offline'}`}>
              <div className="live-dot"></div>
              <span>{isLive ? 'Live' : 'Offline'}</span>
            </div>
            <div className="sync-info">
              <div className="sync-label">Last synced</div>
              <div className="sync-value">{lastSyncText}</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        {/* Section 2 — Sensor Status Grid */}
        <div className="sensor-grid">
          {/* Temperature Sensor */}
          <div className="sensor-card">
            <div className="sensor-icon">🌡️</div>
            <div className="sensor-info">
              <h4>Temperature</h4>
              <div className="sensor-value">
                {esp32Data?.temperature ? `${esp32Data.temperature.toFixed(1)}°C` : '—'}
              </div>
              <div className="sensor-status" style={{ color: getSensorStatus('temperature', esp32Data?.temperature).color }}>
                {getSensorStatus('temperature', esp32Data?.temperature).status}
              </div>
            </div>
          </div>

          {/* Humidity Sensor */}
          <div className="sensor-card">
            <div className="sensor-icon">💧</div>
            <div className="sensor-info">
              <h4>Humidity</h4>
              <div className="sensor-value">
                {esp32Data?.humidity ? `${esp32Data.humidity.toFixed(1)}%` : '—'}
              </div>
              <div className="sensor-status" style={{ color: getSensorStatus('humidity', esp32Data?.humidity).color }}>
                {getSensorStatus('humidity', esp32Data?.humidity).status}
              </div>
            </div>
          </div>

          {/* Soil Moisture Sensor */}
          <div className="sensor-card">
            <div className="sensor-icon">🌱</div>
            <div className="sensor-info">
              <h4>Soil Moisture</h4>
              <div className="sensor-value">
                {esp32Data?.soil_moisture ? `${esp32Data.soil_moisture.toFixed(1)}%` : '—'}
              </div>
              <div className="sensor-status" style={{ color: getSensorStatus('soil_moisture', esp32Data?.soil_moisture).color }}>
                {getSensorStatus('soil_moisture', esp32Data?.soil_moisture).status}
              </div>
            </div>
          </div>

          {/* pH Sensor */}
          <div className="sensor-card">
            <div className="sensor-icon">🧪</div>
            <div className="sensor-info">
              <h4>pH Level</h4>
              <div className="sensor-value">
                {esp32Data?.ph ? esp32Data.ph.toFixed(2) : '—'}
              </div>
              <div className="sensor-status" style={{ color: getSensorStatus('ph', esp32Data?.ph).color }}>
                {getSensorStatus('ph', esp32Data?.ph).status}
              </div>
            </div>
          </div>

          {/* Water Level Sensor */}
          <div className="sensor-card">
            <div className="sensor-icon">🚰</div>
            <div className="sensor-info">
              <h4>Water Level</h4>
              <div className="sensor-value">
                {esp32Data?.water_level ? `${esp32Data.water_level.toFixed(1)}%` : '—'}
              </div>
              <div className="sensor-status" style={{ color: getSensorStatus('water_level', esp32Data?.water_level).color }}>
                {getSensorStatus('water_level', esp32Data?.water_level).status}
              </div>
            </div>
          </div>

          {/* Pump/Relay Status */}
          <div className="sensor-card">
            <div className="sensor-icon">💡</div>
            <div className="sensor-info">
              <h4>Relay/Pump</h4>
              <div className="sensor-value" style={{ color: pumpStatus === 'ON' ? '#3b82f6' : '#6b7280' }}>
                {pumpStatus}
              </div>
              <div className="sensor-status" style={{ color: '#10b981' }}>
                Online 🟢
              </div>
            </div>
          </div>
        </div>

        {/* Manual Controls */}
        <div className="controls-section">
          <h2>Manual Controls</h2>
          <div className="controls-grid">
            <div className="control-card">
              <h3>📡 Take Reading Now</h3>
              <p>Get latest sensor data immediately</p>
              <button
                onClick={handleTakeReading}
                disabled={isLoading}
                className="control-button primary"
              >
                {isLoading ? 'Loading...' : 'Take Reading'}
              </button>
            </div>

            <div className="control-card">
              <h3>💧 Pump Control</h3>
              <p>Manual pump activation</p>
              <div className="pump-controls">
                <label>Duration (minutes):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(parseInt(e.target.value) || 10)}
                  className="duration-input"
                />
                <div className="pump-buttons">
                  <button
                    onClick={() => handlePumpControl('ON')}
                    disabled={isLoading}
                    className="control-button success"
                  >
                    Turn ON
                  </button>
                  <button
                    onClick={() => handlePumpControl('OFF')}
                    disabled={isLoading}
                    className="control-button danger"
                  >
                    Turn OFF
                  </button>
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