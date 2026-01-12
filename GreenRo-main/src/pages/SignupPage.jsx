import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user");
  
  // Vehicle details state
  const [vehicleType, setVehicleType] = useState("car");
  const [vehicleDetails, setVehicleDetails] = useState({
    registrationNumber: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    fuelType: "petrol",
    seatingCapacity: 4,
    rcNumber: "",
    insuranceExpiry: "",
    pollutionCertificateExpiry: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleVehicleDetailChange = (field, value) => {
    setVehicleDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateVehicleDetails = () => {
    if (!vehicleDetails.registrationNumber.trim()) {
      setError("Registration number is required");
      return false;
    }
    if (!vehicleDetails.make.trim()) {
      setError("Vehicle make is required");
      return false;
    }
    if (!vehicleDetails.model.trim()) {
      setError("Vehicle model is required");
      return false;
    }
    if (!vehicleDetails.year || vehicleDetails.year < 2000 || vehicleDetails.year > new Date().getFullYear() + 1) {
      setError("Please enter a valid year");
      return false;
    }
    if (!vehicleDetails.insuranceExpiry) {
      setError("Insurance expiry date is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Validate vehicle details if driver
      if (userType === 'driver' && !validateVehicleDetails()) {
        setLoading(false);
        return;
      }

      const result = await signup(
        name, 
        email, 
        password, 
        userType,
        userType === 'driver' ? { vehicleType, vehicleDetails, phoneNumber } : { phoneNumber }
      );
      
      if (result.success) {
        // Add a small delay to show the loading animation
        setTimeout(() => {
          navigate(userType === 'driver' ? "/driver-dashboard" : "/map");
        }, 1500);
      } else {
        setError(result.error?.message || "Signup failed");
        setLoading(false);
      }
    } catch (err) {
      const msg = err?.message || "Signup failed";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <LoadingSpinner message="Creating your account..." />}
      <div className="page-container" style={{ maxWidth: "600px" }}>
        <h2 style={{ backgroundImage: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Create an Account</h2>
        {error && (
          <div style={{ 
            color: "#e74c3c", backgroundColor: "#fdf2f2", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Full Name *</label>
            <input 
              type="text" 
              placeholder="Enter your full name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Email *</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Phone Number</label>
            <input 
              type="tel" 
              placeholder="Enter your phone number" 
              value={phoneNumber} 
              onChange={e => setPhoneNumber(e.target.value)} 
              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Password *</label>
            <input 
              type="password" 
              placeholder="Create a strong password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
          </div>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#0f172a" }}>Account Type *</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", padding: "0.75rem", border: userType === "user" ? "2px solid #10b981" : "1px solid #e2e8f0", borderRadius: "8px", flex: 1 }}>
                <input 
                  type="radio" 
                  value="user" 
                  checked={userType === "user"} 
                  onChange={e => setUserType(e.target.value)}
                  style={{ marginRight: "0.5rem" }}
                />
                <span style={{ fontWeight: 600 }}>👤 Regular User</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", padding: "0.75rem", border: userType === "driver" ? "2px solid #10b981" : "1px solid #e2e8f0", borderRadius: "8px", flex: 1 }}>
                <input 
                  type="radio" 
                  value="driver" 
                  checked={userType === "driver"} 
                  onChange={e => setUserType(e.target.value)}
                  style={{ marginRight: "0.5rem" }}
                />
                <span style={{ fontWeight: 600 }}>🚗 Driver</span>
              </label>
            </div>
          </div>

          {/* Vehicle Details Section for Drivers */}
          {userType === 'driver' && (
            <div style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)",
              border: "2px solid #d1fae5",
              borderRadius: "8px",
              padding: "1.5rem",
              marginTop: "1rem"
            }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#10b981", display: "flex", alignItems: "center", gap: "0.5rem" }}>🚙 Vehicle Details</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>These details help us verify your vehicle and ensure compliance</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Vehicle Type */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontWeight: 600, color: "#0f172a" }}>Vehicle Type *</label>
                  <select 
                    value={vehicleType}
                    onChange={e => setVehicleType(e.target.value)}
                    style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", cursor: "pointer" }}
                  >
                    <option value="car">🚗 Car</option>
                    <option value="auto">🛺 Auto Rickshaw</option>
                    <option value="bike">🏍️ Bike</option>
                    <option value="scooter">🛴 Scooter</option>
                    <option value="van">🚐 Van</option>
                    <option value="cycle">🚴 Cycle</option>
                  </select>
                </div>

                {/* Registration Number */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontWeight: 600, color: "#0f172a" }}>Registration Number *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., DL01AB1234" 
                    value={vehicleDetails.registrationNumber}
                    onChange={e => handleVehicleDetailChange('registrationNumber', e.target.value)}
                    style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", textTransform: "uppercase" }}
                  />
                </div>

                {/* Make & Model in row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 600, color: "#0f172a" }}>Make *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Maruti" 
                      value={vehicleDetails.make}
                      onChange={e => handleVehicleDetailChange('make', e.target.value)}
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 600, color: "#0f172a" }}>Model *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Swift" 
                      value={vehicleDetails.model}
                      onChange={e => handleVehicleDetailChange('model', e.target.value)}
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                  </div>
                </div>

                {/* Year & Color in row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 600, color: "#0f172a" }}>Year *</label>
                    <input 
                      type="number" 
                      placeholder={new Date().getFullYear().toString()}
                      min="2000"
                      max={new Date().getFullYear() + 1}
                      value={vehicleDetails.year}
                      onChange={e => handleVehicleDetailChange('year', e.target.value)}
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 600, color: "#0f172a" }}>Color</label>
                    <input 
                      type="text" 
                      placeholder="e.g., White" 
                      value={vehicleDetails.color}
                      onChange={e => handleVehicleDetailChange('color', e.target.value)}
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                  </div>
                </div>

                {/* Fuel Type & Seating */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 600, color: "#0f172a" }}>Fuel Type</label>
                    <select 
                      value={vehicleDetails.fuelType}
                      onChange={e => handleVehicleDetailChange('fuelType', e.target.value)}
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", cursor: "pointer" }}
                    >
                      <option value="petrol">⛽ Petrol</option>
                      <option value="diesel">⛽ Diesel</option>
                      <option value="cng">🌱 CNG</option>
                      <option value="lpg">🌱 LPG</option>
                      <option value="electric">⚡ Electric</option>
                      <option value="hybrid">🔋 Hybrid</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 600, color: "#0f172a" }}>Seating Capacity</label>
                    <select 
                      value={vehicleDetails.seatingCapacity}
                      onChange={e => handleVehicleDetailChange('seatingCapacity', e.target.value)}
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", cursor: "pointer" }}
                    >
                      <option value="1">1 Seat</option>
                      <option value="2">2 Seats</option>
                      <option value="3">3 Seats</option>
                      <option value="4">4 Seats</option>
                      <option value="5">5 Seats</option>
                      <option value="6">6 Seats</option>
                      <option value="7">7 Seats</option>
                      <option value="8">8 Seats</option>
                    </select>
                  </div>
                </div>

                {/* RC Number & Expiry Dates */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontWeight: 600, color: "#0f172a" }}>RC Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 12345ABC" 
                    value={vehicleDetails.rcNumber}
                    onChange={e => handleVehicleDetailChange('rcNumber', e.target.value)}
                    style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                </div>

                {/* Insurance & Pollution Expiry */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 600, color: "#0f172a" }}>Insurance Expiry *</label>
                    <input 
                      type="date"
                      value={vehicleDetails.insuranceExpiry}
                      onChange={e => handleVehicleDetailChange('insuranceExpiry', e.target.value)}
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 600, color: "#0f172a" }}>Pollution Certificate Expiry</label>
                    <input 
                      type="date"
                      value={vehicleDetails.pollutionCertificateExpiry}
                      onChange={e => handleVehicleDetailChange('pollutionCertificateExpiry', e.target.value)}
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
              color: "white",
              border: "none",
              padding: "0.875rem 1.5rem",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.3s ease",
              marginTop: "1rem",
              boxShadow: "0 8px 16px rgba(16, 185, 129, 0.3)"
            }}
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "1rem", color: "#64748b" }}>Already have an account? <Link to="/login" style={{ color: "#10b981", fontWeight: 600 }}>Login</Link></p>
      </div>
    </>
  );
}
