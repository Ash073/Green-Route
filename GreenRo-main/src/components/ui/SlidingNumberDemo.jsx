import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { SlidingNumber } from './SlidingNumber';

/**
 * SlidingNumberDemo - Demonstrates the SlidingNumber component
 * 
 * Props:
 * - value: The numeric value to display with sliding animation
 * - increment: How much to increment per interval (default: 1)
 * - maxValue: Maximum value to reach (default: 100)
 * - interval: Time between increments in ms (default: 10)
 */
export function SlidingNumberBasic({ 
  maxValue = 100, 
  increment = 1, 
  interval = 10 
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (value >= maxValue) return;

    const timer = setInterval(() => {
      setValue(prev => Math.min(prev + increment, maxValue));
    }, interval);
    
    return () => clearInterval(timer);
  }, [value, maxValue, increment, interval]);

  return (
    <motion.div
      initial={{ y: 0, fontSize: '24px' }}
      animate={{ y: 0, fontSize: '24px' }}
      transition={{
        ease: [1, 0, 0.35, 0.95],
        duration: 1.5,
        delay: 0.3,
      }}
      style={{
        lineHeight: 'normal',
        color: '#000'
      }}
    >
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontFamily: 'monospace',
        fontWeight: 600
      }}>
        <SlidingNumber value={value} />%
      </div>
    </motion.div>
  );
}

/**
 * SlidingNumberStats - Display animated stats with sliding numbers
 * Perfect for dashboards showing trip counts, carbon savings, etc.
 */
export function SlidingNumberStats() {
  const [trips, setTrips] = useState(0);
  const [carbon, setCarbon] = useState(0);
  const [savings, setSavings] = useState(0);

  useEffect(() => {
    const tripInterval = setInterval(() => {
      setTrips(prev => (prev >= 127 ? prev : prev + 1));
    }, 15);
    
    const carbonInterval = setInterval(() => {
      setCarbon(prev => (prev >= 847 ? prev : prev + 5));
    }, 20);
    
    const savingsInterval = setInterval(() => {
      setSavings(prev => (prev >= 2340 ? prev : prev + 10));
    }, 25);

    return () => {
      clearInterval(tripInterval);
      clearInterval(carbonInterval);
      clearInterval(savingsInterval);
    };
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem',
      padding: '2rem'
    }}>
      {/* Trips Completed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}
      >
        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
          🚗 Trips Completed
        </div>
        <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
          <SlidingNumber value={trips} />
        </div>
      </motion.div>

      {/* CO2 Saved */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}
      >
        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
          🌱 CO₂ Saved (kg)
        </div>
        <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}>
          <SlidingNumber value={carbon} />
        </div>
      </motion.div>

      {/* Money Saved */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(244, 63, 94, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(249, 115, 22, 0.2)'
        }}
      >
        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
          💰 Money Saved (₹)
        </div>
        <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#f97316', fontFamily: 'monospace' }}>
          <SlidingNumber value={savings} />
        </div>
      </motion.div>
    </div>
  );
}
