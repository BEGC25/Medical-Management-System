import { useEffect, useState } from "react";

/**
 * CenterDivider Component
 * 
 * A sophisticated vertical divider positioned at the center of the auth page
 * featuring an animated EKG/heartbeat pattern with gradient glow effects.
 * 
 * Features:
 * - Vertical gradient line with fade at top and bottom
 * - Soft blue/cyan glow effect
 * - Animated medical EKG heartbeat patterns traveling vertically
 * - Respects prefers-reduced-motion accessibility preference
 * - Hidden on mobile, visible only on large screens (lg breakpoint)
 */
export default function CenterDivider() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check if user prefers reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div 
      className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-1 pointer-events-none hidden lg:block z-[5]"
      aria-hidden="true"
    >
      {/* Base gradient line - fades at top and bottom */}
      <svg 
        className="absolute inset-0 w-full h-full overflow-visible"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Vertical gradient for the base line */}
          <linearGradient id="dividerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
            <stop offset="3%" stopColor="rgba(59, 130, 246, 0.4)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.7)" />
            <stop offset="97%" stopColor="rgba(59, 130, 246, 0.4)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </linearGradient>
          
          {/* Gradient for heartbeat pattern - brighter cyan */}
          <linearGradient id="heartbeatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0)" />
            <stop offset="30%" stopColor="rgba(34, 211, 238, 0.8)" />
            <stop offset="50%" stopColor="rgba(34, 211, 238, 1)" />
            <stop offset="70%" stopColor="rgba(34, 211, 238, 0.8)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
          </linearGradient>
        </defs>
        
        {/* Main vertical line */}
        <line 
          x1="50%" 
          y1="0" 
          x2="50%" 
          y2="100%" 
          stroke="url(#dividerGradient)" 
          strokeWidth="2"
        />
      </svg>

      {/* Glow effect layer - pulsing softly */}
      <div 
        className="absolute inset-0 animate-glow-pulse"
        style={{
          boxShadow: `
            0 0 25px rgba(59, 130, 246, 0.6),
            0 0 50px rgba(59, 130, 246, 0.4),
            0 0 75px rgba(59, 130, 246, 0.2),
            0 0 100px rgba(59, 130, 246, 0.1)
          `,
        }}
      />

      {/* Animated heartbeat patterns */}
      {!prefersReducedMotion && (
        <>
          <HeartbeatPath delay={0} />
          <HeartbeatPath delay={1.67} />
          <HeartbeatPath delay={3.33} />
        </>
      )}
    </div>
  );
}

/**
 * HeartbeatPath Component
 * 
 * Renders an animated EKG/heartbeat pattern that travels vertically
 * Features a realistic ECG waveform with P wave, QRS complex, and T wave
 * 
 * @param delay - Animation delay in seconds for staggered effect
 */
function HeartbeatPath({ delay }: { delay: number }) {
  return (
    <svg 
      className="absolute left-1/2 -translate-x-1/2 w-20 h-40 overflow-visible"
      style={{
        animation: 'heartbeat-flow 5s linear infinite',
        animationDelay: `${delay}s`,
      }}
      viewBox="0 0 80 160"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Realistic EKG heartbeat pattern path */}
      {/* Flat baseline -> P wave -> QRS complex (sharp spike) -> T wave -> baseline */}
      <path
        d="M 40 10 L 40 50 L 38 55 L 40 60 L 42 62 L 40 65 L 40 70 L 35 75 L 40 40 L 50 95 L 40 70 L 40 75 L 43 85 L 40 90 L 40 150"
        stroke="url(#heartbeatGradient)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.7)) drop-shadow(0 0 20px rgba(34, 211, 238, 0.4))',
        }}
      />
    </svg>
  );
}
