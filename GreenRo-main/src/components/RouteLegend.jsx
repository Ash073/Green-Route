import React from 'react';

const RouteLegend = () => {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      border: '2px solid #27ae60',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h4 style={{
        margin: '0 0 12px 0',
        color: '#2c3e50',
        fontSize: '16px',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        Route Options
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '6px',
            backgroundColor: '#27ae60',
            borderRadius: '3px'
          }} />
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            <strong>Primary Route</strong> (Fastest)
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '4px',
            backgroundColor: '#3498db',
            borderRadius: '2px'
          }} />
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            Alternative 1
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '4px',
            backgroundColor: '#e74c3c',
            borderRadius: '2px'
          }} />
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            Alternative 2
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '4px',
            backgroundColor: '#f39c12',
            borderRadius: '2px'
          }} />
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            Alternative 3
          </span>
        </div>
      </div>
      
      <div style={{
        marginTop: '12px',
        padding: '8px',
        background: 'rgba(39, 174, 96, 0.1)',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#27ae60',
        textAlign: 'center'
      }}>
        💡 Click on any route to see details
      </div>
    </div>
  );
};

export default RouteLegend;
