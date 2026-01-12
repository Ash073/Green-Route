import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <nav style={{ background: "rgba(255, 255, 255, 0.98)", backdropFilter: "blur(20px)", borderBottom: "1px solid #e2e8f0", padding: "1rem 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)" }}>
      <h1 
        onClick={handleLogoClick}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          margin: 0,
          fontSize: "1.5rem",
          fontWeight: 700,
          background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        🌱 GreenRoute
      </h1>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        {isAuthenticated ? (
          <>
            <span style={{ color: "#64748b", fontWeight: 500, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {user?.name || user?.email}
              {user?.userType === 'driver' && (
                <span style={{ 
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", 
                  color: "white", 
                  padding: "0.35rem 0.75rem", 
                  borderRadius: "12px", 
                  fontSize: "0.75rem", 
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)"
                }}>
                  🚗 Driver
                </span>
              )}
            </span>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
              {user?.userType === 'driver' ? (
                <>
                  <Link to="/driver-dashboard" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "all 0.3s", fontSize: "0.95rem" }} onMouseEnter={(e) => e.target.style.color = "#10b981"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Dashboard</Link>
                  <Link to="/navigation" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "all 0.3s", fontSize: "0.95rem" }} onMouseEnter={(e) => e.target.style.color = "#10b981"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Navigation</Link>
                  <Link to="/analytics" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "all 0.3s", fontSize: "0.95rem" }} onMouseEnter={(e) => e.target.style.color = "#10b981"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Analytics</Link>
                  <Link to="/profile" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "all 0.3s", fontSize: "0.95rem" }} onMouseEnter={(e) => e.target.style.color = "#10b981"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Profile</Link>
                </>
              ) : (
                <>
                  <Link to="/map" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "all 0.3s", fontSize: "0.95rem" }} onMouseEnter={(e) => e.target.style.color = "#10b981"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Map</Link>
                  <Link to="/navigation" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "all 0.3s", fontSize: "0.95rem" }} onMouseEnter={(e) => e.target.style.color = "#10b981"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Navigation</Link>
                  <Link to="/analytics" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "all 0.3s", fontSize: "0.95rem" }} onMouseEnter={(e) => e.target.style.color = "#10b981"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Analytics</Link>
                  <Link to="/profile" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "all 0.3s", fontSize: "0.95rem" }} onMouseEnter={(e) => e.target.style.color = "#10b981"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Profile</Link>
                </>
              )}
            </div>
            <button 
              onClick={logout}
              style={{ 
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", 
                border: "none", 
                color: "white",
                padding: "0.625rem 1.25rem",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.3s",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)",
                fontSize: "0.95rem"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(239, 68, 68, 0.2)"; }}
            >
              Logout
            </button>
          </>
        ) : (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Link to="/login" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "all 0.3s", fontSize: "0.95rem" }} onMouseEnter={(e) => e.target.style.color = "#10b981"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Login</Link>
            <Link to="/signup" style={{ background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", color: "white", textDecoration: "none", padding: "0.625rem 1.25rem", borderRadius: "10px", fontWeight: 600, transition: "all 0.3s", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)", fontSize: "0.95rem" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.2)"; }}>Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
