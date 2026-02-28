import React from 'react';

interface SaaSLayoutProps {
  children: React.ReactNode;
}

export function SaaSLayout({ children }: SaaSLayoutProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {children}
    </div>
  );
}
