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

function PreviousReport() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/data/plans");
      
      const inactivePlans = (Array.isArray(res.data) ? res.data : []).filter(plan => !plan.status);
      setIssues(inactivePlans);
    } catch (error) {
      console.error("Error fetching irrigation plans:", error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
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

  return (
    <Layout>
      <div className="home-container">
        <div className="home-header">
          <div>
            <h1>Irrigation History</h1>
            <p>Completed and inactive irrigation zones</p>
          </div>
        </div>

        {loading ? (
          <div className="home-empty">
            <div className="home-empty-icon">⏳</div>
            <div>Loading history...</div>
          </div>
        ) : issues.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty-icon">📁</div>
            <div>No inactive zones found</div>
            <p>All your fields currently require irrigation.</p>
          </div>
        ) : (
          <div className="home-grid">
            {issues.map((issue, idx) => {
              const statusLabel = "Completed";
              const pumpLabel = "Offline";
              const imageUrl = getImageUrl(issue.crop_type);

              return (
                <article key={issue._id || idx} className="home-card">
                  <div className="home-card-header">
                    <div>
                      <h2>{issue.crop_type ? issue.crop_type : "Crop"}</h2>
                      <p>{issue.region ? issue.region : "Unknown region"}</p>
                    </div>
                    <span className="home-pill home-pill-inactive">
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
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default PreviousReport;
