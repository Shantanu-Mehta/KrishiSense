import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "./Home.css";

function Home() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/data/forms?status=true");
      setIssues(res.data);
    } catch (error) {
      console.error("Error fetching irrigation zones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">🌾 Dashboard</h1>
          <p className="page-subtitle">
            Real-time monitoring of active irrigation zones
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ color: '#9ca3af', fontSize: '16px' }}>Loading zones...</div>
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No active irrigation zones</div>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
              Get started by adding a new irrigation field.
            </p>
          </div>
        ) : (
          <div className="cards">
            {issues.map((issue, idx) => {
              const formatDate = (d) => {
                if (!d) return '—';
                try {
                  return new Date(d).toLocaleDateString();
                } catch {
                  return d;
                }
              };

              return (
                <div key={issue._id || idx} className="card-item">
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    
                    {issue.photo?.data ? (
                      <div style={{ width: 220, height: 140, overflow: 'hidden', borderRadius: 8 }}>
                        <img
                          src={`http://localhost:5000/api/data/forms/image/${issue._id}`}
                          alt={issue.crop_type || 'crop'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: 220, height: 140, borderRadius: 8, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        No Image
                      </div>
                    )}

                   
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0, color: '#1b1b1b', fontSize: 22, fontWeight: 700 }}>
                            {issue.crop_type ? issue.crop_type.toUpperCase() : 'Crop'}
                          </h3>
                          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{issue.region || '—'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: issue.status ? '#10b981' : '#f97316', fontWeight: 700 }}>
                            {issue.status ? '🟢 Active' : '🔴 Inactive'}
                          </div>
                          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                            Added: {formatDate(issue.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Basic Info Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 16, backgroundColor: '#0f172a', padding: 12, borderRadius: 8 }}>
                        <div style={{ color: '#d1d5db', fontSize: 13 }}>
                          <div style={{ color: '#9ca3af', fontSize: 11 }}>Farm ID</div>
                          <div style={{ fontWeight: 600, marginTop: 2 }}>{issue.farm_id || '—'}</div>
                        </div>
                        <div style={{ color: '#d1d5db', fontSize: 13 }}>
                          <div style={{ color: '#9ca3af', fontSize: 11 }}>Soil Type</div>
                          <div style={{ fontWeight: 600, marginTop: 2 }}>{issue.soil_type ? issue.soil_type.toUpperCase() : '—'}</div>
                        </div>
                        <div style={{ color: '#d1d5db', fontSize: 13 }}>
                          <div style={{ color: '#9ca3af', fontSize: 11 }}>Sowing Date</div>
                          <div style={{ fontWeight: 600, marginTop: 2 }}>{formatDate(issue.sowing_date)}</div>
                        </div>
                        <div style={{ color: '#d1d5db', fontSize: 13 }}>
                          <div style={{ color: '#9ca3af', fontSize: 11 }}>Expected Harvest</div>
                          <div style={{ fontWeight: 600, marginTop: 2 }}>{formatDate(issue.harvest_date)}</div>
                        </div>
                      </div>

                      {/* ML Predictions from database */}
                      {issue.recommended_irrigation_mm || issue.mlPredictions ? (
                        <div style={{ marginTop: 16, backgroundColor: '#064e3b', padding: 12, borderRadius: 8, border: '1px solid #10b981' }}>
                          <div style={{ color: '#10b981', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>📊 ML Predictions</div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {issue.recommended_irrigation_mm ? (
                              <div>
                                <div style={{ color: '#9ca3af', fontSize: 11 }}>Recommended Irrigation</div>
                                <div style={{ color: '#f3f4f6', fontWeight: 700, fontSize: 14, marginTop: 2 }}>
                                  {issue.recommended_irrigation_mm} mm
                                </div>
                              </div>
                            ) : null}
                            {issue.mlPredictions?.optimal_irrigation_days ? (
                              <div>
                                <div style={{ color: '#9ca3af', fontSize: 11 }}>Irrigation Frequency</div>
                                <div style={{ color: '#f3f4f6', fontWeight: 700, fontSize: 14, marginTop: 2 }}>
                                  Every {issue.mlPredictions.optimal_irrigation_days} days
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: 16, color: '#9ca3af', fontSize: 12 }}>
                          ⏳ Predictions pending...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Home;
