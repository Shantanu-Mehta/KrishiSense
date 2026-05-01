import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <div className="navbar">
      <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}> 🌿 KrishiSense</h3>

      <div className="navbar-right">
        <Link to="/alerts" className="alert-bell">
          <span className="bell-icon">🔔</span>
        </Link>
        <div className="status">
          <div className="dot"></div>
          <span>System Online</span>
        </div>
      </div>
    </div>
  );
}
