import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import './PreviousReport.css';

function PreviousReport() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/data/forms?status=false");
      setIssues(res.data);
    } catch (error) {
      console.error("Error fetching history:", error);
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
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#f3f4f6', margin: '0 0 8px 0' }}>
            Irrigation History
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            View completed and inactive irrigation zones.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ color: '#9ca3af', fontSize: '16px' }}>Loading...</div>
          </div>
        ) : issues.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '12px',
            }}
          >
            <div style={{ color: '#9ca3af', fontSize: '18px', fontWeight: '500' }}>
              📋 No irrigation history found!
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
              Completed fields will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {issues.map((issue, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#374151';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Image Section */}
                {issue.photo?.data && (
                  <div
                    style={{
                      width: '100%',
                      height: '200px',
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#111827',
                    }}
                  >
                    <img
                      src={`http://localhost:5000/api/data/forms/image/${issue._id}`}
                      alt={issue.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.4s ease',
                      }}
                      draggable={false}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  </div>
                )}

                {/* Content Section */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3
                    style={{
                      fontWeight: '700',
                      fontSize: '18px',
                      color: '#f3f4f6',
                      margin: '0 0 12px 0',
                      lineHeight: '1.3',
                    }}
                  >
                    {issue.title}
                  </h3>

                  <p
                    style={{
                      color: '#d1d5db',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      margin: '0 0 12px 0',
                      flex: 1,
                    }}
                  >
                    {issue.description}
                  </p>

                  {/* Status Badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: issue.status ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: issue.status ? '#10b981' : '#ef4444',
                      fontSize: '12px',
                      fontWeight: '600',
                      width: 'fit-content',
                      border: `1px solid ${issue.status ? '#10b981' : '#ef4444'}`,
                    }}
                  >
                    <span style={{ marginRight: '6px' }}>
                      {issue.status ? '✓' : '●'}
                    </span>
                    {issue.status ? 'Active' : 'Completed'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default PreviousReport;