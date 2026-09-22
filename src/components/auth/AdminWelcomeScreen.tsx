import React, { useEffect, useState } from 'react';

interface AdminWelcomeScreenProps {
  adminName?: string;
  onComplete: () => void;
}

export const AdminWelcomeScreen: React.FC<AdminWelcomeScreenProps> = ({
  adminName = 'Himanshu Choudhary',
  onComplete,
}) => {
  const [animStage, setAnimStage] = useState<'ignite' | 'reveal' | 'radiate' | 'outro'>('ignite');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Stage 1: Initial spark & ignition (0s - 0.7s)
    const t1 = setTimeout(() => setAnimStage('reveal'), 700);

    // Stage 2: Full logo illumination & typographic reveal (0.7s - 2.2s)
    const t2 = setTimeout(() => setAnimStage('radiate'), 2200);

    // Stage 3: Cinematic light swell & dissolve (4.1s)
    const t3 = setTimeout(() => {
      setAnimStage('outro');
      setIsFadingOut(true);
    }, 4100);

    // Complete transition into Dashboard at 4.6s
    const t4 = setTimeout(() => {
      onComplete();
    }, 4600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#03140E',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        /* Cinematic Spotlight Sweep */
        @keyframes spotlightRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.15); }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
        }

        /* Ambient Electric Pulse */
        @keyframes bulbIgnitePulse {
          0% { transform: scale(0.6); opacity: 0; filter: blur(30px) brightness(0.2); }
          35% { transform: scale(1.1); opacity: 1; filter: blur(15px) brightness(2); }
          60% { transform: scale(0.97); opacity: 0.9; filter: blur(10px) brightness(1.4); }
          100% { transform: scale(1); opacity: 1; filter: blur(0px) brightness(1); }
        }

        /* 3D Holographic Tilt & Float */
        @keyframes cinematicFloat {
          0% { transform: translateY(0px) rotateX(0deg) rotateY(0deg); }
          25% { transform: translateY(-8px) rotateX(2deg) rotateY(-2deg); }
          50% { transform: translateY(-12px) rotateX(0deg) rotateY(0deg); }
          75% { transform: translateY(-6px) rotateX(-2deg) rotateY(2deg); }
          100% { transform: translateY(0px) rotateX(0deg) rotateY(0deg); }
        }


        /* Anamorphic Laser Flare Sweep */
        @keyframes anamorphicSweep {
          0% { transform: translateX(-150%) skewX(-35deg); opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateX(180%) skewX(-35deg); opacity: 0; }
        }

        /* Glow Aura Pulsing */
        @keyframes auraBreath {
          0% { opacity: 0.5; transform: scale(0.95); }
          100% { opacity: 0.95; transform: scale(1.15); }
        }

        /* Typography Dramatic Fade In */
        @keyframes titleReveal {
          0% { opacity: 0; transform: translateY(24px) scale(0.95); filter: blur(12px); }
          100% { opacity: 1; transform: translateY(0px) scale(1); filter: blur(0px); }
        }

        /* Floating Light Dust Motes */
        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-160px) translateX(20px); opacity: 0; }
        }
      `}</style>

      {/* 1. Volumetric Rotating Light Cones / Architectural Spotlights */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          width: '900px',
          height: '900px',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.08), rgba(52, 211, 153, 0.22), transparent, rgba(5, 150, 105, 0.18), transparent, rgba(52, 211, 153, 0.22))',
          filter: 'blur(60px)',
          animation: 'spotlightRotate 18s linear infinite',
          pointerEvents: 'none',
        }}
      />

      {/* 2. Deep Radiant Radial Light Chamber */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.35) 0%, rgba(16, 185, 129, 0.15) 40%, rgba(6, 78, 59, 0.05) 70%, transparent 85%)',
          filter: 'blur(50px)',
          animation: 'auraBreath 3.5s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }}
      />


      {/* 4. Floating Light Embers / Showroom Illumination Particles */}
      {[...Array(14)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: `${15 + (i * 5)}%`,
            left: `${15 + (i * 5.8)}%`,
            width: `${(i % 3) * 2 + 3}px`,
            height: `${(i % 3) * 2 + 3}px`,
            borderRadius: '50%',
            backgroundColor: i % 2 === 0 ? '#6EE7B7' : '#A7F3D0',
            boxShadow: '0 0 10px rgba(110, 231, 183, 0.9)',
            animation: `floatParticle ${2.5 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.25)}s`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* 5. Center Stage: The Illuminated Hero Logo Display */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          perspective: '1200px',
        }}
      >
        {/* Animated Brand Capsule Card */}
        <div
          style={{
            position: 'relative',
            animation: 'bulbIgnitePulse 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards, cinematicFloat 5s ease-in-out 1.2s infinite',
            marginBottom: '32px',
          }}
        >
          {/* Intense Back-Glow Halo */}
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.8) 0%, rgba(16, 185, 129, 0.3) 50%, rgba(110, 231, 183, 0.7) 100%)',
              filter: 'blur(22px)',
              opacity: animStage === 'ignite' ? 0.3 : 1,
              transition: 'opacity 0.6s ease',
            }}
          />

          {/* Crisp Pure White Illuminated Stage Card */}
          <div
            style={{
              position: 'relative',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '18px 48px',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(52, 211, 153, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Anamorphic Light Streak Sweeping across the Logo */}
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-60%',
                width: '60px',
                height: '200%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), rgba(52, 211, 153, 0.9), transparent)',
                filter: 'blur(3px)',
                animation: 'anamorphicSweep 2.6s ease-in-out 0.8s infinite',
                pointerEvents: 'none',
              }}
            />

            {/* High-Resolution Brand Logo */}
            <img
              src="/garhwal-lights-logo-landscape-trns.png"
              alt="Garhwal Lights"
              style={{
                height: '84px',
                maxWidth: '340px',
                objectFit: 'contain',
                display: 'block',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))',
              }}
            />
          </div>
        </div>

        {/* 6. Typographic Reveal Sequence (Appears with smooth cinematic motion) */}
        <div
          style={{
            animation: 'titleReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards',
            opacity: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Subtle Ambient Brand Header */}
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#6EE7B7',
              textShadow: '0 0 16px rgba(52, 211, 153, 0.8)',
              marginBottom: '10px',
            }}
          >
            SHOWROOM PORTAL
          </div>

          {/* Grand Welcome Heading */}
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 800,
              margin: '0 0 10px',
              letterSpacing: '-0.025em',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 45%, #6EE7B7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 25px rgba(0, 0, 0, 0.7)',
            }}
          >
            Welcome, {adminName}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.75)',
              margin: 0,
              fontWeight: 500,
              letterSpacing: '0.01em',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
          >
            Garhwal Lights • Shivam Heights, Sikar
          </p>
        </div>
      </div>

      {/* 7. Ambient Horizontal Anamorphic Lens Flare Line across screen */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '0',
          right: '0',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(52, 211, 153, 0.1) 20%, rgba(110, 231, 183, 0.7) 50%, rgba(52, 211, 153, 0.1) 80%, transparent 100%)',
          boxShadow: '0 0 16px rgba(52, 211, 153, 0.8)',
          pointerEvents: 'none',
          animation: 'auraBreath 3s ease-in-out infinite alternate',
        }}
      />
    </div>
  );
};
