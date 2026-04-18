import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "./IrrigationSchedule.css";

function IrrigationSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [activeTab, setActiveTab] = useState("list");

  // Fetch schedules from backend
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/data/schedules");
      setSchedules(res.data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#f3f4f6", margin: "0 0 8px 0" }}>
            📅 Irrigation Schedules
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
            AI-predicted irrigation schedules for your crops based on soil, weather, and sensor data
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #374151", paddingBottom: "12px" }}>
          <button
            onClick={() => setActiveTab("list")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: activeTab === "list" ? "#10b981" : "transparent",
              color: activeTab === "list" ? "#fff" : "#9ca3af",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          >
            📋 Schedule List
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: activeTab === "calendar" ? "#10b981" : "transparent",
              color: activeTab === "calendar" ? "#fff" : "#9ca3af",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          >
            🗓️ Calendar View
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              padding: "60px 20px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
            <p style={{ color: "#d1d5db", fontSize: "16px", margin: "0 0 8px 0" }}>
              No irrigation schedules yet
            </p>
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>
              Add crops to generate AI-predicted irrigation schedules
            </p>
          </div>
        ) : activeTab === "list" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
            {schedules.map((schedule, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedSchedule(schedule)}
                style={{
                  background: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "12px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform: selectedSchedule?._id === schedule._id ? "scale(1.02)" : "scale(1)",
                  borderColor: selectedSchedule?._id === schedule._id ? "#10b981" : "#374151",
                  boxShadow: selectedSchedule?._id === schedule._id ? "0 0 20px rgba(16, 185, 129, 0.2)" : "none",
                }}
              >
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ color: "#f3f4f6", fontSize: "18px", fontWeight: "600", margin: "0 0 8px 0" }}>
                    🌾 {schedule.crop_type || "Crop"}
                  </h3>
                  <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                    Farm ID: {schedule.farm_id}
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "16px",
                    padding: "12px",
                    background: "#111827",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 4px 0" }}>Sowing</p>
                    <p style={{ color: "#10b981", fontSize: "14px", fontWeight: "600", margin: 0 }}>
                      {new Date(schedule.sowing_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 4px 0" }}>Harvest</p>
                    <p style={{ color: "#f97316", fontSize: "14px", fontWeight: "600", margin: 0 }}>
                      {new Date(schedule.harvest_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #374151", paddingTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>Water Needed</span>
                    <span style={{ color: "#60a5fa", fontSize: "13px", fontWeight: "600" }}>
                      {schedule.total_water_needed || "N/A"} mm
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>Frequency</span>
                    <span style={{ color: "#a78bfa", fontSize: "13px", fontWeight: "600" }}>
                      {schedule.irrigation_frequency || "N/A"} days
                    </span>
                  </div>
                </div>

                <button
                  style={{
                    marginTop: "12px",
                    width: "100%",
                    padding: "10px",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "13px",
                  }}
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "12px",
              padding: "30px",
            }}
          >
            <div style={{ color: "#d1d5db", textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>📊</div>
              <p>Calendar view will display irrigation schedule timeline</p>
              <p style={{ color: "#9ca3af", fontSize: "13px", marginTop: "8px" }}>
                showing optimal watering dates and amounts
              </p>
            </div>
          </div>
        )}

        {/* Detailed View */}
        {selectedSchedule && (
          <div
            style={{
              marginTop: "32px",
              background: "#1f2937",
              border: "1px solid #10b981",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#f3f4f6", fontSize: "20px", fontWeight: "600", margin: 0 }}>
                Schedule Details: {selectedSchedule.crop_type}
              </h2>
              <button
                onClick={() => setSelectedSchedule(null)}
                style={{
                  background: "transparent",
                  border: "1px solid #374151",
                  color: "#9ca3af",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
              }}
            >
              <div style={{ background: "#111827", padding: "16px", borderRadius: "8px" }}>
                <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 8px 0" }}>Sowing Date</p>
                <p style={{ color: "#10b981", fontSize: "18px", fontWeight: "700", margin: 0 }}>
                  {new Date(selectedSchedule.sowing_date).toLocaleDateString()}
                </p>
              </div>

              <div style={{ background: "#111827", padding: "16px", borderRadius: "8px" }}>
                <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 8px 0" }}>Harvest Date</p>
                <p style={{ color: "#f97316", fontSize: "18px", fontWeight: "700", margin: 0 }}>
                  {new Date(selectedSchedule.harvest_date).toLocaleDateString()}
                </p>
              </div>

              <div style={{ background: "#111827", padding: "16px", borderRadius: "8px" }}>
                <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 8px 0" }}>Total Water Needed</p>
                <p style={{ color: "#60a5fa", fontSize: "18px", fontWeight: "700", margin: 0 }}>
                  {selectedSchedule.total_water_needed || "N/A"} mm
                </p>
              </div>

              <div style={{ background: "#111827", padding: "16px", borderRadius: "8px" }}>
                <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 8px 0" }}>Irrigation Frequency</p>
                <p style={{ color: "#a78bfa", fontSize: "18px", fontWeight: "700", margin: 0 }}>
                  Every {selectedSchedule.irrigation_frequency || "N/A"} days
                </p>
              </div>

              <div style={{ background: "#111827", padding: "16px", borderRadius: "8px" }}>
                <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 8px 0" }}>Crop Growth Days</p>
                <p style={{ color: "#fb923c", fontSize: "18px", fontWeight: "700", margin: 0 }}>
                  {selectedSchedule.crop_growth_days || "N/A"} days
                </p>
              </div>

              <div style={{ background: "#111827", padding: "16px", borderRadius: "8px" }}>
                <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 8px 0" }}>Region</p>
                <p style={{ color: "#e5e7eb", fontSize: "18px", fontWeight: "700", margin: 0 }}>
                  {selectedSchedule.region || "N/A"}
                </p>
              </div>
            </div>

            {selectedSchedule.irrigation_dates && selectedSchedule.irrigation_dates.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{ color: "#e5e7eb", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                  📍 Recommended Irrigation Dates:
                </h3>
                <div
                  style={{
                    background: "#111827",
                    padding: "16px",
                    borderRadius: "8px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {selectedSchedule.irrigation_dates.map((date, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: idx !== selectedSchedule.irrigation_dates.length - 1 ? "1px solid #374151" : "none",
                      }}
                    >
                      <span style={{ color: "#d1d5db", fontSize: "14px" }}>
                        {new Date(date).toLocaleDateString()}
                      </span>
                      <span
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        💧 Irrigate
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default IrrigationSchedule;
