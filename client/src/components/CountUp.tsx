import { useEffect, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  separator?: string;
  className?: string;
}

export function CountUp({ end, duration = 2, separator = ',', className }: CountUpProps) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end); // Ensure we end at the exact value
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  
  const formattedCount = separator ? count.toLocaleString() : count.toString();
  
  return <span className={className}>{formattedCount}</span>;
}
