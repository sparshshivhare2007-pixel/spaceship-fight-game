import React from 'react';

const Leaderboard = ({ scores, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="leaderboard-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="leaderboard" style={{
        backgroundColor: '#000',
        border: '2px solid #00ff00',
        borderRadius: '20px',
        padding: '30px',
        minWidth: '400px',
        maxWidth: '80%'
      }}>
        <h2 style={{ color: '#00ff00', textAlign: 'center', marginBottom: '20px' }}>
          🏆
