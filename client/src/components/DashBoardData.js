export const dashboardData = {
  

  analytics: [
    {
      id: 1,
      cropName: "Wheat",
      fieldId: "Field-A1",
      lastWatered: "Yesterday at 6:00 AM",
      soilMoistureLevel: 72,
      prediction: "Water needed in 2 days",
      waterVolume: "2500 liters",
      aiAnalysis: "ML model predicts 85% crop health. Optimal growth conditions detected.",
      waterHistory: [
        { date: "2026-02-05", volume: 2500, time: "06:00 AM" },
        { date: "2026-02-03", volume: 2300, time: "05:30 AM" },
        { date: "2026-02-01", volume: 2500, time: "06:00 AM" }
      ]
    },
    {
      id: 2,
      cropName: "Rice",
      fieldId: "Field-B2",
      lastWatered: "Today at 7:30 AM",
      soilMoistureLevel: 85,
      prediction: "Water needed in 1 day",
      waterVolume: "3000 liters",
      aiAnalysis: "ML model predicts 92% crop health. Excellent irrigation timing.",
      waterHistory: [
        { date: "2026-02-06", volume: 3000, time: "07:30 AM" },
        { date: "2026-02-04", volume: 2900, time: "06:45 AM" },
        { date: "2026-02-02", volume: 3000, time: "07:30 AM" }
      ]
    },
    {
      id: 3,
      cropName: "Corn",
      fieldId: "Field-C3",
      lastWatered: "3 days ago at 5:00 AM",
      soilMoistureLevel: 48,
      prediction: "Water urgently needed",
      waterVolume: "2800 liters",
      aiAnalysis: "ML model predicts 68% crop health. Increase watering frequency.",
      waterHistory: [
        { date: "2026-02-03", volume: 2800, time: "05:00 AM" },
        { date: "2026-02-01", volume: 2700, time: "05:15 AM" },
        { date: "2026-01-30", volume: 2800, time: "05:00 AM" }
      ]
    }
  ],

  alerts: [
    {
      id: 1,
      type: "warning",
      title: "Low Water Level",
      message: "Water level in Field-C3 is critically low (15%). Immediate irrigation required.",
      timestamp: "5 mins ago",
      crop: "Corn"
    },
    {
      id: 2,
      type: "error",
      title: "Device Disconnected",
      message: "IoT sensor in Field-B2 has lost connection. Last signal received 2 hours ago.",
      timestamp: "2 hours ago",
      crop: "Rice"
    },
    {
      id: 3,
      type: "warning",
      title: "Low Energy",
      message: "Solar panel battery at 22% capacity. Charging rate below normal.",
      timestamp: "1 hour ago",
      crop: "All Fields"
    },
    {
      id: 4,
      type: "info",
      title: "Irrigation Completed",
      message: "Field-A1 irrigation cycle completed successfully. Water volume: 2500L",
      timestamp: "3 hours ago",
      crop: "Wheat"
    },
    {
      id: 5,
      type: "warning",
      title: "High Temperature",
      message: "Soil temperature in Field-A1 exceeds optimal range (38°C). Monitor closely.",
      timestamp: "4 hours ago",
      crop: "Wheat"
    },
    {
      id: 6,
      type: "info",
      title: "System Check Passed",
      message: "All sensors and devices passed routine health check.",
      timestamp: "6 hours ago",
      crop: "All Fields"
    }
  ]
};
