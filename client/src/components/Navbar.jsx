import { Link } from "react-router-dom";
import { dashboardData } from "../components/DashBoardData";
import "./Navbar.css";

export default function Navbar() {
  return (
    <div className="navbar">
      <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}> 🌿 KrishiSense</h3>

      <div className="navbar-right">
        <Link to="/alerts" className="alert-bell">
          <span className="bell-icon">🔔</span>
          {dashboardData.alerts.length > 0 && (
            <span className="alert-badge">{dashboardData.alerts.length}</span>
          )}
        </Link>
        <div className="status">
          <div className="dot"></div>
          <span>System Online</span>
        </div>
      </div>
    </div>
  );
}
