import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../api/endpoints.js';
import { ErrorMessage, InfoMessage } from '../components/Alert.jsx';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await analyticsAPI.getSummary();
        if (mounted) setData(res.data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <InfoMessage message="Loading analytics..." />;
  if (error) return <ErrorMessage message={error} onDismiss={() => setError(null)} />;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Analytics Summary</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <StatCard label="Total Trips" value={data?.totalTrips ?? 0} />
        <StatCard label="Completed Trips" value={data?.completedTrips ?? 0} />
        <StatCard label="Total Distance (m)" value={Math.round(data?.totalDistance ?? 0)} />
        <StatCard label="Total Emission" value={(data?.totalEmission ?? 0).toFixed(2)} />
        <StatCard label="Emission Saved" value={(data?.totalSavings ?? 0).toFixed(2)} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ border: '1px solid #e1e4e8', borderRadius: 8, padding: '1rem', background: '#fff' }}>
      <div style={{ color: '#6a737d', fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
