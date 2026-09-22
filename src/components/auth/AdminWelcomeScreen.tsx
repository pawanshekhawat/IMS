import React, { useEffect, useState } from 'react';
import { Sparkles, Check } from 'lucide-react';

interface AdminWelcomeScreenProps {
  adminName?: string;
  onComplete: () => void;
}

export const AdminWelcomeScreen: React.FC<AdminWelcomeScreenProps> = ({
  adminName = 'Himanshu Choudhary',
  onComplete,
}) => {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Total animation duration: 4.5 seconds (4500ms)
    const startTime = Date.now();
    const duration = 4500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed > 1200 && elapsed <= 2500) {
        setPhase(1);
      } else if (elapsed > 2500 && elapsed <= 3800) {
        setPhase(2);
      } else if (elapsed > 3800) {
        setPhase(3);
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 400); // 400ms fade-out transition
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  const milestones = [
    { label: 'Owner Authentication Verified', completed: progress >= 25 },
    { label: 'Connecting to Supabase Cloud Database', completed: progress >= 60 },
    { label: 'Loading Real-Time Inventory & Sales Metrics', completed: progress >= 90 },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(circle at 50% 38%, #0B4F3C 0%, #063729 45%, #021F17 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Ambient Lighting Glow Spheres */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 75%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          animation: 'pulseGlow 3s ease-in-out infinite alternate',
        }}
      />

      <style>{`
        @keyframes pulseGlow {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.95; }
        }
        @keyframes cardFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes ringSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Main Centered Welcome Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '520px',
          width: '90%',
          zIndex: 2,
        }}
      >
        {/* Illuminated Brand Logo Container */}
        <div
          style={{
            position: 'relative',
            marginBottom: '26px',
            animation: 'cardFloat 4s ease-in-out infinite',
          }}
        >
          {/* Outer glowing ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '26px',
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.5), rgba(16, 185, 129, 0.1), rgba(110, 231, 183, 0.4))',
              filter: 'blur(8px)',
            }}
          />

          {/* Crisp Pure White Emblem Card */}
          <div
            style={{
              position: 'relative',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '16px 36px',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/garhwal-lights-logo-landscape-trns.png"
              alt="Garhwal Lights"
              style={{
                height: '70px',
                maxWidth: '280px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Welcome Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '999px',
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.35)',
            color: '#6EE7B7',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          <Sparkles size={13} color="#6EE7B7" />
          <span>Administrator Access Granted</span>
        </div>

        {/* Heading Greeting */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
          }}
        >
          Welcome, {adminName}
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.75)',
            margin: '0 0 28px',
            fontWeight: 500,
          }}
        >
          Garhwal Lights • Retail & Showroom Management System
        </p>

        {/* Smooth Loading Progress Bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            marginBottom: '22px',
          }}
        >
          <div
            style={{
              height: '6px',
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '999px',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)',
                borderRadius: '999px',
                transition: 'width 0.1s linear',
                boxShadow: '0 0 12px rgba(52, 211, 153, 0.7)',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.65)',
              fontWeight: 600,
            }}
          >
            <span>
              {phase === 0 && 'Securing Administrator Credentials...'}
              {phase === 1 && 'Syncing Cloud PostgreSQL Tables...'}
              {phase === 2 && 'Calibrating Inventory & Daily Registers...'}
              {phase === 3 && 'Ready! Opening Portal...'}
            </span>
            <span style={{ color: '#34D399', fontWeight: 800 }}>{progress}%</span>
          </div>
        </div>

        {/* Sub-steps Checklist */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            maxWidth: '380px',
            textAlign: 'left',
          }}
        >
          {milestones.map((step, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12px',
                color: step.completed ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.4)',
                transition: 'color 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: step.completed ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                  border: step.completed ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {step.completed ? (
                  <Check size={11} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.4)' }} />
                )}
              </div>
              <span style={{ fontWeight: step.completed ? 600 : 400 }}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
