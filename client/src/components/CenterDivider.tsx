import { useEffect, useState } from "react";

/**
 * CenterDivider Component
 * 
 * A subtle, sophisticated vertical divider positioned at the center of the auth page
 * featuring a gentle heartbeat pulse animation with whisper-soft glow effects.
 * 
 * Features:
 * - Ultra-thin vertical line (1px) with soft gradient fade
 * - Barely visible at first glance - whisper, not shout
 * - Smooth traveling pulse animation (gentle medical heartbeat)
 * - Multiple staggered pulses for organic, living feel
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
      
      {/* Animated pulses - smooth heartbeat effect */}
      {!prefersReducedMotion && (
        <>
          <HeartbeatPulse delay={0} />
          <HeartbeatPulse delay={2} />
          <HeartbeatPulse delay={4} />
        </>
      )}
    </div>
  );
}

/**
 * HeartbeatPulse Component
 * 
 * A small, gentle pulse of light that travels smoothly along the divider line.
 * Creates a subtle medical heartbeat effect without being distracting.
 * 
 * @param delay - Animation delay in seconds for staggered effect
 */
function HeartbeatPulse({ delay }: { delay: number }) {
  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2 w-1 h-8"
      style={{
        animation: 'heartbeat-pulse 5s ease-in-out infinite',
        animationDelay: `${delay}s`,
        willChange: 'transform, opacity'
      }}
    >
      <div 
        className="w-full h-full bg-gradient-to-b from-cyan-400/40 via-blue-400/60 to-cyan-400/40 rounded-full"
        style={{
          filter: 'blur(2px)',
          boxShadow: '0 0 10px rgba(34, 211, 238, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)'
        }}
      />
    </div>
  );
}
