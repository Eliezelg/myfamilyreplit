import React, { ReactNode } from 'react';

interface PageHeaderProps {
  heading: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  heading,
  description,
  icon,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 pb-4 border-b">
      <div className="flex items-center gap-2">
        {icon && <div className="text-primary">{icon}</div>}
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}
