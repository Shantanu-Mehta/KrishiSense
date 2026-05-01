import { Link, useLocation } from "react-router-dom";
import "./sidebar.css";

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      

      <ul>
        <li className={isActive("/") ? "active" : ""}>
          <Link to="/">📊 Dashboard</Link>
        </li>
        <li className={isActive("/device-status") ? "active" : ""}>
          <Link to="/device-status">🖥️ Device Status</Link>
        </li>
        <li className={isActive("/add-field") ? "active" : ""}>
          <Link to="/add-field">➕ Add Field</Link>
        </li>
        <li className={isActive("/schedules") ? "active" : ""}>
          <Link to="/schedules">📅 Irrigation Schedules</Link>
        </li>
        <li className={isActive("/history") ? "active" : ""}>
          <Link to="/history">📋 History</Link>
        </li>
        <li className={isActive("/alerts") ? "active" : ""}>
          <Link to="/alerts">🔔 Alerts</Link>
        </li>
      </ul>

      <div className="sidebar-footer">
        <p>System Status: Online</p>
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
}