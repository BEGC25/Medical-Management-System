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
 * - Subtle trail/afterglow following each tick
 * - Micro-variation in brightness across different ticks
 * - Midpoint response: brief glow when tick passes screen center
 * - Respects prefers-reduced-motion accessibility preference
 * - Hidden on mobile, visible only on large screens (lg breakpoint)
 * 
 * Design Philosophy: Premium subtlety - users should feel quality without noticing why
 */
export default function CenterDivider() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [midpointActive, setMidpointActive] = useState(false);

  // Check if user prefers reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Trigger midpoint glow periodically
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const interval = setInterval(() => {
      setMidpointActive(true);
      setTimeout(() => setMidpointActive(false), 200);
    }, 6000); // Sync with first tick animation (6s duration)
    
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <div 
      className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 pointer-events-none hidden lg:block z-[5]"
      aria-hidden="true"
    >
      {/* Base divider line - subtle and elegant */}
      <div 
        className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-blue-400/20 to-transparent transition-shadow duration-200"
        style={{ 
          boxShadow: midpointActive 
            ? '0 0 30px rgba(59, 130, 246, 0.25), 0 0 60px rgba(59, 130, 246, 0.12)'
            : '0 0 20px rgba(59, 130, 246, 0.15), 0 0 40px rgba(59, 130, 246, 0.08)',
          filter: 'blur(0.5px)'
        }} 
      />
      
      {/* Midpoint radial glow - subtle center response */}
      {!prefersReducedMotion && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none transition-opacity duration-200"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
            opacity: midpointActive ? 1 : 0,
          }}
        />
      )}
      
      {/* Animated ECG ticks - subtle medical heartbeat cue */}
      {!prefersReducedMotion && (
        <>
          <EKGTick delay={0} brightness={1.0} />
          <EKGTick delay={2} brightness={0.85} />
          <EKGTick delay={4} brightness={0.95} />
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
 * Features a subtle trailing afterglow and variable brightness for organic feel.
 * 
 * @param delay - Animation delay in seconds for staggered effect
 * @param brightness - Brightness multiplier (0.0 - 1.0) for micro-variation
 */
function EKGTick({ delay, brightness }: { delay: number; brightness: number }) {
  // Generate unique IDs for SVG gradient and filter to prevent DOM conflicts
  const gradientId = useId();
  const filterId = useId();
  const trailGradientId = useId();
  
  // Trail opacity constant for easy adjustment
  const TRAIL_OPACITY = 0.3;

  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2"
      style={{
        top: 0,
        width: '24px',
        height: '24px'
      }}
    >
      {/* Trail/afterglow effect - subtle, not comet-like */}
      <div 
        className="absolute w-full h-24 animate-ekg-tick-flow"
        style={{
          animationDelay: `${delay}s`,
          willChange: 'transform, opacity',
          opacity: brightness * TRAIL_OPACITY,
        }}
      >
        <svg 
          width="24" 
          height="96" 
          viewBox="0 0 24 96" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-0 left-0"
        >
          <defs>
            <linearGradient id={trailGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
              <stop offset="50%" stopColor="rgba(59, 130, 246, 0.15)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
            </linearGradient>
          </defs>
          <rect 
            x="11" 
            y="0" 
            width="2" 
            height="96" 
            fill={`url(#${trailGradientId})`}
            rx="1"
          />
        </svg>
      </div>

      {/* Main ECG tick */}
      <div 
        className="w-full h-full animate-ekg-tick-flow relative"
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
          style={{ opacity: brightness }}
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
            Simplified ECG waveform path - stylized QRS complex:
            - Baseline lead-in (2,12 to 6,12)
            - Small upward tick (8,8)
            - Q wave downward deflection (10,16)
            - R wave tall upward spike (12,4) - main feature
            - S wave deep downward (14,20)
            - Return to baseline (16,12 through 18,12 to 22,12)
            Note: This is a stylized micro-waveform for visual effect, not a medically accurate ECG
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
