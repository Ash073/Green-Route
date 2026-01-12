// Stepper.jsx
import React from "react";

export default function Stepper({ steps, current }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18,
            background: i === current ? "#28a745" : "#ddd",
            color: "white", lineHeight: "36px", margin: "0 auto"
          }}>{i+1}</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>{s}</div>
        </div>
      ))}
    </div>
  );
}
