import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-stone-800">{title}</h2>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
