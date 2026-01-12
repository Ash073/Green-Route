import { useState, useEffect } from 'react';
import { vehicleAPI } from '../api/endpoints';

export default function VehicleInformation() {
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    fetchVehicleDetails();
    checkDocumentExpiry();
  }, []);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getVehicleDetails();
      setVehicleDetails(response);
      setFormData(response.vehicleDetails);
    } catch (err) {
      setError(err.message || 'Failed to fetch vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const checkDocumentExpiry = async () => {
    try {
      const response = await vehicleAPI.checkDocumentExpiry();
      setExpiryAlerts(response.alerts || []);
    } catch (err) {
      console.error('Failed to check document expiry:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await vehicleAPI.updateVehicleDetails({
        vehicleDetails: formData
      });
      setVehicleDetails({ ...vehicleDetails, vehicleDetails: formData });
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update vehicle details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading vehicle details...</div>;

  const hasAlerts = expiryAlerts.length > 0;
  const expiredDocuments = expiryAlerts.filter(a => a.status === 'expired');
  const expiringDocuments = expiryAlerts.filter(a => a.status === 'expiring_soon');

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '12px',
      padding: '2rem',
      border: '2px solid #e2e8f0',
      marginTop: '2rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            🚙
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: 800 }}>
              Vehicle Information
            </h3>
            <p style={{
              margin: '0.5rem 0 0 0',
              color: '#64748b',
              fontSize: '0.9rem'
            }}>
              Manage your vehicle details and documents
            </p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.3)';
            }}
          >
            ✏️ Edit Details
          </button>
        )}
      </div>

      {/* Alert Section */}
      {hasAlerts && (
        <div style={{
          background: expiredDocuments.length > 0 ? '#fee2e2' : '#fef3c7',
          border: `2px solid ${expiredDocuments.length > 0 ? '#fecaca' : '#fde68a'}`,
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: '0.75rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <h4 style={{
              margin: 0,
              color: expiredDocuments.length > 0 ? '#7f1d1d' : '#78350f',
              fontWeight: 700
            }}>
              {expiredDocuments.length > 0 ? 'Document Expired' : 'Document Expiring Soon'}
            </h4>
          </div>
          {expiredDocuments.map((alert, idx) => (
            <div key={idx} style={{ color: '#7f1d1d', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              ❌ {alert.type === 'insurance' ? 'Insurance' : 'Pollution Certificate'} expired on {new Date(alert.date).toLocaleDateString()}
            </div>
          ))}
          {expiringDocuments.map((alert, idx) => (
            <div key={idx} style={{ color: '#92400e', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              ⏰ {alert.type === 'insurance' ? 'Insurance' : 'Pollution Certificate'} expires on {new Date(alert.date).toLocaleDateString()}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '2px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          color: '#7f1d1d',
          marginBottom: '2rem'
        }}>
          {error}
        </div>
      )}

      {/* Display Section */}
      {!editing && vehicleDetails && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Basic Info Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Basic Information</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Vehicle Type</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#0f172a', fontWeight: 700, fontSize: '1.1rem' }}>
                  {vehicleDetails.vehicleType === 'car' && '🚗 Car'}
                  {vehicleDetails.vehicleType === 'auto' && '🛺 Auto Rickshaw'}
                  {vehicleDetails.vehicleType === 'bike' && '🏍️ Bike'}
                  {vehicleDetails.vehicleType === 'scooter' && '🛴 Scooter'}
                  {vehicleDetails.vehicleType === 'van' && '🚐 Van'}
                  {vehicleDetails.vehicleType === 'cycle' && '🚴 Cycle'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Registration</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>
                  {vehicleDetails.vehicleDetails?.registrationNumber || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Details Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Vehicle Details</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Make & Model</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#0f172a', fontWeight: 700 }}>
                  {vehicleDetails.vehicleDetails?.make} {vehicleDetails.vehicleDetails?.model}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Year</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#0f172a', fontWeight: 700 }}>
                  {vehicleDetails.vehicleDetails?.year || 'Not provided'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Color</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#0f172a', fontWeight: 700 }}>
                  {vehicleDetails.vehicleDetails?.color || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Fuel & Capacity Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Specifications</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Fuel Type</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#0f172a', fontWeight: 700 }}>
                  {vehicleDetails.vehicleDetails?.fuelType ? vehicleDetails.vehicleDetails.fuelType.charAt(0).toUpperCase() + vehicleDetails.vehicleDetails.fuelType.slice(1) : 'Not provided'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Seating Capacity</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#0f172a', fontWeight: 700 }}>
                  {vehicleDetails.vehicleDetails?.seatingCapacity ? `${vehicleDetails.vehicleDetails.seatingCapacity} seats` : 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Documents Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Documents</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Insurance Expiry</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#0f172a', fontWeight: 700 }}>
                  {vehicleDetails.vehicleDetails?.insuranceExpiry
                    ? new Date(vehicleDetails.vehicleDetails.insuranceExpiry).toLocaleDateString()
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Pollution Certificate</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#0f172a', fontWeight: 700 }}>
                  {vehicleDetails.vehicleDetails?.pollutionCertificateExpiry
                    ? new Date(vehicleDetails.vehicleDetails.pollutionCertificateExpiry).toLocaleDateString()
                    : 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section */}
      {editing && formData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Make</label>
              <input
                type="text"
                value={formData.make || ''}
                onChange={(e) => handleInputChange('make', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Model</label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={(e) => handleInputChange('model', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Year</label>
              <input
                type="number"
                value={formData.year || ''}
                onChange={(e) => handleInputChange('year', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Color</label>
              <input
                type="text"
                value={formData.color || ''}
                onChange={(e) => handleInputChange('color', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>RC Number</label>
              <input
                type="text"
                value={formData.rcNumber || ''}
                onChange={(e) => handleInputChange('rcNumber', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Insurance Expiry</label>
              <input
                type="date"
                value={formData.insuranceExpiry ? formData.insuranceExpiry.split('T')[0] : ''}
                onChange={(e) => handleInputChange('insuranceExpiry', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              onClick={() => setEditing(false)}
              style={{
                background: '#e2e8f0',
                color: '#0f172a',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
