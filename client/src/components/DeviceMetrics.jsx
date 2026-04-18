import { dashboardData } from "./DashBoardData.js";
import "./devicemetrics.css";
export default function DeviceMetrics() {

  const { connected, active, messages, growth } =
    dashboardData.deviceMetrics;

  return (
    <div className="device-card" style={{ background: '#5128c3', padding: '24px', borderRadius: '12px' }}>

      <div className="device-header" >
        <div>
          <h3>Device Metrics</h3>
          <p className="subtitle">Live device statistics</p>
        </div>

        <div className="active-badge">
          <span className="dot"></span>
          Active
        </div>
      </div>

      <div className="device-grid">

        <div className="device-box">
          <p>Connected Devices</p>
          <h2>{connected}</h2>
        </div>

        <div className="device-box">
          <p>Active Devices</p>
          <h2>{active}</h2>
          <span className="tag">75% online</span>
        </div>

         <div className="device-box">
          <p>Messages / Minute</p>
          <h2>{messages}</h2>
          <span className="growth">↑ {growth}</span>
        </div>

      </div>

    </div>
  );
}