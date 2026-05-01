import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "./Home.css";

const images = import.meta.glob('../assets/*.png', { eager: true, import: 'default' });

const getImageUrl = (cropName) => {
  if (!cropName) return null;
  const key = Object.keys(images).find(k => k.toLowerCase().includes(`/${cropName.toLowerCase()}.`));
  return key ? images[key] : null;
};

function Home() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchIssues = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/data/plans");
        if (mounted) {
          setIssues(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error("Error fetching irrigation plans:", error);
          setIssues([]);
          setLoading(false);
        }
      }
    };

    fetchIssues();
    const interval = setInterval(fetchIssues, 10000); 
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  const formatValue = (value, suffix = "") => {
    if (value === null || value === undefined || value === "") return "-";
    return `${value}${suffix}`;
  };

  const handleDeactivate = async (planId) => {
    try {
      const res = await axios.patch(`http://localhost:5000/api/irrigation/plan/${planId}/deactivate`);
      if (res.data.success) {
        setIssues(issues.map(issue => 
          issue.farm_id === planId ? { ...issue, status: false } : issue
        ));
      }
    } catch (error) {
      console.error("Failed to deactivate plan:", error);
      alert("Failed to deactivate the crop plan.");
    }
  };

  return (
    <Layout>
      <div className="home-container">
        <div className="home-header">
          <div>
            <h1>Dashboard</h1>
            <p>Live irrigation zones and sensor summary</p>
          </div>
        </div>

        {loading ? (
          <div className="home-empty">
            <div className="home-empty-icon">⏳</div>
            <div>Loading zones...</div>
          </div>
        ) : issues.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty-icon">🌱</div>
            <div>No active irrigation zones</div>
            <p>Add a new field to start monitoring.</p>
          </div>
        ) : (
          <div className="home-grid">
            {issues.map((issue, idx) => {
              const statusLabel = issue.status ? "Active" : "Inactive";
              const pumpLabel = issue.pump_status === "running"
                ? "Running"
                : issue.pump_status === "idle"
                ? "Idle"
                : "Offline";

              const imageUrl = getImageUrl(issue.crop_type);

              return (
                <article key={issue._id || idx} className="home-card">
                  <div className="home-card-header">
                    <div>
                      <h2 style={{ color: '#3b82f6' }}>{issue.crop_type ? issue.crop_type : "Crop"}</h2>
                      <p>{issue.region ? issue.region : "Unknown region"}</p>
                    </div>
                    <span className={`home-pill ${issue.status ? "home-pill-active" : "home-pill-inactive"}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="home-card-image">
                    {imageUrl ? (
                      <img src={imageUrl} alt={issue.crop_type || "field"} />
                    ) : (
                      <div className="home-card-image-fallback">
                        <span className="fallback-icon">🌿</span>
                        <span>{issue.crop_type || "Field"}</span>
                      </div>
                    )}
                  </div>

                  <div className="home-card-grid">
                    <div>
                      <div className="home-label">Farm ID</div>
                      <div className="home-value">{formatValue(issue.farm_id)}</div>
                    </div>
                    <div>
                      <div className="home-label">Soil type</div>
                      <div className="home-value">{issue.soil_type ? issue.soil_type : "-"}</div>
                    </div>
                    <div>
                      <div className="home-label">Sowing date</div>
                      <div className="home-value">{formatDate(issue.sowing_date)}</div>
                    </div>
                  </div>

                  <div className="home-card-footer">
                    <div className="home-mini-card">
                      <div className="home-mini-title">Pump status</div>
                      <div className="home-mini-value">{pumpLabel}</div>
                    </div>
                    <div className="home-mini-card">
                      <div className="home-mini-title">Added</div>
                      <div className="home-mini-value">{formatDate(issue.createdAt)}</div>
                    </div>
                  </div>

                  <button className="home-button" onClick={() => navigate(`/schedules/${issue.farm_id}`)}>
                    View schedule
                  </button>
                  {issue.status && (
                    <button className="home-button" style={{ background: '#ef4444', marginTop: '8px' }} onClick={() => handleDeactivate(issue.farm_id)}>
                      Deactivate
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Home;
