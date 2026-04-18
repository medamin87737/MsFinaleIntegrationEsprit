import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hover?: boolean;
  padding?: 'default' | 'none' | 'sm';
};

export function AppCard({ children, className = '', style, hover = true, padding = 'default' }: Props) {
  const reduced = useReducedMotion();
  const pad =
    padding === 'none' ? { padding: 0 } : padding === 'sm' ? { padding: '0.85rem 1rem' } : undefined;

  if (reduced || !hover) {
    return (
      <div className={`app-card ${className}`.trim()} style={{ ...pad, ...style }}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`app-card ${className}`.trim()}
      style={{ ...pad, ...style }}
      initial={false}
      whileHover={{ y: -2, boxShadow: '0 22px 48px rgba(18, 18, 18, 0.1)' }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}
