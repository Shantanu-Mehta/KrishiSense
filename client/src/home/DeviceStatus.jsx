import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "./DeviceStatus.css";

function DeviceStatus() {
  const [esp32Data, setEsp32Data] = useState(null);
  const [pumpStatus, setPumpStatus] = useState("OFF");
  const [lastSync, setLastSync] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [manualDuration, setManualDuration] = useState(10);
  const [error, setError] = useState(null);
  const [lastSyncText, setLastSyncText] = useState("Never");

  useEffect(() => {
    let mounted = true;

    const fetchEsp32Data = async () => {
      try {
        setError(null);
        const res = await axios.get("http://localhost:5000/api/esp32/latest/ESP32_FIELD_01");
        if (mounted) {
          setEsp32Data(res.data);
          setLastSync(Date.now());
        }
      } catch (err) {
        if (mounted) {
          console.error("Failed to fetch ESP32 data:", err);
          setError("Failed to connect to ESP32 device");
          setEsp32Data(null);
          setPumpStatus("UNKNOWN");
        }
      }
    };

    fetchEsp32Data();
    const interval = setInterval(fetchEsp32Data, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updateSyncText = () => {
      if (lastSync === 0) {
        setLastSyncText("Never");
        return;
      }
      const seconds = Math.floor((Date.now() - lastSync) / 1000);
      setLastSyncText(seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`);
    };

    updateSyncText();
    const interval = setInterval(updateSyncText, 1000);
    return () => clearInterval(interval);
  }, [lastSync]);

  const sensorData = {
    temperature: esp32Data?.temperature ?? null,
    humidity: esp32Data?.humidity ?? null,
    soil_moisture: esp32Data?.soil_moisture ?? esp32Data?.soilMoisture ?? null,
    ph: esp32Data?.ph ?? null,
    water_level: esp32Data?.water_level ?? esp32Data?.waterLevel ?? null,
    timestamp: esp32Data?.timestamp ? new Date(esp32Data.timestamp) : null,
  };

  const timestampValid = sensorData.timestamp instanceof Date && !isNaN(sensorData.timestamp.getTime());
  const sensorAgeMs = timestampValid ? Date.now() - sensorData.timestamp.getTime() : Infinity;
  const isLive = timestampValid && sensorAgeMs <= 120000;

  const isSensorOffline = (value) => !timestampValid || sensorAgeMs > 120000 || value === null || value === undefined;

  const getSensorStatus = (sensorName, value) => {
    if (isSensorOffline(value)) {
      return { status: "Offline", variant: "offline" };
    }

    const range = {
      soil_moisture: [5, 95],
      ph: [4, 10],
      water_level: [5, 95],
      temperature: [0, 60],
      humidity: [10, 90],
    };

    const [min, max] = range[sensorName] || [null, null];
    if (min === null) return { status: "Online", variant: "online" };
    return value >= min && value <= max
      ? { status: "Online", variant: "online" }
      : { status: "Warning", variant: "warning" };
  };

  const formatSensorValue = (value, decimals = 1, suffix = "") => {
    if (value === null || value === undefined || value === "") return "-";
    return `${Number(value).toFixed(decimals)}${suffix}`;
  };

  const handleTakeReading = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.post("http://localhost:5000/api/esp32/trigger/ESP32_FIELD_01");
      if (res.data.success) {
        setEsp32Data(res.data.data);
        setLastSync(Date.now());
      }
    } catch (err) {
      console.error("Failed to take reading:", err);
      setError("Failed to take reading: " + (err.response?.data?.error || err.message));
    }
    setIsLoading(false);
  };

  const handlePumpControl = async (action) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.post(`http://localhost:5000/api/esp32/pump/ESP32_FIELD_01`, {
        action,
        duration_minutes: manualDuration,
      });
      if (res.data.success) {
        setPumpStatus(res.data.command === "PUMP_ON" ? "ON" : "OFF");
      }
    } catch (err) {
      console.error("Failed to control pump:", err);
      setError("Failed to control pump: " + (err.response?.data?.error || err.message));
    }
    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="device-status-container">
        <div className="status-header">
          <div>
            <h1>Device Manager</h1>
            <p>ESP32_FIELD_01 live status and controls</p>
          </div>
          <div className="status-meta">
            <span className={`live-chip ${isLive ? "live" : "offline"}`}>{isLive ? "Live" : "Offline"}</span>
            <div className="sync-block">
              <div>Last synced</div>
              <strong>{lastSyncText}</strong>
            </div>
          </div>
        </div>

        {error && <div className="status-error">{error}</div>}

        <div className="sensor-grid">
          {[
            { label: "Temperature", value: formatSensorValue(sensorData.temperature, 1, "°C"), icon: "🌡️", status: getSensorStatus("temperature", sensorData.temperature) },
            { label: "Humidity", value: formatSensorValue(sensorData.humidity, 1, "%"), icon: "💧", status: getSensorStatus("humidity", sensorData.humidity) },
            { label: "Soil Moisture", value: formatSensorValue(sensorData.soil_moisture, 1, "%"), icon: "🌱", status: getSensorStatus("soil_moisture", sensorData.soil_moisture) },
            { label: "pH Level", value: formatSensorValue(sensorData.ph, 2, ""), icon: "⚗️", status: getSensorStatus("ph", sensorData.ph) },
            { label: "Water Level", value: formatSensorValue(sensorData.water_level, 1, "%"), icon: "🌊", status: getSensorStatus("water_level", sensorData.water_level) },
            { label: "Relay/Pump", value: pumpStatus, icon: "⚡", status: { status: pumpStatus, variant: pumpStatus === "ON" ? "online" : "offline" } },
          ].map((sensor) => (
            <div key={sensor.label} className="sensor-card">
              <div className="sensor-card-icon">{sensor.icon}</div>
              <div>
                <div className="sensor-card-label">{sensor.label}</div>
                <div className="sensor-card-value">{sensor.value}</div>
                <span className={`sensor-chip ${sensor.status.variant}`}>{sensor.status.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="controls-row">
          <div className="control-panel">
            <h2>Manual controls</h2>
            <div className="control-group">
              <button onClick={handleTakeReading} disabled={isLoading} className="btn btn-primary">
                {isLoading ? "Reading..." : "Take reading"}
              </button>
            </div>
            <div className="control-group">
              <label>Pump duration (minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={manualDuration}
                onChange={(e) => setManualDuration(parseInt(e.target.value, 10) || 10)}
              />
              <div className="pump-buttons">
                <button onClick={() => handlePumpControl("ON")} disabled={isLoading} className="btn btn-success">
                  Turn ON
                </button>
                <button onClick={() => handlePumpControl("OFF")} disabled={isLoading} className="btn btn-danger">
                  Turn OFF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DeviceStatus;