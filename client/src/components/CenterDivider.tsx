import { useEffect, useState, useId } from "react";

/**
 * CenterDivider Component
 * 
 * A subtle, sophisticated vertical divider positioned at the center of the auth page
 * featuring a micro-ECG waveform animation traveling along the line.
 * 
 * Features:
 * - Ultra-thin vertical line (1px) with soft gradient fade
 * - Barely visible at first glance - whisper, not shout
 * - Smooth traveling ECG tick animation (subtle medical heartbeat cue)
 * - Multiple staggered ECG ticks for organic, living feel
 * - Respects prefers-reduced-motion accessibility preference
 * - Hidden on mobile, visible only on large screens (lg breakpoint)
 * 
 * Design Philosophy: Premium subtlety - users should feel quality without noticing why
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
      className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 pointer-events-none hidden lg:block z-[5]"
      aria-hidden="true"
    >
      {/* Base divider line - subtle and elegant */}
      <div 
        className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-blue-400/20 to-transparent"
        style={{ 
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), 0 0 40px rgba(59, 130, 246, 0.08)',
          filter: 'blur(0.5px)'
        }} 
      />
      
      {/* Animated ECG ticks - subtle medical heartbeat cue */}
      {!prefersReducedMotion && (
        <>
          <EKGTick delay={0} />
          <EKGTick delay={2} />
          <EKGTick delay={4} />
        </>
      )}
    </div>
  );
}

/**
 * EKGTick Component
 * 
 * A small ECG waveform segment (micro QRS complex) that travels vertically along the divider.
 * Creates a subtle medical heartbeat cue that's clearly recognizable as an ECG reading.
 * 
 * @param delay - Animation delay in seconds for staggered effect
 */
function EKGTick({ delay }: { delay: number }) {
  // Generate unique IDs for SVG gradient and filter to prevent DOM conflicts
  const gradientId = useId();
  const filterId = useId();

  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2"
      style={{
        top: 0,
        width: '24px',
        height: '24px'
      }}
    >
      <div 
        className="w-full h-full animate-ekg-tick-flow"
        style={{
          animationDelay: `${delay}s`,
          willChange: 'transform, opacity'
        }}
      >
        {/* Micro-ECG waveform SVG - simplified QRS complex */}
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-0 left-0"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34, 211, 238, 0.6)" />
              <stop offset="50%" stopColor="rgba(59, 130, 246, 0.8)" />
              <stop offset="100%" stopColor="rgba(34, 211, 238, 0.6)" />
            </linearGradient>
            <filter id={filterId}>
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* 
            Simplified ECG waveform path representing a QRS complex:
            - Starts with baseline (2,12 to 6,12)
            - P wave small upward deflection (8,8)
            - Q wave small downward (10,16)
            - R wave tall upward spike (12,4)
            - S wave deep downward (14,20)
            - Returns to baseline (16,12) through (18,12) to (22,12)
          */}
          <path
            d="M 2 12 L 6 12 L 8 8 L 10 16 L 12 4 L 14 20 L 16 12 L 18 12 L 22 12"
            stroke={`url(#${gradientId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter={`url(#${filterId})`}
          />
        </svg>
      </div>
    </div>
  );
}
