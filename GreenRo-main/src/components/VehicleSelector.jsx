import React, { useState } from 'react';

const VehicleSelector = ({ onVehicleChange, selectedVehicle, mode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const vehicleTypes = {
    car: [
      { id: 'petrol_small', name: 'Petrol - Small Car', emissionFactor: 0.120, description: 'Hatchback, compact car' },
      { id: 'petrol_medium', name: 'Petrol - Medium Car', emissionFactor: 0.192, description: 'Sedan, SUV' },
      { id: 'petrol_large', name: 'Petrol - Large Car', emissionFactor: 0.250, description: 'Large SUV, luxury car' },
      { id: 'diesel_small', name: 'Diesel - Small Car', emissionFactor: 0.110, description: 'Diesel hatchback' },
      { id: 'diesel_medium', name: 'Diesel - Medium Car', emissionFactor: 0.170, description: 'Diesel sedan, SUV' },
      { id: 'diesel_large', name: 'Diesel - Large Car', emissionFactor: 0.220, description: 'Large diesel SUV' },
      { id: 'hybrid', name: 'Hybrid Car', emissionFactor: 0.120, description: 'Petrol-electric hybrid' },
      { id: 'electric', name: 'Electric Car', emissionFactor: 0.053, description: 'Battery electric vehicle' }
    ],
    motorcycle: [
      { id: 'petrol_scooter', name: 'Petrol Scooter', emissionFactor: 0.045, description: '100-150cc scooter' },
      { id: 'petrol_motorcycle', name: 'Petrol Motorcycle', emissionFactor: 0.103, description: '150cc+ motorcycle' },
      { id: 'electric_scooter', name: 'Electric Scooter', emissionFactor: 0.020, description: 'Electric scooter' }
    ],
    bus: [
      { id: 'city_bus', name: 'City Bus', emissionFactor: 0.089, description: 'Urban public bus' },
      { id: 'intercity_bus', name: 'Intercity Bus', emissionFactor: 0.070, description: 'Long-distance bus' },
      { id: 'electric_bus', name: 'Electric Bus', emissionFactor: 0.030, description: 'Electric public bus' }
    ]
  };

  const currentVehicles = vehicleTypes[mode] || vehicleTypes.car;
  const selectedVehicleData = currentVehicles.find(v => v.id === selectedVehicle) || currentVehicles[0];

  const handleVehicleSelect = (vehicle) => {
    onVehicleChange(vehicle);
    setIsOpen(false);
  };

  if (mode !== 'driving' && mode !== 'motorcycle' && mode !== 'bus') {
    return null; // Don't show vehicle selector for other modes
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '0.5rem', 
        fontWeight: '600', 
        color: '#2c3e50' 
      }}>
        Vehicle Type:
      </label>
      
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '1rem'
          }}
        >
          <div>
            <div style={{ fontWeight: '600' }}>{selectedVehicleData.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
              {selectedVehicleData.description}
            </div>
          </div>
          <span style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '2px solid #e0e0e0',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {currentVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => handleVehicleSelect(vehicle)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: 'none',
                  backgroundColor: selectedVehicle === vehicle.id ? '#e8f5e8' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  if (selectedVehicle !== vehicle.id) {
                    e.target.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedVehicle !== vehicle.id) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                    {vehicle.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                    {vehicle.description}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#27ae60',
                  fontWeight: '600'
                }}>
                  {vehicle.emissionFactor.toFixed(3)} kg CO₂/km
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ 
        marginTop: '0.5rem', 
        fontSize: '0.85rem', 
        color: '#7f8c8d',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>🌱</span>
        <span>
          Emission factor: {selectedVehicleData.emissionFactor.toFixed(3)} kg CO₂ per km
        </span>
      </div>
    </div>
  );
};

export default VehicleSelector;
