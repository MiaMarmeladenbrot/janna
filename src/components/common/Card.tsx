import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-stone-200 shadow-sm ${className}`}>
      {title && (
        <div className="px-5 py-3 border-b border-stone-100">
          <h3 className="font-semibold text-stone-800">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
