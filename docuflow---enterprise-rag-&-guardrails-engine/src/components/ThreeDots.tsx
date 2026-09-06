import React from 'react';
import { motion } from 'motion/react';

interface ThreeDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  label?: string;
}

export const ThreeDots: React.FC<ThreeDotsProps> = ({
  size = 'md',
  color = 'bg-[#5A8DEE]',
  className = '',
  label,
}) => {
  const dotSize =
    size === 'sm'
      ? 'w-1.5 h-1.5'
      : size === 'lg'
      ? 'w-2.5 h-2.5'
      : 'w-2 h-2';

  // Slower, smooth wave animation (1.4s cycle)
  const dotTransition = {
    duration: 1.4,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-label={label || 'Loading...'}
    >
      <div className="inline-flex items-center gap-1.5 py-0.5">
        <motion.span
          className={`${dotSize} rounded-full ${color} inline-block`}
          animate={{
            y: [0, -4, 0],
            opacity: [0.35, 1, 0.35],
            scale: [0.8, 1.15, 0.8],
          }}
          transition={{ ...dotTransition, delay: 0 }}
        />
        <motion.span
          className={`${dotSize} rounded-full ${color} inline-block`}
          animate={{
            y: [0, -4, 0],
            opacity: [0.35, 1, 0.35],
            scale: [0.8, 1.15, 0.8],
          }}
          transition={{ ...dotTransition, delay: 0.28 }}
        />
        <motion.span
          className={`${dotSize} rounded-full ${color} inline-block`}
          animate={{
            y: [0, -4, 0],
            opacity: [0.35, 1, 0.35],
            scale: [0.8, 1.15, 0.8],
          }}
          transition={{ ...dotTransition, delay: 0.56 }}
        />
      </div>
      {label && (
        <span className="text-sm text-[#7A8B9E] font-medium tracking-normal select-none">
          {label}
        </span>
      )}
    </div>
  );
};

export default ThreeDots;

