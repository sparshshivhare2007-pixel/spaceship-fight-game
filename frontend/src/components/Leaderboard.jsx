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
          🏆 LEADERBOARD 🏆
        </h2>
        
        <div className="scores-list">
          {scores.map((score, index) => (
            <div key={score.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px',
              margin: '5px 0',
              backgroundColor: index === 0 ? 'rgba(255,215,0,0.2)' : 'rgba(0,255,0,0.1)',
              borderRadius: '10px',
              borderLeft: `4px solid ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#00ff00'}`
            }}>
              <span style={{ color: '#fff' }}>
                {index + 1}. {score.name}
              </span>
              <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                {score.score} pts
              </span>
            </div>
          ))}
        </div>
        
        <button onClick={onClose} style={{
          marginTop: '20px',
          padding: '10px 30px',
          background: '#00ff00',
          color: '#000',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          width: '100%',
          fontWeight: 'bold'
        }}>
          Close
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
