import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(5px)'
    }}>
      {/* Main Spinner */}
      <div style={{
        width: '100px',
        height: '100px',
        border: '6px solid #f3f3f3',
        borderTop: '6px solid #27ae60',
        borderRadius: '50%',
        marginBottom: '30px',
        animation: 'spin 1s linear infinite'
      }} />
      
      {/* Dots Animation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#27ae60',
          borderRadius: '50%',
          animation: 'bounce 1.4s ease-in-out infinite both'
        }} />
        <div style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#27ae60',
          borderRadius: '50%',
          animation: 'bounce 1.4s ease-in-out infinite both',
          animationDelay: '-0.16s'
        }} />
        <div style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#27ae60',
          borderRadius: '50%',
          animation: 'bounce 1.4s ease-in-out infinite both',
          animationDelay: '-0.32s'
        }} />
      </div>
      
      <p style={{
        fontSize: '18px',
        color: '#2c3e50',
        fontWeight: '500',
        margin: 0,
        textAlign: 'center'
      }}>
        {message}
      </p>
      
      <style jsx="true">{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
