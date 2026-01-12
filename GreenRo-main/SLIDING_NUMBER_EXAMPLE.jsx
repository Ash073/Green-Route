/**
 * Example: How to integrate SlidingNumber into AnalyticsPage
 * 
 * This file shows a practical implementation of the SlidingNumber component
 * in the GreenRoute AnalyticsPage for displaying user statistics.
 */

import { motion } from 'motion/react';
import { SlidingNumber, SlidingNumberStats } from '@/components/ui';
import { useState, useEffect } from 'react';

/**
 * Analytics Statistics Section with Sliding Numbers
 * 
 * Features:
 * - Animated counter for total trips
 * - Real-time CO2 calculation
 * - Money saved metric
 * - Responsive grid layout
 * - Gradient styling matching GreenRoute theme
 */
export function AnalyticsStatisticsSection() {
  const [stats, setStats] = useState({
    totalTrips: 0,
    co2Saved: 0,
    moneySaved: 0,
    avgRating: 4.8
  });

  // Simulate loading data from API
  useEffect(() => {
    // In real app, fetch from: /api/user/analytics or similar
    const mockData = {
      totalTrips: 127,
      co2Saved: 847,
      moneySaved: 2340,
      avgRating: 4.8
    };

    // Animate values up from 0
    const tripInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalTrips: prev.totalTrips >= mockData.totalTrips 
          ? mockData.totalTrips 
          : prev.totalTrips + 3
      }));
    }, 25);

    const co2Interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        co2Saved: prev.co2Saved >= mockData.co2Saved 
          ? mockData.co2Saved 
          : prev.co2Saved + 15
      }));
    }, 20);

    const moneyInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        moneySaved: prev.moneySaved >= mockData.moneySaved 
          ? mockData.moneySaved 
          : prev.moneySaved + 35
      }));
    }, 25);

    return () => {
      clearInterval(tripInterval);
      clearInterval(co2Interval);
      clearInterval(moneyInterval);
    };
  }, []);

  const StatCard = ({ icon, label, value, unit, color, gradient }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, boxShadow: `0 20px 40px ${color}20` }}
      style={{
        padding: '1.5rem',
        background: gradient,
        borderRadius: '12px',
        border: `1px solid ${color}40`,
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
        {icon} {label}
      </div>
      <div style={{ 
        fontSize: '1.875rem', 
        fontWeight: 700, 
        color: color,
        fontFamily: 'monospace',
        marginBottom: '0.5rem'
      }}>
        <SlidingNumber value={value} />
      </div>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
        {unit}
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2rem' }}
      >
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Your Impact Dashboard
        </h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Track your positive environmental impact and savings
        </p>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <StatCard
          icon="🚗"
          label="Trips Completed"
          value={stats.totalTrips}
          unit="eco-friendly rides"
          color="#10b981"
          gradient="linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)"
        />
        <StatCard
          icon="🌱"
          label="CO₂ Saved"
          value={stats.co2Saved}
          unit="kilograms"
          color="#22c55e"
          gradient="linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)"
        />
        <StatCard
          icon="💰"
          label="Money Saved"
          value={stats.moneySaved}
          unit="₹ (Indian Rupees)"
          color="#f97316"
          gradient="linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(244, 63, 94, 0.05) 100%)"
        />
        <StatCard
          icon="⭐"
          label="Average Rating"
          value={Math.round(stats.avgRating * 10) / 10}
          unit="out of 5.0"
          color="#3b82f6"
          gradient="linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)"
        />
      </div>

      {/* Additional insights section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}
      >
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>
          🌍 Environmental Impact
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Equivalent Trees Planted
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
              ~<SlidingNumber value={Math.floor(stats.co2Saved / 20)} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Car Pollution Reduced
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>
              <SlidingNumber value={Math.floor((stats.co2Saved / 2.3) * 100) / 100} decimalSeparator="." /> tons
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Community Rank
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#06b6d4' }}>
              Top <SlidingNumber value={15} />%
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Minimal Statistics Widget - For compact spaces
 * Use in sidebar, cards, or dashboard widgets
 */
export function StatisticsMiniWidget({ label, value, unit, icon, color }) {
  return (
    <div style={{
      padding: '1rem',
      borderRadius: '8px',
      background: `${color}10`,
      border: `1px solid ${color}30`
    }}>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
        {icon} {label}
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: color,
        fontFamily: 'monospace'
      }}>
        <SlidingNumber value={value} />
      </div>
      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
        {unit}
      </div>
    </div>
  );
}

export default AnalyticsStatisticsSection;
