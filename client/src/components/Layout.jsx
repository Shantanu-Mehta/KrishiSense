import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "./Layout.css";

function Layout({ children }) {
  return (
    <div
      className="dashboard-container"
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <Sidebar />

      <div
        className="main-content"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <Navbar />

        <div style={{ padding: "32px", flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;
